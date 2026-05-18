import { api } from './client';

export interface ChanceResponse {
  has_chance: boolean;
  date: string;
  is_spent: boolean;
  spent_at?: string | null;
}

// GET /api/chances
export function getChance(): Promise<ChanceResponse> {
  return api.get<ChanceResponse>('/api/chances');
}

// POST /api/chances/spend
export function spendChance(): Promise<ChanceResponse> {
  return api.post<ChanceResponse>('/api/chances/spend');
}
