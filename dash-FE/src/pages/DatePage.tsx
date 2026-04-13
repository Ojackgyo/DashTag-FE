import './DatePage.css';

const PROFILES = [
  { id: 1, nickname: 'Aria', age: 23, major: '경영학과', face: '여우상', mbti: 'ENFP', height: 163, emoji: '🦊' },
  { id: 2, nickname: 'Luna', age: 25, major: '디자인학과', face: '고양이상', mbti: 'INFJ', height: 160, emoji: '🐱' },
  { id: 3, nickname: 'Stella', age: 22, major: '심리학과', face: '사슴상', mbti: 'ISFP', height: 165, emoji: '🦌' },
  { id: 4, nickname: 'Nova', age: 24, major: '컴퓨터공학과', face: '강아지상', mbti: 'ENTP', height: 168, emoji: '🐶' },
];

export default function DatePage() {
  return (
    <div className="date-page">
      <div className="page-top">
        <h1 className="page-title">1대1 소개팅 💘</h1>
        <p className="page-sub">나랑 꼭 맞는 한 사람을 만나보세요</p>
      </div>

      <div className="filter-bar">
        <button className="filter-chip active">전체</button>
        <button className="filter-chip">여우상</button>
        <button className="filter-chip">강아지상</button>
        <button className="filter-chip">고양이상</button>
        <button className="filter-chip">ENFP</button>
      </div>

      <div className="date-grid">
        {PROFILES.map((p) => (
          <div className="date-card" key={p.id}>
            <div className="date-avatar">
              <span>{p.emoji}</span>
            </div>
            <div className="date-card-info">
              <div className="date-name-row">
                <span className="date-nickname">{p.nickname}</span>
                <span className="date-mbti">{p.mbti}</span>
              </div>
              <p className="date-meta">{p.age}세 · {p.height}cm · {p.face}</p>
              <p className="date-major">{p.major}</p>
            </div>
            <div className="date-actions">
              <button className="action-pass">✕</button>
              <button className="action-like">♥</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bottom-spacer" />
    </div>
  );
}
