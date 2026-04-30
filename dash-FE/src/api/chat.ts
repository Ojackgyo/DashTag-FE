import { api } from './client';

export type ChatCategory = '소개팅' | '미팅' | '소모임';

export interface ChatRoom {
  id: string;
  category: ChatCategory;
  name: string;
  emoji: string;
  lastMsg: string;
  lastMsgAt: string;    // ISO 8601
  unreadCount: number;
  members?: number;     // 미팅/소모임만
}

export interface ChatMessage {
  id: string;
  text: string;
  mine: boolean;
  sentAt: string;       // ISO 8601
  type?: 'text' | 'date-confirm';
  dateValue?: string;   // type === 'date-confirm' 일 때
}

export interface ScheduleBody {
  scheduledAt: string;  // ex. "5월 3일 (토) 오후 3시"
}

export interface ReportBody {
  reason: string;       // 욕설/비하 | 부적절한 내용 | 스팸/광고 | 사기 의심 | 기타
  detail?: string;
}

// GET /chat/rooms
// 내 채팅방 전체 목록
export function getChatRooms(): Promise<ChatRoom[]> {
  return api.get<ChatRoom[]>('/chat/rooms');
}

// GET /chat/rooms/:id/messages?cursor=&limit=
// cursor: 마지막으로 받은 메시지 ID (페이지네이션)
export function getChatMessages(roomId: string, cursor?: string, limit = 50): Promise<ChatMessage[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return api.get<ChatMessage[]>(`/chat/rooms/${roomId}/messages?${params}`);
}

// POST /chat/rooms/:id/messages
// body: { text }
export function sendMessage(roomId: string, text: string): Promise<ChatMessage> {
  return api.post<ChatMessage>(`/chat/rooms/${roomId}/messages`, { text });
}

// POST /chat/rooms/:id/schedule
// 약속 날짜 설정
export function setSchedule(roomId: string, body: ScheduleBody): Promise<ChatMessage> {
  return api.post<ChatMessage>(`/chat/rooms/${roomId}/schedule`, body);
}

// POST /chat/rooms/:id/report
// 신고
export function reportRoom(roomId: string, body: ReportBody): Promise<void> {
  return api.post<void>(`/chat/rooms/${roomId}/report`, body);
}
