import { api } from './client';

export interface DashPerson {
  id: string;
  name: string;
  nickname: string;
  emoji: string;
  mbti: string;
  faceType: string;
  major: string;
  age: number;
  studentId: string;    // ex. "21학번"
  height: number;
  weight: number;
  skinTone: string;
  hairStyle: string;
  tattoo: string;
  smoking: string;
  charmPoints: string[];
  requestMsg: string;   // 상대방이 보낸 한 줄 메시지
  sentAt: string;       // ISO 8601
}

export interface ScheduleItem {
  id: string;
  title: string;
  date: string;         // ex. "4/30 (목)"
  type: 'meeting' | 'date' | 'group';
}

export interface HomeData {
  receivedDashes: DashPerson[];
  sentDashes: DashPerson[];
  todaySchedule: ScheduleItem | null;
  upcomingSchedules: ScheduleItem[];
}

export interface AcceptDashResponse {
  chatRoomId: string;   // 수락 시 생성된 채팅방 ID
}

// GET /home
// 홈화면에 필요한 데이터 한번에
export function getHomeData(): Promise<HomeData> {
  return api.get<HomeData>('/home');
}

// POST /dashes/:id/accept
// 기회 사용 + 대쉬 수락 → 채팅방 생성
export function acceptDash(dashId: string): Promise<AcceptDashResponse> {
  return api.post<AcceptDashResponse>(`/dashes/${dashId}/accept`);
}

// POST /dashes/:id/reject
export function rejectDash(dashId: string): Promise<void> {
  return api.post<void>(`/dashes/${dashId}/reject`);
}
