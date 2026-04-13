import { useNavigate } from 'react-router-dom';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand" onClick={() => navigate('/')}>
          <span className="brand-dash">Dash</span>
          <span className="brand-tag">Tag</span>
        </div>
        <button className="signup-btn" onClick={() => navigate('/signup')}>
          시작하기
        </button>
      </div>
    </header>
  );
}
