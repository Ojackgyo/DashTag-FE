import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearTokens } from '../api/client';
import { useTheme } from '../context/ThemeContext';

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('dashtag_access_token'));
  const { isDark, setMode } = useTheme();

  useEffect(() => {
    const sync = () => setIsLoggedIn(!!localStorage.getItem('dashtag_access_token'));
    window.addEventListener('storage', sync);
    window.addEventListener('dashtag-auth', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('dashtag-auth', sync);
    };
  }, []);

  const handleLogout = () => {
    clearTokens();
    setIsLoggedIn(false);
    navigate('/login');
  };

  return (
    <header
      className="sticky top-0 z-[100]"
      style={{ background: 'var(--header-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-center justify-between gap-2.5 px-[18px] h-[54px]">
        {/* 브랜드 */}
        <div
          className="text-[21px] font-extrabold tracking-tight cursor-pointer select-none shrink-0"
          onClick={() => navigate('/')}
        >
          <span style={{ color: 'var(--text)' }}>Dash</span>
          <span style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Tag
          </span>
        </div>

        {/* 우측 버튼 */}
        <div className="flex items-center gap-2">
          {/* 테마 토글 */}
          <button
            onClick={() => setMode(isDark ? 'light' : 'dark')}
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center active:scale-95"
            style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text-sub)' }}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-[6px] rounded-full min-h-[34px] active:scale-95"
            style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text-sub)' }}
          >
            <ChatIcon />
            <span>채팅</span>
          </button>

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="text-[13px] font-bold px-4 py-[7px] rounded-full min-h-[34px] shrink-0 active:opacity-85 active:scale-95"
              style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text-sub)' }}
            >
              로그아웃
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="text-[13px] font-bold px-4 py-[7px] rounded-full min-h-[34px] text-white shrink-0 active:opacity-85 active:scale-95"
              style={{ background: 'var(--gradient)' }}
            >
              로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
