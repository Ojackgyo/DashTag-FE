const QA_MODE = true; // QA 완료 후 false로 변경

const todayKey = () => `dashtag_chance_${new Date().toDateString()}`;

import { useState } from 'react';

export function useChance() {
  const [used, setUsed] = useState(() => localStorage.getItem(todayKey()) === '1');

  const spend = () => {
    if (QA_MODE) return;
    localStorage.setItem(todayKey(), '1');
    setUsed(true);
  };

  return { hasChance: QA_MODE ? true : !used, spend };
}
