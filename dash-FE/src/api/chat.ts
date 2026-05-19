import { api } from './client';

export interface ChatRoomResponse {
  id: number;
  room_type: string;
  related_id?: number | null;
  created_at: string;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count: number;
}

export interface MessageResponse {
  id: number;
  room_id: number;
  sender_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface DateScheduleResponse {
  id: number;
  room_id: number;
  scheduled_at: string;
  created_at: string;
}

// GET /api/chats
export function getChatRooms(): Promise<ChatRoomResponse[]> {
  return api.get<ChatRoomResponse[]>('/api/chats');
}

// GET /api/chats/{room_id}/messages
export function getChatMessages(roomId: number): Promise<MessageResponse[]> {
  return api.get<MessageResponse[]>(`/api/chats/${roomId}/messages`);
}

// POST /api/chats/{room_id}/messages
export function sendMessage(roomId: number, content: string): Promise<MessageResponse> {
  return api.post<MessageResponse>(`/api/chats/${roomId}/messages`, { content });
}

// PUT /api/chats/{room_id}/schedule
export function setSchedule(roomId: number, scheduled_at: string): Promise<DateScheduleResponse> {
  return api.put<DateScheduleResponse>(`/api/chats/${roomId}/schedule`, { scheduled_at });
}

// POST /api/chats/{room_id}/report
export function reportRoom(roomId: number, reported_user_id: number, reason: string, detail?: string): Promise<void> {
  return api.post<void>(`/api/chats/${roomId}/report`, { reported_user_id, reason, detail });
}
