import { api } from "./client";
import { requireCapability } from "./capabilities";
import { positiveId, textValue } from "./contracts";
export interface Schedule {
  id: number;
  roomId: number;
  roomType: "DATING" | "MEETING" | "COMMUNITY";
  title: string;
  scheduledAt: string;
  location: string;
  updatedAt: string;
  canEdit: boolean;
}
export interface ScheduleInput {
  title: string;
  scheduledAt: string;
  location: string;
}
export function validateSchedule(input: ScheduleInput) {
  if (
    !/(Z|[+-]\d{2}:\d{2})$/.test(input.scheduledAt) ||
    !Number.isFinite(Date.parse(input.scheduledAt)) ||
    Date.parse(input.scheduledAt) <= Date.now()
  )
    throw new Error("현재보다 미래인 일정을 선택해주세요");
  return {
    title: textValue(input.title, "일정 제목", 1, 100),
    scheduledAt: input.scheduledAt,
    location: textValue(input.location, "장소", 0, 200),
  };
}
export function getSchedule(roomId: number) {
  requireCapability("chatSchedule");
  return api.get<Schedule | null>(
    `/api/chat-rooms/${positiveId(roomId)}/schedule`,
  );
}
export function saveSchedule(roomId: number, input: ScheduleInput) {
  requireCapability("chatSchedule");
  return api.put<Schedule>(
    `/api/chat-rooms/${positiveId(roomId)}/schedule`,
    validateSchedule(input),
  );
}
export function deleteSchedule(roomId: number) {
  requireCapability("chatSchedule");
  return api.delete<void>(`/api/chat-rooms/${positiveId(roomId)}/schedule`);
}
export function getSchedules(from: string, to: string) {
  requireCapability("chatSchedule");
  return api.get<Schedule[]>(
    `/api/members/me/schedules?${new URLSearchParams({ from, to })}`,
  );
}
export function koreanDate(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function koreanTime(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
export function displaySchedule(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
