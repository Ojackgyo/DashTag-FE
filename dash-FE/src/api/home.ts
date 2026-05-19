import { api } from './client';
import type { UserProfileResponse } from './user';

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

// GET /api/dating/requests
// 받은 대쉬 + 보낸 대쉬 모두 포함
export function getDatingRequests(): Promise<DatingRequestResponse[]> {
  return api.get<DatingRequestResponse[]>('/api/dating/requests');
}

// PUT /api/dating/requests/{id}
export function updateDatingRequest(requestId: number, status: 'accepted' | 'rejected'): Promise<DatingRequestResponse> {
  return api.put<DatingRequestResponse>(`/api/dating/requests/${requestId}`, { status });
}
