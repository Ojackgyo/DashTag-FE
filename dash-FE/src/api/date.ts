import { api } from "./client";
import type { UserProfileResponse } from "./user";
import { sanitizePlainText } from "../lib/security";
import { requireCapability } from "./capabilities";
import { nextCursor, pageQuery, type CursorPage } from "./contracts";
interface DiscoveryProfile {
  memberId: number;
  nickname: string;
  age: number;
  majorId: number;
  majorName: string;
  gender: string;
  faceType: string;
  height: number;
  topSize: string;
  skinTone: string;
  hairStyle: string;
  mbti: string;
  smokingStatus: string;
  tattooStatus: string;
  militaryStatus: string;
  charmPoints: string[];
  canRequest: boolean;
}
export async function getDateProfilePage(
  cursor?: number,
): Promise<CursorPage<UserProfileResponse>> {
  requireCapability("profileDiscovery");
  const page = await api.get<CursorPage<DiscoveryProfile>>(
    `/api/profiles?${pageQuery({ cursor })}`,
  );
  nextCursor(page, cursor);
  return {
    ...page,
    items: page.items
      .filter((p) => p.canRequest)
      .map((p) => ({
        id: p.memberId,
        nickname: p.nickname,
        age: p.age,
        major_id: p.majorId,
        major: p.majorName,
        gender: p.gender.toLowerCase(),
        face_type: p.faceType,
        height: p.height,
        top_size: (p.topSize === "XXL"
          ? "2XL"
          : p.topSize) as UserProfileResponse["top_size"],
        skin_tone: p.skinTone,
        hair_style: p.hairStyle,
        mbti: p.mbti,
        smoking_status: p.smokingStatus,
        smoking: p.smokingStatus !== "NON_SMOKER",
        tattoo_status: p.tattooStatus,
        tattoo: p.tattooStatus !== "NONE",
        military_status: p.militaryStatus,
        charm_points: p.charmPoints,
      })),
  };
}
export async function getDateProfiles(): Promise<UserProfileResponse[]> {
  return (await getDateProfilePage()).items;
}
export function sendDateRequest(
  to_user_id: number,
  message?: string,
): Promise<{ id: number; status: string }> {
  const safeMessage = message ? sanitizePlainText(message, 500) : "";
  return api.post<{ id: number; status: string }>("/api/dating/requests", {
    receiverId: to_user_id,
    message: safeMessage || null,
  });
}
