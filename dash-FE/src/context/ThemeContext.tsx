import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

/* ─── Types ─── */
export type ThemeMode = 'auto' | 'light' | 'dark';
export type ThemeValue = 'light' | 'dark';

interface ThemeContextType {
  /** 실제 적용된 테마 ('light' | 'dark') */
  theme: ThemeValue;
  /** 사용자 설정 모드 ('auto' = 시간 기반 | 'light' | 'dark') */
  mode: ThemeMode;
  /** 모드 변경 */
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

/* ─── Helpers ─── */

/** 현재 시간 기반으로 테마 결정: 06:00 ~ 18:00 → light, 그 외 → dark */
function getTimeBasedTheme(): ThemeValue {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? 'light' : 'dark';
}

const STORAGE_KEY = 'dashtag_theme_mode';

function loadMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'auto' || saved === 'light' || saved === 'dark') return saved;
  } catch {
    // ignore
  }
  return 'light';
}

function resolveTheme(mode: ThemeMode): ThemeValue {
  if (mode === 'auto') return getTimeBasedTheme();
  return mode;
}

/* ─── Context ─── */
const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(loadMode);
  const [theme, setTheme] = useState<ThemeValue>(() => resolveTheme(loadMode()));

  /* 모드 변경 */
  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    setTheme(resolveTheme(next));
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }, []);

  /* auto 모드일 때 매 분마다 시간 체크 */
  useEffect(() => {
    if (mode !== 'auto') return;

    const tick = () => setTheme(getTimeBasedTheme());
    tick(); // 즉시 적용

    // 다음 정각 분까지 남은 ms 계산해서 딱 맞게 동기화
    const now = new Date();
    const msToNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    let intervalId: ReturnType<typeof setInterval>;
    const timeoutId = setTimeout(() => {
      tick();
      intervalId = setInterval(tick, 60_000);
    }, msToNextMinute);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [mode]);

  /* data-theme 속성 적용 */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
