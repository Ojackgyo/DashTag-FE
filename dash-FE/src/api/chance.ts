import { api } from './client';

export interface ChanceResponse {
  hasChance: boolean;
  remainingCount: number;
  maxCount: number;
  rechargeAt: string[];
}
export function getChance(): Promise<ChanceResponse> {
  return api.get<ChanceResponse>('/api/chances');
}
