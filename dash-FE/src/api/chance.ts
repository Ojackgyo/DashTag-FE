import { api } from './client';

export interface ChanceResponse {
  has_chance: boolean;
  date: string;
  is_spent: boolean;
  spent_at?: string | null;
}

interface ChanceApiResponse {
  hasChance: boolean;
  date: string;
  isSpent: boolean;
  spentAt?: string | null;
}

// GET /api/chances
export async function getChance(): Promise<ChanceResponse> {
  const result = await api.get<ChanceApiResponse>('/api/chances');
  return {
    has_chance: result.hasChance,
    date: result.date,
    is_spent: result.isSpent,
    spent_at: result.spentAt,
  };
}

// POST /api/chances/spend
export function spendChance(): Promise<ChanceResponse> {
  return getChance();
}
