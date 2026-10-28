import { api } from './client';
import type { UserProfileResponse } from './user';

export type DatingStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export interface DatingRequestResponse {
  id: number;
  from_user_id: number;
  to_user_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  message?: string | null;
  from_user?: UserProfileResponse | null;
  to_user?: UserProfileResponse | null;
}
interface DatingItem {
  id: number; senderId: number; receiverId: number; status: DatingStatus;
  createdAt: string; respondedAt: string | null; message: string | null;
  counterpart: { memberId: number; nickname: string; age: number; majorName: string; faceType: string; mbti: string };
}
export interface DatingPage {
  items: DatingRequestResponse[]; nextCursor: number | null; hasNext: boolean;
}
export async function getDatingRequestPage(direction: 'sent' | 'received', options: { status?: DatingStatus; cursor?: number; size?: number } = {}): Promise<DatingPage> {
  const params = new URLSearchParams({ size: String(options.size ?? 50) });
  if (options.status) params.set('status', options.status);
  if (options.cursor != null) params.set('cursor', String(options.cursor));
  const page = await api.get<{ items: DatingItem[]; nextCursor: number | null; hasNext: boolean }>(`/api/dating/requests/${direction}?${params}`);
  return { ...page, items: page.items.map(item => {
    const c = item.counterpart;
    const counterpart: UserProfileResponse = { id: c.memberId, nickname: c.nickname, age: c.age, major: c.majorName, face_type: c.faceType, mbti: c.mbti };
    return { id: item.id, from_user_id: item.senderId, to_user_id: item.receiverId,
      status: item.status.toLowerCase() as DatingRequestResponse['status'], created_at: item.createdAt, message: item.message,
      ...(direction === 'sent' ? { to_user: counterpart } : { from_user: counterpart }) };
  }) };
}
async function getAll(direction: 'sent' | 'received') {
  const items: DatingRequestResponse[] = [];
  let cursor: number | undefined;
  for (;;) {
    const page = await getDatingRequestPage(direction, { cursor });
    items.push(...page.items);
    if (!page.hasNext) return items;
    if (page.nextCursor == null || (cursor != null && page.nextCursor >= cursor)) throw new Error('소개팅 목록의 다음 페이지 정보를 확인할 수 없어요');
    cursor = page.nextCursor;
  }
}
export async function getDatingRequests(): Promise<DatingRequestResponse[]> {
  const [sent, received] = await Promise.all([getAll('sent'), getAll('received')]);
  return [...sent, ...received].sort((a, b) => b.id - a.id);
}
export interface DatingAcceptResponse { requestId: number; status: DatingStatus; respondedAt: string; chatRoomId: number }
export function acceptDatingRequest(requestId: number) {
  return api.post<DatingAcceptResponse>(`/api/dating/requests/${requestId}/accept`);
}
export function rejectDatingRequest(requestId: number) {
  return api.post<{ id: number; status: DatingStatus }>(`/api/dating/requests/${requestId}/reject`);
}
