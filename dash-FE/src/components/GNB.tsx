import { useLocation, useNavigate } from 'react-router-dom';
import './GNB.css';

const PINK_A = '#FF80AB';
const PINK_B = '#FFB3CC';

const NAV_ITEMS = [
  { path: '/', label: '홈', icon: HomeIcon },
  { path: '/date', label: '소개팅', icon: HeartIcon },
  { path: '/meeting', label: '미팅', icon: UsersIcon },
  { path: '/community', label: '소모임', icon: MapIcon },
  { path: '/myinfo', label: '내정보', icon: PersonIcon },
];

function GradDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={PINK_A} />
        <stop offset="100%" stopColor={PINK_B} />
      </linearGradient>
    </defs>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? `url(#g1)` : 'none'} stroke={active ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <GradDefs id="g1" />
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" stroke={active ? PINK_A : 'currentColor'} fill="none" />
    </svg>
  );
}

function HeartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? `url(#g2)` : 'none'} stroke={active ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <GradDefs id="g2" />
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function UsersIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? `url(#g3)` : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <GradDefs id="g3" />
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function MapIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? `url(#g4)` : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <GradDefs id="g4" />
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PersonIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? `url(#g5)` : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <GradDefs id="g5" />
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function GNB() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/signup') return null;

  return (
    <nav className="gnb">
      {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            className={`gnb-item ${active ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon active={active} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
