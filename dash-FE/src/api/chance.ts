import { api } from './client';

export interface ChanceStatus {
  hasChance: boolean;   // 오늘 기회가 남아있는지
  resetAt: string;      // 다음 기회 리셋 시각 (ISO 8601, 자정)
}

// GET /chance
export function getChanceStatus(): Promise<ChanceStatus> {
  return api.get<ChanceStatus>('/chance');
}

// POST /chance/spend
// 기회 사용 — 소개팅 신청 / 대쉬 수락 / 미팅 참여 시 호출
// body: { reason: 'date' | 'dash_accept' | 'meeting' }
export function spendChance(reason: 'date' | 'dash_accept' | 'meeting'): Promise<ChanceStatus> {
  return api.post<ChanceStatus>('/chance/spend', { reason });
}
