import { api } from './client';
import { sanitizePlainText } from '../lib/security';

export interface MeetingCreatedResponse {
  id: number;
  creator_id: number;
  title: string;
  required_male: number;
  required_female: number;
  scheduled_at: string;
  is_active: boolean;
  created_at: string;
  invite_code?: string | null;
  chat_room_id?: number | null;
}
export interface MeetingResponse extends MeetingCreatedResponse {
  keywords: string[];
  participant_count: number;
  male_count: number;
  female_count: number;
  is_joined: boolean;
}
export interface MeetingCreate {
  title: string;
  required_male: number;
  required_female: number;
  scheduled_at: string;
}
type MeetingApiResponse = {
  id: number; creatorId: number; title: string; requiredMale: number; requiredFemale: number;
  scheduledAt: string; active: boolean; createdAt: string;
  inviteCode?: string | null; chatRoomId?: number | null;
};
type MeetingDetailApiResponse = MeetingApiResponse & {
  participantCount: number; maleCount: number; femaleCount: number; joined: boolean;
};
function toCreated(m: MeetingApiResponse): MeetingCreatedResponse {
  return { id: m.id, creator_id: m.creatorId, title: m.title, required_male: m.requiredMale,
    required_female: m.requiredFemale, scheduled_at: m.scheduledAt, is_active: m.active,
    created_at: m.createdAt, invite_code: m.inviteCode, chat_room_id: m.chatRoomId };
}
function toMeeting(m: MeetingDetailApiResponse): MeetingResponse {
  return { ...toCreated(m), keywords: [], participant_count: m.participantCount,
    male_count: m.maleCount, female_count: m.femaleCount, is_joined: m.joined };
}
export async function getMeetingPage(cursor?: number) {
  const params = new URLSearchParams({ size: '20' });
  if (cursor != null) params.set('cursor', String(cursor));
  const page = await api.get<{ items: MeetingDetailApiResponse[]; nextCursor: number | null; hasNext: boolean }>(`/api/meetings?${params}`);
  if (page.hasNext && (page.nextCursor == null || (cursor != null && page.nextCursor >= cursor))) throw new Error('미팅 다음 페이지를 불러올 수 없어요');
  return { ...page, items: page.items.map(toMeeting) };
}
export async function getMeeting(id: number): Promise<MeetingResponse> {
  return toMeeting(await api.get<MeetingDetailApiResponse>(`/api/meetings/${id}`));
}
export async function createMeeting(body: MeetingCreate): Promise<MeetingCreatedResponse> {
  const title = sanitizePlainText(body.title, 100).trim();
  if (!title) throw new Error('미팅 제목을 입력해주세요');
  if ([body.required_male, body.required_female].some(n => !Number.isInteger(n) || n < 2 || n > 5)) throw new Error('성별 정원은 각각 2~5명으로 선택해주세요');
  const instant = new Date(`${body.scheduled_at}+09:00`).getTime();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00$/.test(body.scheduled_at) || !Number.isFinite(instant) || instant <= Date.now()) throw new Error('한국 시간 기준 미래 일정을 선택해주세요');
  return toCreated(await api.post<MeetingApiResponse>('/api/meetings', {
    title, requiredMale: body.required_male, requiredFemale: body.required_female, scheduledAt: body.scheduled_at,
  }));
}
export async function joinMeeting(id: number): Promise<MeetingResponse> {
  return toMeeting(await api.post<MeetingDetailApiResponse>(`/api/meetings/${id}/join`));
}
export async function joinMeetingByCode(code: string): Promise<MeetingResponse> {
  const inviteCode = code.trim().toUpperCase();
  if (!/^[0-9A-F]{32}$/.test(inviteCode)) throw new Error('초대코드는 영문 A~F와 숫자로 된 32자리예요');
  return toMeeting(await api.post<MeetingDetailApiResponse>('/api/meetings/join-by-code', { inviteCode }));
}
export function leaveMeeting(id: number): Promise<void> {
  return api.delete<void>(`/api/meetings/${id}/leave`);
}
export interface MeetingParticipant {
  user_id: number; nickname: string; gender: string; face_type?: string | null;
  mbti?: string | null; charm_points: string[]; joined_at?: string;
}
export async function getMeetingParticipants(id: number): Promise<MeetingParticipant[]> {
  const participants = await api.get<{ memberId: number; nickname: string; gender: string; faceType?: string | null; mbti?: string | null; charmPoints?: string[]; joinedAt?: string }[]>(`/api/meetings/${id}/participants`);
  return participants.map(p => ({ user_id: p.memberId, nickname: p.nickname, gender: p.gender.toLowerCase(),
    face_type: p.faceType, mbti: p.mbti, charm_points: p.charmPoints ?? [], joined_at: p.joinedAt }));
}
