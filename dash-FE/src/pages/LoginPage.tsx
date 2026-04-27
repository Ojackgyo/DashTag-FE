import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

type Tab = 'login' | 'signup';

const FLOATS = [
  { emoji: '💗', left: '10%',  top: '8%',  delay: '0s',    size: '22px' },
  { emoji: '✨', left: '80%',  top: '10%', delay: '0.7s',  size: '16px' },
  { emoji: '💖', left: '55%',  top: '18%', delay: '1.3s',  size: '20px' },
  { emoji: '🌸', left: '25%',  top: '38%', delay: '0.4s',  size: '15px' },
  { emoji: '💝', left: '72%',  top: '34%', delay: '1.9s',  size: '18px' },
  { emoji: '⭐', left: '42%',  top: '6%',  delay: '1.1s',  size: '14px' },
];

const PROMO = [
  { icon: '💘', color: 'pink',   title: '1대1 소개팅',   desc: '나랑 딱 맞는 한 사람을 만나보세요' },
  { icon: '🎉', color: 'orange', title: '다대다 미팅',   desc: '친구들과 함께 설레는 만남을' },
  { icon: '📍', color: 'purple', title: '소모임 참여',   desc: '취미로 이어지는 자연스러운 인연' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  const canLogin = email.trim().length > 0 && pw.trim().length > 0;

  const handleLogin = () => navigate('/');
  const handleSignup = () => navigate('/signup');

  return (
    <div className="login-page">
      {/* Floating decorations */}
      <div className="login-decor">
        {FLOATS.map((f, i) => (
          <span
            key={i}
            className="login-float"
            style={{ left: f.left, top: f.top, animationDelay: f.delay, fontSize: f.size }}
          >
            {f.emoji}
          </span>
        ))}
      </div>

      {/* Branding */}
      <div className="login-brand">
        <div className="login-logo">💘</div>
        <h1 className="login-app-name">DashTag</h1>
        <p className="login-tagline">내 취향에 맞는 특별한 인연</p>
      </div>

      {/* Bottom card */}
      <div className="login-card">
        {/* Tab switcher */}
        <div className="login-tabs">
          <button className={`login-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>
            로그인
          </button>
          <button className={`login-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => setTab('signup')}>
            회원가입
          </button>
          <div className="login-tab-bar" style={{ transform: tab === 'login' ? 'translateX(0)' : 'translateX(100%)' }} />
        </div>

        {/* ── 로그인 탭 ── */}
        {tab === 'login' && (
          <div className="login-form">
            <div className="login-field">
              <label className="login-label">이메일</label>
              <input
                className="login-input"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="login-field">
              <label className="login-label">비밀번호</label>
              <input
                className="login-input"
                type="password"
                placeholder="비밀번호를 입력해주세요"
                value={pw}
                onChange={e => setPw(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && canLogin) handleLogin(); }}
              />
            </div>
            <p className="login-forgot">비밀번호를 잊으셨나요?</p>

            <button
              className={`login-submit ${canLogin ? 'enabled' : ''}`}
              onClick={handleLogin}
            >
              로그인
            </button>

            <div className="login-divider"><span>또는</span></div>

            <button className="login-kakao" onClick={handleLogin}>
              <span style={{ fontSize: '20px' }}>💬</span>
              카카오로 로그인
            </button>
          </div>
        )}

        {/* ── 회원가입 탭 ── */}
        {tab === 'signup' && (
          <div className="login-form">
            <div className="signup-promo">
              {PROMO.map(p => (
                <div key={p.title} className="signup-promo-item">
                  <div className={`signup-promo-icon ${p.color}`}>{p.icon}</div>
                  <div className="signup-promo-text">
                    <p>{p.title}</p>
                    <p>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="signup-start-btn" onClick={handleSignup}>
              회원가입 시작하기 →
            </button>

            <div className="login-divider"><span>또는</span></div>

            <button className="login-kakao" onClick={handleSignup}>
              <span style={{ fontSize: '20px' }}>💬</span>
              카카오로 시작하기
            </button>
          </div>
        )}

        {/* Switch */}
        <p className="login-switch">
          {tab === 'login' ? (
            <>계정이 없으신가요?{' '}
              <button className="login-switch-btn" onClick={() => setTab('signup')}>
                회원가입
              </button>
            </>
          ) : (
            <>이미 계정이 있으신가요?{' '}
              <button className="login-switch-btn" onClick={() => setTab('login')}>
                로그인
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
