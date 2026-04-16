import { useState } from 'react';

const todayKey = () => `dashtag_chance_${new Date().toDateString()}`;

export function useChance() {
  const [used, setUsed] = useState(() => localStorage.getItem(todayKey()) === '1');

  const spend = () => {
    localStorage.setItem(todayKey(), '1');
    setUsed(true);
  };

  return { hasChance: !used, spend };
}
