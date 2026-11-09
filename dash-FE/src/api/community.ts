import { api } from "./client";
import { requireCapability } from "./capabilities";
import {
  nextCursor,
  pageQuery,
  textValue,
  positiveId,
  type CursorPage,
} from "./contracts";
export type CommunityGender = "ANY" | "MALE" | "FEMALE";
export interface CommunityResponse {
  id: number;
  creatorId: number;
  emoji: string;
  title: string;
  description: string;
  tags: string[];
  gender: CommunityGender;
  active: boolean;
  createdAt: string;
  status: "RECRUITING" | "PAUSED" | "CLOSED";
  memberCount: number;
  maxMembers: number;
  joined: boolean;
  chatRoomId: number | null;
  canEdit: boolean;
  canJoin: boolean;
  canLeave: boolean;
  canManageMembers: boolean;
}
export interface CommunityCreate {
  emoji: string;
  title: string;
  description: string;
  tags: string[];
  gender: CommunityGender;
  maxMembers: number;
}
export type CommunityUpdate = CommunityCreate & { active: boolean };
export interface CommunityMemberInfo {
  memberId: number;
  nickname: string;
  age: number;
  majorName: string;
  gender: "MALE" | "FEMALE";
  role: "OWNER" | "MEMBER";
  joinedAt: string;
}
export interface CommunityDashboard {
  community: CommunityResponse;
  maleCount: number;
  femaleCount: number;
  members: CommunityMemberInfo[];
}
export function validateCommunity(body: CommunityCreate) {
  if (!["ANY", "MALE", "FEMALE"].includes(body.gender))
    throw new Error("가입 성별을 선택해주세요");
  if (
    !Number.isInteger(body.maxMembers) ||
    body.maxMembers < 2 ||
    body.maxMembers > 100
  )
    throw new Error("정원은 2~100명이에요");
  const tags = [...new Set(body.tags.map((t) => textValue(t, "태그", 1, 20)))];
  if (tags.length > 5) throw new Error("태그는 최대 5개예요");
  return {
    title: textValue(body.title, "제목", 1, 100),
    description: textValue(body.description, "소개", 1, 2000),
    emoji: textValue(body.emoji, "이모지", 1, 16),
    tags,
    gender: body.gender,
    maxMembers: body.maxMembers,
  };
}
export async function getCommunities(
  options: {
    cursor?: number;
    keyword?: string;
    gender?: CommunityGender;
    tag?: string;
    joinedOnly?: string;
  } = {},
): Promise<CursorPage<CommunityResponse>> {
  requireCapability("communities");
  const page = await api.get<CursorPage<CommunityResponse>>(
    `/api/communities?${pageQuery(options)}`,
  );
  nextCursor(page, options.cursor);
  return page;
}
export function getCommunity(id: number) {
  requireCapability("communities");
  return api.get<CommunityResponse>(`/api/communities/${positiveId(id)}`);
}
export function createCommunity(body: CommunityCreate) {
  requireCapability("communities");
  return api.post<CommunityResponse>(
    "/api/communities",
    validateCommunity(body),
  );
}
export function updateCommunity(id: number, body: CommunityUpdate) {
  requireCapability("communities");
  return api.put<CommunityResponse>(`/api/communities/${positiveId(id)}`, {
    ...validateCommunity(body),
    active: body.active,
  });
}
export function joinCommunity(id: number) {
  requireCapability("communities");
  return api.post<CommunityResponse>(`/api/communities/${positiveId(id)}/join`);
}
export function leaveCommunity(id: number) {
  requireCapability("communities");
  return api.delete<void>(`/api/communities/${positiveId(id)}/leave`);
}
export function closeCommunity(id: number) {
  requireCapability("communities");
  return api.post<CommunityResponse>(
    `/api/communities/${positiveId(id)}/close`,
  );
}
export function getCommunityDashboard(id: number) {
  requireCapability("communities");
  return api.get<CommunityDashboard>(
    `/api/communities/${positiveId(id)}/dashboard`,
  );
}
export function removeCommunityMember(id: number, memberId: number) {
  requireCapability("communities");
  return api.delete<void>(
    `/api/communities/${positiveId(id)}/members/${positiveId(memberId)}`,
  );
}
