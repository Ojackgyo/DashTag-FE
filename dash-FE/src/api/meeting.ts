import { api } from './client';

export interface MeetingResponse {
  id: number;
  creator_id: number;
  title: string;
  keywords: string[];
  required_male: number;
  required_female: number;
  scheduled_at?: string | null;
  is_active: boolean;
  created_at: string;
  participant_count: number;
  is_joined: boolean;
}

export interface MeetingCreate {
  title: string;
  keywords?: string[];
  required_male?: number;
  required_female?: number;
  scheduled_at?: string | null;
}

// GET /api/meetings
export function getMeetings(): Promise<MeetingResponse[]> {
  return api.get<MeetingResponse[]>('/api/meetings');
}

// GET /api/meetings/{id}
export function getMeeting(id: number): Promise<MeetingResponse> {
  return api.get<MeetingResponse>(`/api/meetings/${id}`);
}

// POST /api/meetings
export function createMeeting(body: MeetingCreate): Promise<MeetingResponse> {
  return api.post<MeetingResponse>('/api/meetings', body);
}

// POST /api/meetings/{id}/join
export function joinMeeting(id: number): Promise<MeetingResponse> {
  return api.post<MeetingResponse>(`/api/meetings/${id}/join`);
}

// DELETE /api/meetings/{id}/leave
export function leaveMeeting(id: number): Promise<void> {
  return api.delete<void>(`/api/meetings/${id}/leave`);
}
