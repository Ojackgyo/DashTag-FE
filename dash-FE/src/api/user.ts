import { api } from './client';

export interface MemberProfileRequest {
  nickname: string; gender: string; birthdate: string; majorId: number;
  faceType: string; height: number; skinTone: string; hairStyle: string;
  mbti: string; smokingStatus: string; tattooStatus: string;
  militaryStatus: string; charmPoints: string[];
}

export interface MemberProfileApiResponse extends MemberProfileRequest {
  memberId?: number; id?: number; majorName?: string | null;
  collegeName?: string | null; createdAt?: string; updatedAt?: string;
}

export interface UserResponse {
  id: number; email?: string; nickname: string; name?: string | null;
  student_id?: string | null; birthdate?: string | null; age?: number | null;
  major?: string | null; major_id?: number | null; gender?: string | null;
  face_type?: string | null; height?: number | null;
  top_size?: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | null;
  skin_tone?: string | null; hair_style?: string | null;
  smoking?: boolean | null; smoking_status?: string | null;
  tattoo?: boolean | null; tattoo_status?: string | null;
  military_status?: string | null; mbti?: string | null;
  charm_points?: string[] | null; ideal_type?: Record<string, unknown> | null;
  is_profile_complete?: boolean; created_at?: string;
}

export interface UserUpdate {
  nickname?: string | null; name?: string | null; birthdate?: string | null;
  major_id?: number | null; age?: number | null; major?: string | null;
  gender?: string | null; face_type?: string | null; height?: number | null;
  top_size?: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | null;
  skin_tone?: string | null; hair_style?: string | null;
  smoking?: boolean | null; smoking_status?: string | null;
  tattoo?: boolean | null; tattoo_status?: string | null;
  military_status?: string | null; mbti?: string | null;
  charm_points?: string[] | null; ideal_type?: Record<string, unknown> | null;
}

export type UserProfileResponse = UserResponse;

function calculateAge(value?: string | null): number | null {
  if (!value) return null;
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

function fromApi(p: MemberProfileApiResponse): UserResponse {
  return {
    id: p.memberId ?? p.id ?? 0, nickname: p.nickname, birthdate: p.birthdate,
    age: calculateAge(p.birthdate), major: p.majorName ?? null, major_id: p.majorId,
    gender: p.gender.toLowerCase(), face_type: p.faceType, height: p.height,
    skin_tone: p.skinTone, hair_style: p.hairStyle,
    smoking_status: p.smokingStatus, smoking: p.smokingStatus === 'SMOKER',
    tattoo_status: p.tattooStatus, tattoo: p.tattooStatus !== 'NONE',
    military_status: p.militaryStatus, mbti: p.mbti, charm_points: p.charmPoints,
    ideal_type: null, is_profile_complete: true,
    created_at: p.createdAt ?? new Date().toISOString(),
  };
}

export async function getMe(): Promise<UserResponse> {
  return fromApi(await api.get<MemberProfileApiResponse>('/api/members/me/profile'));
}

export async function saveMemberProfile(body: MemberProfileRequest): Promise<UserResponse> {
  return fromApi(await api.put<MemberProfileApiResponse>('/api/members/me/profile', body));
}

export async function updateMe(body: UserUpdate): Promise<UserResponse> {
  const p = await api.get<MemberProfileApiResponse>('/api/members/me/profile');
  return saveMemberProfile({
    nickname: body.nickname ?? p.nickname, gender: body.gender ?? p.gender,
    birthdate: body.birthdate ?? p.birthdate, majorId: body.major_id ?? p.majorId,
    faceType: body.face_type ?? p.faceType, height: body.height ?? p.height,
    skinTone: body.skin_tone ?? p.skinTone, hairStyle: body.hair_style ?? p.hairStyle,
    mbti: body.mbti ?? p.mbti,
    smokingStatus: body.smoking_status ?? (body.smoking == null ? p.smokingStatus : body.smoking ? 'SMOKER' : 'NON_SMOKER'),
    tattooStatus: body.tattoo_status ?? (body.tattoo == null ? p.tattooStatus : body.tattoo ? 'SMALL' : 'NONE'),
    militaryStatus: body.military_status ?? p.militaryStatus,
    charmPoints: body.charm_points ?? p.charmPoints,
  });
}

export function getUserProfile(): Promise<UserProfileResponse> { return getMe(); }

const FACE_EMOJI: Record<string, string> = {
  '늑대상': '🐺', '강아지상': '🐶', '여우상': '🦊', '고양이상': '🐱', '곰상': '🐻',
  '토끼상': '🐰', '사슴상': '🦌', '공룡상': '🦕', '새상': '🦅', '물개상': '🦭',
  WOLF: '🐺', DOG: '🐶', FOX: '🦊', CAT: '🐱', BEAR: '🐻', RABBIT: '🐰',
  DEER: '🦌', DINOSAUR: '🦕', BIRD: '🦅', SEAL: '🦭',
};

export function faceTypeToEmoji(faceType?: string | null): string {
  return FACE_EMOJI[faceType ?? ''] ?? '🙂';
}
