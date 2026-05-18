import { api } from './client';
import type { UserProfileResponse } from './user';

// GET /api/profiles → 소개팅 상대 프로필 목록
export function getDateProfiles(): Promise<UserProfileResponse[]> {
  return api.get<UserProfileResponse[]>('/api/profiles');
}

// POST /api/dating/requests
// 대화 신청 (기회 사용 필요)
export function sendDateRequest(to_user_id: number): Promise<{ id: number; status: string }> {
  return api.post<{ id: number; status: string }>('/api/dating/requests', { to_user_id });
}
