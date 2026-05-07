import { api } from './client';

export interface UserProfile {
  id: string;
  nickname: string;
  name: string;
  userId: string;
  gender: '남성' | '여성';
  age: number;
  major: string;
  faceType: string;       // 늑대상, 강아지상, 여우상, ...
  emoji: string;          // 서버가 faceType 기반으로 매핑해서 내려줌
  mbti: string;           // ex. "ENFP"
  height: number;
  weight: number;
  skinTone: string;
  hairStyle: string;
  tattoo: string;
  smoking: string;
  military?: string;      // 남성만
  charmPoints: string[];
  ideal: {
    faceType: string;
    skinTone: string;
    mbti: string;
    ageDiff: string;
    hairStyle: string;
    tattoo: string;
    smoking: string;
    military?: string;    // 여성만
  };
}

export type CreateProfileBody = Omit<UserProfile, 'id' | 'emoji'>;

// POST /users/profile
// 회원가입 완료 후 프로필 최초 등록
export function createProfile(body: CreateProfileBody): Promise<UserProfile> {
  return api.post<UserProfile>('/users/profile', body);
}

// GET /users/me
export function getMyProfile(): Promise<UserProfile> {
  return api.get<UserProfile>('/users/me');
}

// PUT /users/me
// 프로필 수정 (전체 덮어쓰기)
export function updateMyProfile(body: Partial<CreateProfileBody>): Promise<UserProfile> {
  return api.put<UserProfile>('/users/me', body);
}

export interface Review {
  id: string;
  emoji: string;
  rating: number;        // 1~5
  text: string;
  createdAt: string;     // ISO 8601
}

// GET /users/me/reviews
// 대쉬서클 — 매칭 상대가 남긴 리뷰 목록
export function getMyReviews(): Promise<Review[]> {
  return api.get<Review[]>('/users/me/reviews');
}

// POST /users/:id/review
// 채팅 종료 후 상대방에게 리뷰 작성
export function writeReview(userId: string, rating: number, text: string): Promise<Review> {
  return api.post<Review>(`/users/${userId}/review`, { rating, text });
}
