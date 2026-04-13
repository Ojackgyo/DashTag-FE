import './CommunityPage.css';

const POSTS = [
  {
    id: 1,
    emoji: '🎸',
    title: '홍대에서 같이 버스킹 볼 사람',
    category: '음악',
    location: '홍대',
    members: 3,
    maxMembers: 6,
    time: '방금 전',
  },
  {
    id: 2,
    emoji: '🧗',
    title: '주말 실내 클라이밍 같이 할 사람 구해요',
    category: '스포츠',
    location: '강남',
    members: 2,
    maxMembers: 4,
    time: '10분 전',
  },
  {
    id: 3,
    emoji: '📸',
    title: '한강에서 사진 찍을 사람~',
    category: '사진',
    location: '여의도',
    members: 4,
    maxMembers: 8,
    time: '30분 전',
  },
  {
    id: 4,
    emoji: '🎮',
    title: 'PC방 파티! VALORANT 같이해요',
    category: '게임',
    location: '신촌',
    members: 3,
    maxMembers: 5,
    time: '1시간 전',
  },
  {
    id: 5,
    emoji: '🍜',
    title: '신촌 맛집 탐방 같이 갈 분',
    category: '맛집',
    location: '신촌',
    members: 2,
    maxMembers: 5,
    time: '2시간 전',
  },
];

const CATEGORIES = ['전체', '음악', '스포츠', '사진', '게임', '맛집', '독서', '여행'];

export default function CommunityPage() {
  return (
    <div className="community-page">
      <div className="page-top">
        <h1 className="page-title">소모임 📍</h1>
        <p className="page-sub">취미로 연결되는 특별한 인연</p>
      </div>

      <div className="location-bar">
        <span className="location-icon">📍</span>
        <span className="location-text">서울 전체</span>
        <span className="location-arrow">›</span>
      </div>

      <div className="category-scroll">
        {CATEGORIES.map((c, i) => (
          <button className={`category-chip ${i === 0 ? 'active' : ''}`} key={c}>
            {c}
          </button>
        ))}
      </div>

      <button className="write-btn">
        ✏️ 소모임 만들기
      </button>

      <div className="post-list">
        {POSTS.map((p) => (
          <div className="post-card" key={p.id}>
            <div className="post-emoji-wrap">
              <span className="post-emoji">{p.emoji}</span>
            </div>
            <div className="post-body">
              <div className="post-category-row">
                <span className="post-category">{p.category}</span>
                <span className="post-time">{p.time}</span>
              </div>
              <h3 className="post-title">{p.title}</h3>
              <div className="post-footer">
                <span className="post-location">📍 {p.location}</span>
                <span className="post-members">
                  👥 {p.members}/{p.maxMembers}명
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bottom-spacer" />
    </div>
  );
}
