import { useNavigate } from 'react-router-dom';

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

export default function Header() {
  const navigate = useNavigate();

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
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-[6px] rounded-full min-h-[34px] active:scale-95"
            style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text-sub)' }}
          >
            <ChatIcon />
            <span>채팅</span>
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="text-[13px] font-bold px-4 py-[7px] rounded-full min-h-[34px] text-white shrink-0 active:opacity-85 active:scale-95"
            style={{ background: 'var(--gradient)' }}
          >
            시작하기
          </button>
        </div>
      </div>
    </header>
  );
}
