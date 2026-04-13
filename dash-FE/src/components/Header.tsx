import { useNavigate } from 'react-router-dom';
import { useTheme, type ThemeMode } from '../context/ThemeContext';
import './Header.css';

const MODE_CYCLE: ThemeMode[] = ['auto', 'light', 'dark'];

const MODE_ICON: Record<ThemeMode, string> = {
  auto: '🕐',
  light: '☀️',
  dark: '🌙',
};

const MODE_LABEL: Record<ThemeMode, string> = {
  auto: '자동',
  light: '라이트',
  dark: '다크',
};

export default function Header() {
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();

  const cycleMode = () => {
    const next = MODE_CYCLE[(MODE_CYCLE.indexOf(mode) + 1) % MODE_CYCLE.length];
    setMode(next);
  };

  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand" onClick={() => navigate('/')}>
          <span className="brand-dash">Dash</span>
          <span className="brand-tag">Tag</span>
        </div>

        <div className="header-right">
          <button className="theme-btn" onClick={cycleMode} title={MODE_LABEL[mode]}>
            <span className="theme-icon">{MODE_ICON[mode]}</span>
            <span className="theme-label">{MODE_LABEL[mode]}</span>
          </button>
          <button className="signup-btn" onClick={() => navigate('/signup')}>
            시작하기
          </button>
        </div>
      </div>
    </header>
  );
}
