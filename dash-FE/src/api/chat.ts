import { api } from './client';
import { sanitizePlainText } from '../lib/security';

export interface ChatRoomResponse {
  id: number;
  room_type: string;
  related_id?: number | null;
  name?: string | null;
  emoji?: string | null;
  created_at: string;
  last_message_id?: number | null;
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
  client_message_id?: string;
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
  lastMessageId?: number | null;
  lastMessageContent?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
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
  clientMessageId: string;
};

type ChatMessagePageApiResponse = {
  messages: ChatMessageApiResponse[];
  nextCursor?: number | null;
  hasNext: boolean;
};

function toRoom(room: ChatRoomApiResponse): ChatRoomResponse {
  return { id: room.id, room_type: room.roomType.toLowerCase(), name: room.name, created_at: room.createdAt,
    last_message_id: room.lastMessageId, last_message: room.lastMessageContent,
    last_message_at: room.lastMessageAt, unread_count: room.unreadCount ?? 0 };
}

function toMessage(message: ChatMessageApiResponse, roomId: number): MessageResponse {
  return {
    id: message.id,
    room_id: message.roomId ?? roomId,
    sender_id: message.senderMemberId ?? message.senderId ?? 0,
    sender_nickname: message.senderNickname,
    content: message.content,
    client_message_id: message.clientMessageId,
    is_read: false,
    created_at: message.sentAt ?? message.createdAt ?? new Date().toISOString(),
  };
}

export async function getChatRooms(): Promise<ChatRoomResponse[]> {
  return (await api.get<ChatRoomApiResponse[]>('/api/chat-rooms')).map(toRoom);
}
export async function getChatMessagePage(roomId: number, cursor?: number) {
  const params = new URLSearchParams({ size: '50' });
  if (cursor != null) params.set('cursor', String(cursor));
  const page = await api.get<ChatMessagePageApiResponse>(`/api/chat-rooms/${roomId}/messages?${params}`);
  return { ...page, messages: page.messages.map(m => toMessage(m, roomId)) };
}
// Catch up across pages when more than 50 messages arrived between polls.
export async function getNewChatMessages(roomId: number, latestId: number) {
  const messages: MessageResponse[] = [];
  let cursor: number | undefined;
  for (;;) {
    const page = await getChatMessagePage(roomId, cursor);
    messages.push(...page.messages.filter(m => m.id > latestId));
    if (!page.hasNext || page.messages.some(m => m.id <= latestId)) break;
    if (page.nextCursor == null || (cursor != null && page.nextCursor >= cursor)) throw new Error('채팅 다음 페이지를 불러올 수 없어요');
    cursor = page.nextCursor;
  }
  return messages.sort((a, b) => a.id - b.id);
}
export async function sendMessage(roomId: number, content: string, clientMessageId: string): Promise<MessageResponse> {
  const message = await api.post<ChatMessageApiResponse>(`/api/chat-rooms/${roomId}/messages`, {
    content: sanitizePlainText(content, 2000), clientMessageId,
  });
  return toMessage(message, roomId);
}

export function updateReadPosition(roomId: number, lastReadMessageId: number): Promise<{ roomId: number; lastReadMessageId: number }> {
  return api.patch(`/api/chat-rooms/${roomId}/read-position`, { lastReadMessageId });
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
