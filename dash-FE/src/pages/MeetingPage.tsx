import './MeetingPage.css';

const MEETINGS = [
  {
    id: 1,
    title: '홍대 카페 미팅',
    desc: '편하게 만나요 😊',
    date: '4월 20일 (일)',
    time: '오후 3시',
    ratio: '2:2',
    joined: 3,
    total: 4,
    tags: ['홍대', '카페', '20대'],
  },
  {
    id: 2,
    title: '강남 루프탑 미팅',
    desc: '야경 보면서 얘기해요 🌃',
    date: '4월 22일 (화)',
    time: '오후 7시',
    ratio: '3:3',
    joined: 4,
    total: 6,
    tags: ['강남', '루프탑', '직장인'],
  },
  {
    id: 3,
    title: '이태원 파티 미팅',
    desc: '신나게 즐겨봐요 🎶',
    date: '4월 26일 (토)',
    time: '오후 9시',
    ratio: '4:4',
    joined: 6,
    total: 8,
    tags: ['이태원', '파티', '외향적'],
  },
];

export default function MeetingPage() {
  return (
    <div className="meeting-page">
      <div className="page-top">
        <h1 className="page-title">다대다 미팅 🎉</h1>
        <p className="page-sub">친구들과 함께 새로운 인연을 만들어요</p>
      </div>

      <button className="create-meeting-btn">
        + 미팅 개설하기
      </button>

      <div className="meeting-list">
        {MEETINGS.map((m) => (
          <div className="meeting-card" key={m.id}>
            <div className="meeting-top">
              <div>
                <h3 className="meeting-title">{m.title}</h3>
                <p className="meeting-desc">{m.desc}</p>
              </div>
              <span className="meeting-ratio">{m.ratio}</span>
            </div>

            <div className="meeting-info-row">
              <span className="meeting-info-item">📅 {m.date}</span>
              <span className="meeting-info-item">⏰ {m.time}</span>
            </div>

            <div className="meeting-tags">
              {m.tags.map((t) => (
                <span className="meeting-tag" key={t}>#{t}</span>
              ))}
            </div>

            <div className="meeting-footer">
              <div className="meeting-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(m.joined / m.total) * 100}%` }}
                  />
                </div>
                <span className="progress-text">{m.joined}/{m.total}명</span>
              </div>
              <button className="join-btn">참여하기</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bottom-spacer" />
    </div>
  );
}
