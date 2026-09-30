import { api, BASE_URL, getToken } from './client';
import { sanitizePlainText } from '../lib/security';

// WebSocket 시도 (백엔드가 지원할 경우에만 연결됨 — 실패 시 onerror로 감지)
export function createChatSocket(roomId: number): WebSocket {
  const wsBase = BASE_URL.replace(/^https/, 'wss').replace(/^http/, 'ws');
  const token = getToken();
  const url = token
    ? `${wsBase}/ws/chat/${roomId}?token=${encodeURIComponent(token)}`
    : `${wsBase}/ws/chat/${roomId}`;
  return new WebSocket(url);
}

export interface ChatRoomResponse {
  id: number;
  room_type: string;
  related_id?: number | null;
  name?: string | null;
  emoji?: string | null;
  created_at: string;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count: number;
  scheduled_at?: string | null;
  creator_id?: number | null;
}

export interface MessageResponse {
  id: number;
  room_id: number;
  sender_id: number;
  sender_nickname?: string | null;
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

type ChatRoomApiResponse = {
  id: number;
  roomType: string;
  name?: string | null;
  createdAt: string;
};

type ChatMessageApiResponse = {
  id: number;
  roomId?: number;
  senderId?: number;
  senderMemberId?: number;
  senderNickname?: string | null;
  content: string;
  createdAt?: string;
  sentAt?: string;
};

type ChatMessagePageApiResponse = {
  messages: ChatMessageApiResponse[];
  nextCursor?: number | null;
  hasNext: boolean;
};

function toRoom(room: ChatRoomApiResponse): ChatRoomResponse {
  return { id: room.id, room_type: room.roomType.toLowerCase(), name: room.name, created_at: room.createdAt, unread_count: 0 };
}

function toMessage(message: ChatMessageApiResponse, roomId: number): MessageResponse {
  return {
    id: message.id,
    room_id: message.roomId ?? roomId,
    sender_id: message.senderMemberId ?? message.senderId ?? 0,
    sender_nickname: message.senderNickname,
    content: message.content,
    is_read: false,
    created_at: message.sentAt ?? message.createdAt ?? new Date().toISOString(),
  };
}

// GET /api/chats
export async function getChatRooms(): Promise<ChatRoomResponse[]> {
  const rooms = await api.get<ChatRoomApiResponse[]>('/api/chat-rooms');
  return rooms.map(toRoom);
}

// GET /api/chats/{room_id}/messages
export async function getChatMessages(roomId: number): Promise<MessageResponse[]> {
  const page = await api.get<ChatMessagePageApiResponse>(`/api/chat-rooms/${roomId}/messages`);
  return page.messages.map(message => toMessage(message, roomId));
}

// POST /api/chats/{room_id}/messages
export async function sendMessage(roomId: number, content: string): Promise<MessageResponse> {
  const message = await api.post<ChatMessageApiResponse>(`/api/chat-rooms/${roomId}/messages`, { content: sanitizePlainText(content, 2000) });
  return toMessage(message, roomId);
}

// PUT /api/chats/{room_id}/schedule
export function setSchedule(roomId: number, scheduled_at: string): Promise<DateScheduleResponse> {
  return api.put<DateScheduleResponse>(`/api/chats/${roomId}/schedule`, { scheduled_at });
}

// POST /api/chats/{room_id}/report
export function reportRoom(roomId: number, reported_user_id: number, reason: string, detail?: string): Promise<void> {
  return api.post<void>(`/api/chats/${roomId}/report`, {
    reported_user_id,
    reason: sanitizePlainText(reason, 100),
    detail: detail ? sanitizePlainText(detail, 1000) : undefined,
  });
}
