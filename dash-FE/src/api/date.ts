import { api } from './client';

export interface DateProfile {
  id: string;
  emoji: string;
  faceType: string;
  nickname: string;
  major: string;
  age: number;
  studentId: string;
  mbti: string;
  height: number;
  weight: number;
  skinTone: string;
  hairStyle: string;
  tattoo: string;
  smoking: string;
  charmPoints: string[];
}

export interface SendDateRequestBody {
  targetUserId: string;
  introMsg: string;     // 한 줄 소개 메시지 (최대 50자)
}

export interface SendDateRequestResponse {
  requestId: string;
}

// GET /date/profiles
// 소개팅 상대 목록 (본인 이상형 필터 적용된 추천 목록)
export function getDateProfiles(): Promise<DateProfile[]> {
  return api.get<DateProfile[]>('/date/profiles');
}

// POST /date/request
// 기회 사용 + 대화 신청
export function sendDateRequest(body: SendDateRequestBody): Promise<SendDateRequestResponse> {
  return api.post<SendDateRequestResponse>('/date/request', body);
}
