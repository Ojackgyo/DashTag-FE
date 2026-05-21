import { useState, useEffect, useCallback } from 'react';
import { getChance, spendChance } from '../api/chance';
import { isLoggedIn } from '../api/client';

export function useChance() {
  const [hasChance, setHasChance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chanceLoading, setChanceLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { setChanceLoading(false); return; }
    getChance()
      .then(res => setHasChance(res.has_chance))
      .catch(() => {})
      .finally(() => setChanceLoading(false));
  }, []);

  const spend = useCallback(async () => {
    if (!hasChance) return;
    setLoading(true);
    try {
      const res = await spendChance();
      setHasChance(res.has_chance);
    } catch {
      // 실패해도 UI는 유지
    } finally {
      setLoading(false);
    }
  }, [hasChance]);

  return { hasChance, spend, loading, chanceLoading };
}
