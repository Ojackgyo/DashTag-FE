import { api } from "./client";
import { requireCapability } from "./capabilities";
import { getChatRooms } from "./chat";
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
export function koreanTimestamp(value: string) {
  return /(Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}+09:00`;
}
export async function getSchedule(roomId: number): Promise<Schedule | null> {
  requireCapability("chatSchedule");
  const room = (await getChatRooms()).find((r) => r.id === positiveId(roomId));
  if (!room) throw new Error("채팅방에 접근할 수 없어요");
  return room.scheduled_at
    ? {
        id: room.id,
        roomId: room.id,
        roomType: room.room_type.toUpperCase() as Schedule["roomType"],
        title: room.name ?? "함께하는 약속",
        scheduledAt: koreanTimestamp(room.scheduled_at),
        location: "",
        updatedAt: "",
        canEdit: room.can_set_schedule === true,
      }
    : null;
}
export function saveSchedule(roomId: number, input: ScheduleInput) {
  requireCapability("chatSchedule");
  const valid = validateSchedule(input);
  const date = new Date(valid.scheduledAt);
  return api.put<Schedule>(`/api/chat-rooms/${positiveId(roomId)}/schedule`, {
    scheduledAt: `${koreanDate(date)}T${koreanTime(date)}:${String(date.getUTCSeconds()).padStart(2, "0")}`,
  });
}
export function deleteSchedule(roomId: number) {
  requireCapability("chatScheduleExtras");
  return api.delete<void>(`/api/chat-rooms/${positiveId(roomId)}/schedule`);
}
interface HomeSchedule {
  roomId: number;
  roomType: Schedule["roomType"];
  roomName: string;
  scheduledAt: string;
}
function adaptHomeSchedule(item: HomeSchedule): Schedule {
  return {
    id: item.roomId,
    roomId: item.roomId,
    roomType: item.roomType,
    title: item.roomName,
    scheduledAt: koreanTimestamp(item.scheduledAt),
    location: "",
    updatedAt: "",
    canEdit: false,
  };
}
export async function getSchedules(from: string, to: string) {
  requireCapability("chatSchedule");
  const [year, month] = from.split("-").map(Number);
  return (
    await api.get<HomeSchedule[]>(
      `/api/home/schedules?${new URLSearchParams({ year: String(year), month: String(month) })}`,
    )
  )
    .map(adaptHomeSchedule)
    .filter((s) => {
      const date = koreanDate(new Date(s.scheduledAt));
      return date >= from && date <= to;
    });
}
export async function getUpcomingSchedules(limit = 5) {
  requireCapability("chatSchedule");
  return (
    await api.get<HomeSchedule[]>(`/api/home/schedules/upcoming?limit=${limit}`)
  ).map(adaptHomeSchedule);
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
  }).format(new Date(koreanTimestamp(value)));
}
