import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const QUICK_LOGIN_KEY = 'dashtag_saved_email';

const PROMO = [
  { icon: '💘', color: 'pink',   title: '1대1 소개팅',  desc: '나랑 딱 맞는 한 사람을 만나보세요' },
  { icon: '🎉', color: 'orange', title: '다대다 미팅',  desc: '친구들과 함께 설레는 만남을' },
  { icon: '📍', color: 'purple', title: '소모임 참여',  desc: '취미로 이어지는 자연스러운 인연' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [savedEmail, setSavedEmail] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(QUICK_LOGIN_KEY);
    if (saved) setSavedEmail(saved);
  }, []);

  const canLogin = email.trim().length > 0 && pw.trim().length > 0;

  const handleLogin = () => {
    if (!email.endsWith('@inha.edu')) {
      setError('인하대 이메일(@inha.edu)만 사용할 수 있어요');
      return;
    }
    localStorage.setItem(QUICK_LOGIN_KEY, email.trim());
    navigate('/');
  };

  const handleQuickLogin = () => {
    setEmail(savedEmail);
    setSavedEmail(''); // trigger focus on pw
    document.getElementById('pw-input')?.focus();
  };

  const handleForgotSend = () => {
    if (!forgotEmail.endsWith('@inha.edu')) {
      setError('인하대 이메일을 입력해주세요');
      return;
    }
    setForgotSent(true);
  };

  return (
    <div className="login-page">
      {/* 배경 파티클 */}
      <div className="login-bg-orb orb1" />
      <div className="login-bg-orb orb2" />
      <div className="login-bg-orb orb3" />

      {/* 브랜딩 */}
      <div className="login-brand">
        {/* TODO: 여기에 커스텀 앱 아이콘 이미지로 교체 */}
        <div className="login-logo">
          <span style={{ fontSize: 52 }}>🏷️</span>
        </div>
        <h1 className="login-app-name">DashTag</h1>
        <p className="login-tagline">인하대생만의 특별한 인연</p>
      </div>

      {/* 카드 */}
      <div className="login-card">

        {/* 탭 */}
        <div className="login-tabs">
          <button className={`login-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>
            로그인
          </button>
          <button className={`login-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => { setTab('signup'); setError(''); }}>
            회원가입
          </button>
          <div className="login-tab-bar" style={{ transform: tab === 'login' ? 'translateX(0)' : 'translateX(100%)' }} />
        </div>

        {/* ── 로그인 ── */}
        {tab === 'login' && (
          <div className="login-form">

            {/* 빠른 로그인 */}
            {savedEmail && (
              <button className="quick-login-card" onClick={handleQuickLogin}>
                <div className="quick-login-avatar">🏷️</div>
                <div className="quick-login-info">
                  <p className="quick-login-label">이전에 로그인한 계정</p>
                  <p className="quick-login-email">{savedEmail}</p>
                </div>
                <span className="quick-login-arrow">→</span>
              </button>
            )}

            <div className="login-field">
              <label className="login-label">인하대 이메일</label>
              <input
                className="login-input"
                type="email"
                placeholder="22000000@inha.edu"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                autoComplete="email"
              />
            </div>

            <div className="login-field">
              <label className="login-label">비밀번호</label>
              <div className="pw-wrap">
                <input
                  id="pw-input"
                  className="login-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="비밀번호를 입력해주세요"
                  value={pw}
                  onChange={e => { setPw(e.target.value); setError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter' && canLogin) handleLogin(); }}
                />
                <button className="pw-toggle" onClick={() => setShowPw(v => !v)}
                  style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button className="login-forgot-btn" onClick={() => { setShowForgot(true); setForgotSent(false); setError(''); }}>
              비밀번호를 잊으셨나요?
            </button>

            <button
              className={`login-submit ${canLogin ? 'enabled' : ''}`}
              onClick={handleLogin}
              disabled={!canLogin}
            >
              로그인
            </button>
          </div>
        )}

        {/* ── 회원가입 ── */}
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

            <div className="inha-notice">
              <span style={{ fontSize: 14 }}>🎓</span>
              <p>인하대 포털 이메일(@inha.edu)로만 가입할 수 있어요</p>
            </div>

            <button className="signup-start-btn" onClick={() => navigate('/signup')}>
              회원가입 시작하기 →
            </button>
          </div>
        )}

        <p className="login-switch">
          {tab === 'login' ? (
            <>계정이 없으신가요?{' '}
              <button className="login-switch-btn" onClick={() => setTab('signup')}>회원가입</button>
            </>
          ) : (
            <>이미 계정이 있으신가요?{' '}
              <button className="login-switch-btn" onClick={() => setTab('login')}>로그인</button>
            </>
          )}
        </p>
      </div>

      {/* ── 비밀번호 찾기 모달 ── */}
      {showForgot && (
        <div className="modal-overlay" onClick={() => setShowForgot(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowForgot(false)}>✕</button>
            {forgotSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <span style={{ fontSize: 44 }}>📬</span>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '14px 0 8px' }}>메일을 확인해주세요</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {forgotEmail}로<br/>비밀번호 재설정 링크를 보냈어요
                </p>
                <button className="login-submit enabled" style={{ marginTop: 24 }} onClick={() => setShowForgot(false)}>
                  확인
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>비밀번호 찾기 🔑</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
                  가입한 인하대 이메일을 입력하면<br/>재설정 링크를 보내드려요
                </p>
                <div className="login-field">
                  <label className="login-label">인하대 이메일</label>
                  <input
                    className="login-input"
                    type="email"
                    placeholder="22000000@inha.edu"
                    value={forgotEmail}
                    onChange={e => { setForgotEmail(e.target.value); setError(''); }}
                    autoFocus
                  />
                </div>
                {error && <p className="login-error" style={{ marginTop: 6 }}>{error}</p>}
                <button
                  className={`login-submit ${forgotEmail.endsWith('@inha.edu') ? 'enabled' : ''}`}
                  style={{ marginTop: 16 }}
                  onClick={handleForgotSend}
                >
                  재설정 링크 보내기
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
