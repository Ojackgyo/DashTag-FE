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
  invite_code?: string | null;
  participant_count: number;
  male_count: number;
  female_count: number;
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

// POST /api/meetings/join-by-code
export function joinMeetingByCode(invite_code: string): Promise<MeetingResponse> {
  return api.post<MeetingResponse>('/api/meetings/join-by-code', { invite_code });
}

// DELETE /api/meetings/{id}/leave
export function leaveMeeting(id: number): Promise<void> {
  return api.delete<void>(`/api/meetings/${id}/leave`);
}

export interface MeetingParticipant {
  user_id: number;
  nickname: string;
  gender?: string | null;
  face_type?: string | null;
  mbti?: string | null;
  charm_points?: string[] | null;
}

// GET /api/meetings/{id}/participants
export function getMeetingParticipants(id: number): Promise<MeetingParticipant[]> {
  return api.get<MeetingParticipant[]>(`/api/meetings/${id}/participants`);
}
