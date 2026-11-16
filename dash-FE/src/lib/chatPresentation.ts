import type { ChatParticipant, MessageResponse } from "../api/chat";

export function presentMessages(
  messages: MessageResponse[],
  userId: number,
  participants: Pick<ChatParticipant, "memberId" | "nickname">[] = [],
) {
  const nicknames = new Map<number, string>();
  for (const participant of participants) {
    const nickname = participant.nickname?.trim();
    if (nickname) nicknames.set(participant.memberId, nickname);
  }
  for (const message of messages) {
    const nickname = message.sender_nickname?.trim();
    if (nickname) nicknames.set(message.sender_id, nickname);
  }

  return messages.map((message, index) => {
    const previous = messages[index - 1];
    const next = messages[index + 1];
    const date = new Date(message.created_at);
    const sameSender = (other: MessageResponse | undefined) =>
      other?.sender_id === message.sender_id;
    const sameDay = (other: MessageResponse) =>
      new Date(other.created_at).toDateString() === date.toDateString();
    const sameMinute = (other: MessageResponse) =>
      Math.floor(Date.parse(other.created_at) / 60000) ===
      Math.floor(date.getTime() / 60000);

    return {
      message,
      mine: message.sender_id === userId,
      nickname: nicknames.get(message.sender_id) ?? "알 수 없는 회원",
      showSender:
        message.sender_id !== userId &&
        (!previous || !sameSender(previous) || !sameDay(previous)),
      showTime: !next || !sameSender(next) || !sameMinute(next),
    };
  });
}
