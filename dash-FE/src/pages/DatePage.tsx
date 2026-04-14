import { useState } from 'react';

interface Profile {
  id: number;
  emoji: string;
  face: string;
  major: string;
  age: number;
  studentId: string;
  mbti: string;
  height: number;
  weight: number;
  smoking: boolean;
  datingStyle: string;
}

const PROFILES: Profile[] = [
  { id: 1, emoji: '🦊', face: '여우상', major: '경영학과', age: 23, studentId: '21학번', mbti: 'ENFP', height: 163, weight: 50, smoking: false, datingStyle: '다정하고 따뜻한 스타일' },
  { id: 2, emoji: '🐱', face: '고양이상', major: '디자인학과', age: 25, studentId: '19학번', mbti: 'INFJ', height: 160, weight: 48, smoking: false, datingStyle: '조용하지만 깊은 감성형' },
  { id: 3, emoji: '🦌', face: '사슴상', major: '심리학과', age: 22, studentId: '22학번', mbti: 'ISFP', height: 165, weight: 52, smoking: false, datingStyle: '함께 성장하는 관계 지향' },
  { id: 4, emoji: '🐶', face: '강아지상', major: '컴퓨터공학과', age: 24, studentId: '20학번', mbti: 'ENTP', height: 168, weight: 55, smoking: false, datingStyle: '활발하고 재미있는 스타일' },
  { id: 5, emoji: '🐻', face: '곰상', major: '사회학과', age: 26, studentId: '18학번', mbti: 'ISTJ', height: 162, weight: 51, smoking: false, datingStyle: '안정적이고 믿음직한 스타일' },
];

export default function DatePage() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [chatSentId, setChatSentId] = useState<number | null>(null);

  const filtered = search.trim()
    ? PROFILES.filter(p =>
        p.face.includes(search) ||
        p.major.includes(search) ||
        p.mbti.toLowerCase().includes(search.toLowerCase()) ||
        p.studentId.includes(search)
      )
    : PROFILES;

  const handleChatRequest = (id: number) => {
    if (chatSentId !== null) return;
    setChatSentId(id);
  };

  return (
    <div className="px-[18px] pb-6">
      {/* 상단 */}
      <div className="pt-6 pb-[18px]">
        <h1 className="text-[clamp(20px,6vw,24px)] font-extrabold tracking-tight mb-1" style={{ color: 'var(--text)' }}>
          1대1 소개팅 💘
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-sub)' }}>나랑 꼭 맞는 한 사람을 만나보세요</p>
      </div>

      {/* 검색 */}
      <div className="flex items-center gap-2 rounded-[14px] px-[14px] py-[11px] mb-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <span className="text-[15px] shrink-0">🔍</span>
        <input
          className="flex-1 bg-transparent text-[14px] min-w-0"
          style={{ color: 'var(--text)' }}
          placeholder="얼굴상, 학과, MBTI, 학번으로 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="text-[12px] px-1" style={{ color: 'var(--text-muted)' }} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* 카드 목록 */}
      <div className="flex flex-col gap-2.5">
        {filtered.map(p => {
          const isExpanded = expandedId === p.id;
          const isChatSent = chatSentId === p.id;
          const chatDisabled = chatSentId !== null && chatSentId !== p.id;

          return (
            <div
              key={p.id}
              className="rounded-[18px] p-[14px] border cursor-pointer active:scale-[0.99]"
              style={{
                background: 'var(--bg-card)',
                borderColor: isExpanded ? 'var(--primary-border)' : 'var(--border)',
              }}
              onClick={() => setExpandedId(isExpanded ? null : p.id)}
            >
              {/* 기본 정보 */}
              <div className="flex items-center gap-[13px]">
                <div
                  className="w-14 h-14 rounded-[17px] flex items-center justify-center text-[27px] shrink-0"
                  style={{ background: 'var(--bg-card2)' }}
                >
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-[7px] mb-1 flex-wrap">
                    <span className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>{p.face}</span>
                    <span
                      className="text-[11px] font-bold px-2 py-[2px] rounded-[7px]"
                      style={{ color: 'var(--primary)', background: 'var(--primary-bg)' }}
                    >
                      {p.mbti}
                    </span>
                  </div>
                  <p className="text-[12px] mb-[3px]" style={{ color: 'var(--text-sub)' }}>{p.age}세 · {p.studentId}</p>
                  <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{p.major}</p>
                </div>
                <span className="text-[11px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {isExpanded ? '▲' : '▽'}
                </span>
              </div>

              {/* 확장 정보 */}
              {isExpanded && (
                <div onClick={e => e.stopPropagation()}>
                  <div className="h-px my-[14px]" style={{ background: 'var(--border)' }} />
                  <div className="flex flex-col gap-[9px] mb-[14px]">
                    {[
                      { label: '키 / 몸무게', value: `${p.height}cm / ${p.weight}kg` },
                      { label: '흡연', value: p.smoking ? '🚬 흡연' : '🚭 비흡연' },
                      { label: '연애 스타일', value: p.datingStyle },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-start gap-2">
                        <span className="text-[12px] shrink-0 pt-[1px]" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                        <span className="text-[13px] font-semibold text-right leading-relaxed" style={{ color: 'var(--text)' }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    className="w-full text-[14px] font-bold py-[13px] rounded-[14px] min-h-[48px] active:opacity-80"
                    style={
                      isChatSent
                        ? { background: 'var(--bg-card2)', color: 'var(--primary)', border: '1px solid var(--primary-border)' }
                        : chatDisabled
                          ? { background: 'var(--bg-card2)', color: 'var(--text-muted)', cursor: 'not-allowed' }
                          : { background: 'var(--gradient)', color: 'white' }
                    }
                    onClick={() => handleChatRequest(p.id)}
                    disabled={chatDisabled || isChatSent}
                  >
                    {isChatSent ? '💌 채팅 요청 완료' : chatDisabled ? '오늘 채팅 요청을 이미 보냈어요' : '💬 채팅하기'}
                  </button>
                  {!isChatSent && !chatDisabled && (
                    <p className="text-center text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
                      하루에 한 명에게만 채팅을 보낼 수 있어요
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
