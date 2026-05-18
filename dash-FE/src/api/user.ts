import { api } from './client';

export interface UserResponse {
  id: number;
  email: string;
  nickname: string;
  name?: string | null;
  student_id?: string | null;
  age?: number | null;
  major?: string | null;
  gender?: string | null;
  face_type?: string | null;
  height?: number | null;
  weight?: number | null;
  skin_tone?: string | null;
  hair_style?: string | null;
  smoking?: boolean | null;
  tattoo?: boolean | null;
  mbti?: string | null;
  charm_points?: string[] | null;
  ideal_type?: Record<string, unknown> | null;
  is_profile_complete: boolean;
  created_at: string;
}

export interface UserUpdate {
  nickname?: string | null;
  name?: string | null;
  student_id?: string | null;
  age?: number | null;
  major?: string | null;
  gender?: string | null;
  face_type?: string | null;
  height?: number | null;
  weight?: number | null;
  skin_tone?: string | null;
  hair_style?: string | null;
  smoking?: boolean | null;
  tattoo?: boolean | null;
  mbti?: string | null;
  charm_points?: string[] | null;
  ideal_type?: Record<string, unknown> | null;
}

export interface UserProfileResponse {
  id: number;
  nickname: string;
  age?: number | null;
  major?: string | null;
  gender?: string | null;
  face_type?: string | null;
  height?: number | null;
  weight?: number | null;
  skin_tone?: string | null;
  hair_style?: string | null;
  smoking?: boolean | null;
  tattoo?: boolean | null;
  mbti?: string | null;
  charm_points?: string[] | null;
}

// GET /api/users/me
export function getMe(): Promise<UserResponse> {
  return api.get<UserResponse>('/api/users/me');
}

// PUT /api/users/me
export function updateMe(body: UserUpdate): Promise<UserResponse> {
  return api.put<UserResponse>('/api/users/me', body);
}

// GET /api/users/{user_id}
export function getUserProfile(userId: number): Promise<UserProfileResponse> {
  return api.get<UserProfileResponse>(`/api/users/${userId}`);
}

/* ── face_type → emoji 매핑 (클라이언트 사이드) ── */
const FACE_EMOJI: Record<string, string> = {
  '늑대상': '🐺', '강아지상': '🐶', '여우상': '🦊', '고양이상': '🐱',
  '곰상': '🐻', '토끼상': '🐰', '사슴상': '🦌', '공룡상': '🦕',
  '새상': '🦅', '물개상': '🦭',
};

export function faceTypeToEmoji(faceType?: string | null): string {
  return FACE_EMOJI[faceType ?? ''] ?? '🙂';
}
