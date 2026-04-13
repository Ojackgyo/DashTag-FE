import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const MOCK_PROFILES = [
  { id: 1, nickname: 'Aria', age: 23, major: '경영학과', face: '여우상', mbti: 'ENFP', tags: ['커피 좋아해', '여행 매니아'] },
  { id: 2, nickname: 'Luna', age: 25, major: '디자인학과', face: '고양이상', mbti: 'INFJ', tags: ['그림 그리기', '독서'] },
  { id: 3, nickname: 'Stella', age: 22, major: '심리학과', face: '사슴상', mbti: 'ISFP', tags: ['음악 덕후', '캠핑'] },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-badge">NEW</div>
        <h1 className="hero-title">
          내 취향에 맞는<br />
          <span className="gradient-text">특별한 인연</span>을 찾아요
        </h1>
        <p className="hero-sub">DashTag와 함께 진짜 나와 맞는 사람을 만나보세요</p>
        <button className="hero-cta" onClick={() => navigate('/signup')}>
          무료로 시작하기 →
        </button>
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">오늘의 추천</h2>
          <button className="see-all">전체보기</button>
        </div>
        <div className="profile-list">
          {MOCK_PROFILES.map((p) => (
            <div className="profile-card" key={p.id}>
              <div className="profile-avatar">
                <span className="avatar-emoji">
                  {p.face === '여우상' ? '🦊' : p.face === '고양이상' ? '🐱' : '🦌'}
                </span>
              </div>
              <div className="profile-info">
                <div className="profile-top">
                  <span className="profile-nickname">{p.nickname}</span>
                  <span className="profile-age">{p.age}세</span>
                  <span className="profile-mbti">{p.mbti}</span>
                </div>
                <p className="profile-meta">{p.major} · {p.face}</p>
                <div className="profile-tags">
                  {p.tags.map((t) => (
                    <span className="tag" key={t}>{t}</span>
                  ))}
                </div>
              </div>
              <button className="like-btn">♥</button>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">이런 건 어때요?</h2>
        </div>
        <div className="menu-grid">
          <div className="menu-card pink" onClick={() => navigate('/date')}>
            <span className="menu-icon">💘</span>
            <span className="menu-label">1대1 소개팅</span>
            <span className="menu-desc">나랑 딱 맞는 한 사람</span>
          </div>
          <div className="menu-card orange" onClick={() => navigate('/meeting')}>
            <span className="menu-icon">🎉</span>
            <span className="menu-label">다대다 미팅</span>
            <span className="menu-desc">친구들과 함께</span>
          </div>
          <div className="menu-card purple" onClick={() => navigate('/community')}>
            <span className="menu-icon">📍</span>
            <span className="menu-label">소모임</span>
            <span className="menu-desc">취미로 연결되는 인연</span>
          </div>
        </div>
      </section>

      <div className="bottom-spacer" />
    </div>
  );
}
