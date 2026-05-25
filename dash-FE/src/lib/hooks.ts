import { useRef, useCallback } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return useCallback((...args: Parameters<T>) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fnRef.current(...args), delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay]) as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThrottle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void {
  const inThrottleRef = useRef(false);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return useCallback((...args: Parameters<T>) => {
    if (!inThrottleRef.current) {
      fnRef.current(...args);
      inThrottleRef.current = true;
      setTimeout(() => { inThrottleRef.current = false; }, limit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);
}
