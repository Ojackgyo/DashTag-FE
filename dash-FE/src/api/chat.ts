import { api } from "./client";
import { sanitizePlainText } from "../lib/security";
import { requireCapability } from "./capabilities";
import { positiveId, textValue } from "./contracts";

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
  participants?: ChatParticipant[];
  dating_request_id?: number | null;
  meeting_id?: number | null;
  community_id?: number | null;
  active?: boolean;
  can_set_schedule?: boolean;
  can_leave?: boolean;
  can_close?: boolean;
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
  creatorId?: number | null;
  datingRequestId?: number | null;
  meetingId?: number | null;
  communityId?: number | null;
  participants?: ChatParticipant[];
  scheduledAt?: string | null;
  active?: boolean;
  canSetSchedule?: boolean;
  canLeave?: boolean;
  canClose?: boolean;
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
  return {
    id: room.id,
    room_type: room.roomType.toLowerCase(),
    name: room.name,
    created_at: room.createdAt,
    last_message_id: room.lastMessageId,
    last_message: room.lastMessageContent,
    last_message_at: room.lastMessageAt,
    unread_count: room.unreadCount ?? 0,
    creator_id: room.creatorId,
    participants: room.participants,
    dating_request_id: room.datingRequestId,
    meeting_id: room.meetingId,
    community_id: room.communityId,
    related_id: room.datingRequestId ?? room.meetingId ?? room.communityId,
    scheduled_at: room.scheduledAt,
    active: room.active,
    can_set_schedule: room.canSetSchedule,
    can_leave: room.canLeave,
    can_close: room.canClose,
  };
}

export function toMessage(
  message: ChatMessageApiResponse,
  roomId: number,
): MessageResponse {
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
  return (await api.get<ChatRoomApiResponse[]>("/api/chat-rooms")).map(toRoom);
}
export async function getChatMessagePage(roomId: number, cursor?: number) {
  const params = new URLSearchParams({ size: "50" });
  if (cursor != null) params.set("cursor", String(cursor));
  const page = await api.get<ChatMessagePageApiResponse>(
    `/api/chat-rooms/${roomId}/messages?${params}`,
  );
  return { ...page, messages: page.messages.map((m) => toMessage(m, roomId)) };
}
// Catch up across pages when more than 50 messages arrived between polls.
export async function getNewChatMessages(roomId: number, latestId: number) {
  const messages: MessageResponse[] = [];
  let cursor: number | undefined;
  for (;;) {
    const page = await getChatMessagePage(roomId, cursor);
    messages.push(...page.messages.filter((m) => m.id > latestId));
    if (!page.hasNext || page.messages.some((m) => m.id <= latestId)) break;
    if (
      page.nextCursor == null ||
      (cursor != null && page.nextCursor >= cursor)
    )
      throw new Error("채팅 다음 페이지를 불러올 수 없어요");
    cursor = page.nextCursor;
  }
  return messages.sort((a, b) => a.id - b.id);
}
export async function sendMessage(
  roomId: number,
  content: string,
  clientMessageId: string,
): Promise<MessageResponse> {
  const message = await api.post<ChatMessageApiResponse>(
    `/api/chat-rooms/${roomId}/messages`,
    {
      content: sanitizePlainText(content, 2000),
      clientMessageId,
    },
  );
  return toMessage(message, roomId);
}

export function updateReadPosition(
  roomId: number,
  lastReadMessageId: number,
): Promise<{ roomId: number; lastReadMessageId: number }> {
  return api.patch(`/api/chat-rooms/${roomId}/read-position`, {
    lastReadMessageId,
  });
}

export interface ChatParticipant {
  memberId: number;
  nickname: string;
  gender: "MALE" | "FEMALE";
  role: "OWNER" | "MEMBER";
  active: boolean;
  lastReadMessageId: number | null;
}
export interface ChatRoomDetail {
  room: ChatRoomResponse;
  participants: ChatParticipant[];
}
export async function getChatRoomDetail(
  roomId: number,
): Promise<ChatRoomDetail> {
  requireCapability("chatDetails");
  const room = await api.get<ChatRoomApiResponse>(
    `/api/chat-rooms/${positiveId(roomId)}`,
  );
  return { room: toRoom(room), participants: room.participants ?? [] };
}
export function leaveChatRoom(roomId: number) {
  requireCapability("chatDetails");
  return api.delete<void>(`/api/chat-rooms/${positiveId(roomId)}/leave`);
}
export function closeChatRoom(roomId: number) {
  requireCapability("chatDetails");
  return api.post<void>(`/api/chat-rooms/${positiveId(roomId)}/close`);
}
export function reportRoom(
  roomId: number,
  reportedMemberId: number,
  reason: string,
  detail = "",
) {
  requireCapability("chatReports");
  positiveId(reportedMemberId);
  if (!["ABUSE", "INAPPROPRIATE", "SPAM", "FRAUD", "OTHER"].includes(reason))
    throw new Error("신고 사유를 선택해주세요");
  return api.post<{ id: number; status: "RECEIVED"; createdAt: string }>(
    `/api/chat-rooms/${positiveId(roomId)}/reports`,
    {
      reportedMemberId,
      reason,
      detail: textValue(detail, "상세 내용", reason === "OTHER" ? 1 : 0, 1000),
      messageId: null,
    },
  );
}
