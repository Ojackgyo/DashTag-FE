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
  maxMembers?: number;
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
  maxMembers?: number;
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
  community: Pick<CommunityResponse, "memberCount" | "canManageMembers">;
  maleCount: number;
  femaleCount: number;
  members: CommunityMemberInfo[];
}
const genderPolicy = {
  ANY: "ALL",
  MALE: "MALE_ONLY",
  FEMALE: "FEMALE_ONLY",
} as const;
type CommunityApiResponse = Omit<CommunityResponse, "gender"> & {
  gender?: CommunityGender;
  genderPolicy: "ALL" | "MALE_ONLY" | "FEMALE_ONLY";
};
function adaptCommunity(value: CommunityApiResponse): CommunityResponse {
  return {
    ...value,
    description: value.description ?? "",
    tags: value.tags ?? [],
    gender:
      value.gender ??
      ({ ALL: "ANY", MALE_ONLY: "MALE", FEMALE_ONLY: "FEMALE" } as const)[
        value.genderPolicy
      ],
    status: value.status ?? (value.active ? "RECRUITING" : "PAUSED"),
    canLeave: value.canLeave ?? false,
  };
}
export function validateCommunity(body: CommunityCreate) {
  if (!["ANY", "MALE", "FEMALE"].includes(body.gender))
    throw new Error("가입 성별을 선택해주세요");
  const tags = [...new Set(body.tags.map((t) => t.trim()).filter(Boolean))];
  if (tags.length > 5) throw new Error("태그는 최대 5개예요");
  return {
    title: textValue(body.title, "제목", 2, 24),
    description: textValue(body.description, "소개", 0, 500),
    emoji: textValue(body.emoji, "이모지", 1, 32),
    tags,
    gender: body.gender,
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
  const page = await api.get<CursorPage<CommunityApiResponse>>(
    `/api/communities?${pageQuery({ cursor: options.cursor, search: options.keyword?.trim(), genderPolicy: options.gender ? genderPolicy[options.gender] : undefined, tag: options.tag })}`,
  );
  nextCursor(page, options.cursor);
  return { ...page, items: page.items.map(adaptCommunity) };
}
export async function getCommunity(id: number) {
  requireCapability("communities");
  return adaptCommunity(
    await api.get<CommunityApiResponse>(`/api/communities/${positiveId(id)}`),
  );
}
export function createCommunity(body: CommunityCreate) {
  requireCapability("communities");
  const { gender, ...fields } = validateCommunity(body);
  return api
    .post<CommunityApiResponse>("/api/communities", {
      ...fields,
      genderPolicy: genderPolicy[gender],
    })
    .then(adaptCommunity);
}
export async function updateCommunity(id: number, body: CommunityUpdate) {
  requireCapability("communities");
  const { gender: _gender, ...fields } = validateCommunity(body);
  void _gender;
  return adaptCommunity(
    await api.put<CommunityApiResponse>(
      `/api/communities/${positiveId(id)}`,
      fields,
    ),
  );
}
export async function setCommunityStatus(id: number, active: boolean) {
  requireCapability("communities");
  return adaptCommunity(
    await api.patch<CommunityApiResponse>(
      `/api/communities/${positiveId(id)}/status`,
      { active },
    ),
  );
}
export async function joinCommunity(id: number) {
  requireCapability("communities");
  return adaptCommunity(
    await api.post<CommunityApiResponse>(
      `/api/communities/${positiveId(id)}/join`,
    ),
  );
}
export function leaveCommunity(id: number) {
  requireCapability("communityLeave");
  return api.delete<void>(`/api/communities/${positiveId(id)}/leave`);
}
export function closeCommunity(id: number) {
  return setCommunityStatus(id, false);
}
export async function getCommunityDashboard(
  id: number,
): Promise<CommunityDashboard> {
  requireCapability("communities");
  const value = await api.get<CommunityDashboard & { memberCount: number }>(
    `/api/communities/${positiveId(id)}/dashboard`,
  );
  return {
    ...value,
    community: value.community ?? {
      memberCount: value.memberCount,
      canManageMembers: true,
    },
  };
}
export function removeCommunityMember(id: number, memberId: number) {
  requireCapability("communities");
  return api.delete<void>(
    `/api/communities/${positiveId(id)}/members/${positiveId(memberId)}`,
  );
}
