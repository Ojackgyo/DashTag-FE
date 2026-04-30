import { api } from './client';

export interface MeetingParticipant {
  nickname: string;
  emoji: string;
  faceType: string;
  mbti: string;
  charmPoints: string[];
  gender: 'f' | 'm';
}

export interface Meeting {
  id: string;
  code: string;           // ex. "DT-CAFE"
  title: string;
  keywords: string[];
  femaleCount: number;
  maleCount: number;
  day: string;            // ex. "4/20(일)"
  joined: { f: number; m: number };
  participants: MeetingParticipant[];
  isOwner?: boolean;      // 내가 개설한 방인지
}

export interface CreateMeetingBody {
  title: string;
  keywords: string[];
  femaleCount: number;
  maleCount: number;
  day: string;
}

export interface CreateMeetingResponse {
  meeting: Meeting;
  code: string;
}

export interface JoinByCodeResponse {
  meeting: Meeting;
}

// GET /meetings?search=
export function getMeetings(search?: string): Promise<Meeting[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  return api.get<Meeting[]>(`/meetings${params}`);
}

// GET /meetings/:id
export function getMeeting(id: string): Promise<Meeting> {
  return api.get<Meeting>(`/meetings/${id}`);
}

// POST /meetings
// 미팅 개설 — 코드는 서버에서 생성해서 반환
export function createMeeting(body: CreateMeetingBody): Promise<CreateMeetingResponse> {
  return api.post<CreateMeetingResponse>('/meetings', body);
}

// POST /meetings/join-by-code
// body: { code }
export function joinMeetingByCode(code: string): Promise<JoinByCodeResponse> {
  return api.post<JoinByCodeResponse>('/meetings/join-by-code', { code });
}

// POST /meetings/:id/join
// 기회 사용 + 미팅 참여
export function joinMeeting(id: string): Promise<Meeting> {
  return api.post<Meeting>(`/meetings/${id}/join`);
}

// POST /meetings/:id/invite
// 친구 초대 코드 조회 (이미 있으면 반환, 없으면 생성)
export function getMeetingInviteCode(id: string): Promise<{ inviteCode: string }> {
  return api.post<{ inviteCode: string }>(`/meetings/${id}/invite`);
}
