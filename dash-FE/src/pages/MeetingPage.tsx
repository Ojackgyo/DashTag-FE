import { useState } from 'react';
import { useChance } from '../hooks/useChance';
import ChanceModal from '../components/ChanceModal';

const DAYS_KR = ['일', '월', '화', '수', '목', '금', '토'];

function getWeekDays() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      day:   DAYS_KR[d.getDay()],
      short: i === 0 ? '오늘' : i === 1 ? '내일' : DAYS_KR[d.getDay()],
    };
  });
}

interface Participant {
  nickname: string;
  emoji: string;
  face: string;
  mbti: string;
  charmPoints: string[];
  gender: 'f' | 'm';
}

interface Meeting {
  id: number;
  code: string;
  title: string;
  keywords: string[];
  femaleCount: number;
  maleCount: number;
  day: string;
  joined: { f: number; m: number };
  participants: Participant[];
  isOwner?: boolean;
}

const MEETINGS: Meeting[] = [
  {
    id: 1, code: 'DT-CAFE', title: '조용한 카페에서 같이 공부해요 ☕', keywords: ['카페', '조용한'],
    femaleCount: 2, maleCount: 2, day: '4/20(일)', joined: { f: 1, m: 2 },
    participants: [
      { nickname: 'Nova',  emoji: '🐱', face: '고양이상', mbti: 'INFJ', charmPoints: ['감성적', '그림 잘 그림'],         gender: 'f' },
      { nickname: 'Zack',  emoji: '🐶', face: '강아지상', mbti: 'ENTP', charmPoints: ['재미있음', '추진력 있음'],        gender: 'm' },
      { nickname: 'Ethan', emoji: '🐻', face: '곰상',     mbti: 'ISTJ', charmPoints: ['믿음직함', '요리 잘함'],          gender: 'm' },
    ],
  },
  {
    id: 2, code: 'DT-GYM1', title: '헬스하고 같이 밥 먹을 사람 🏋️', keywords: ['운동', '활발한'],
    femaleCount: 3, maleCount: 3, day: '4/22(화)', joined: { f: 2, m: 1 },
    participants: [
      { nickname: 'Aria',  emoji: '🦊', face: '여우상', mbti: 'ENFP', charmPoints: ['유머러스', '애교 많음'],            gender: 'f' },
      { nickname: 'Luna',  emoji: '🦌', face: '사슴상', mbti: 'ISFP', charmPoints: ['공감 잘함', '목소리 좋음'],         gender: 'f' },
      { nickname: 'Jake',  emoji: '🐺', face: '늑대상', mbti: 'ENTJ', charmPoints: ['운동 잘함', '리더십'],              gender: 'm' },
    ],
  },
  {
    id: 3, code: 'DT-FOOD', title: '홍대 맛집 투어 같이 가요 🍜', keywords: ['맛집', '유쾌한'],
    femaleCount: 2, maleCount: 2, day: '4/23(수)', joined: { f: 0, m: 1 },
    participants: [
      { nickname: 'Ryan',  emoji: '🦊', face: '여우상', mbti: 'ESTP', charmPoints: ['유쾌함', '맛집 탐방 고수'],        gender: 'm' },
    ],
  },
  {
    id: 4, code: 'DT-FILM', title: '영화 보고 카페 수다 떨어요 🎬', keywords: ['영화', '취미'],
    femaleCount: 3, maleCount: 3, day: '4/25(금)', joined: { f: 2, m: 2 },
    participants: [
      { nickname: 'Mia',   emoji: '🐰', face: '토끼상', mbti: 'ESFJ', charmPoints: ['친절함', '밝은 에너지'],           gender: 'f' },
      { nickname: 'Sora',  emoji: '🐱', face: '고양이상', mbti: 'INFP', charmPoints: ['감수성 풍부', '영화 덕후'],       gender: 'f' },
      { nickname: 'Liam',  emoji: '🐶', face: '강아지상', mbti: 'ENFJ', charmPoints: ['공감 잘함', '수다 잘 떪'],        gender: 'm' },
      { nickname: 'Owen',  emoji: '🦌', face: '사슴상',   mbti: 'INTP', charmPoints: ['영화 박식', '조용한 유머'],       gender: 'm' },
    ],
  },
  {
    id: 5, code: 'DT-GAME', title: '보드게임 카페 즐길 분 구해요 🎲', keywords: ['게임', '감성적'],
    femaleCount: 2, maleCount: 2, day: '4/26(토)', joined: { f: 1, m: 0 },
    participants: [
      { nickname: 'Hana',  emoji: '🐻', face: '곰상',   mbti: 'ISFJ', charmPoints: ['꼼꼼함', '보드게임 고수'],          gender: 'f' },
    ],
  },
];


/* ── 세로 배터리 컴포넌트 ── */
function Battery({ filled, total }: { filled: number; total: number }) {
  const isFull = filled >= total;
  const cellH  = Math.min(20, Math.floor(80 / total));

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* 배터리 단자 (위쪽 nub) */}
      <div style={{
        width: 10, height: 4,
        borderRadius: '3px 3px 0 0',
        marginBottom: -1,
        background: isFull ? 'var(--primary)' : 'var(--border)',
        transition: 'background 0.3s',
      }} />
      {/* 배터리 몸통 — 위에서 아래로 쌓이고, 아래부터 채워짐 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        padding: '3px',
        border: `2px solid ${isFull ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: '7px',
        background: 'var(--bg-card2)',
        boxShadow: isFull ? '0 0 10px rgba(255,128,171,0.45)' : 'none',
        transition: 'box-shadow 0.3s, border-color 0.3s',
      }}>
        {/* 배열 뒤집어서 위가 비어있고 아래부터 차도록 */}
        {Array.from({ length: total }, (_, i) => {
          const cellIndex = total - 1 - i;   // 0 = 맨 위 칸
          const active    = cellIndex < filled;
          return (
            <div
              key={i}
              style={{
                width: 22,
                height: cellH,
                borderRadius: 4,
                transition: 'background 0.35s, box-shadow 0.35s',
                background: active ? (isFull ? '#FF80AB' : '#FFB3CC') : 'var(--bg-card)',
                boxShadow: active && isFull ? '0 0 5px rgba(255,128,171,0.7)' : 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ── 미팅 카드 ── */
function MeetingCard({ m, onJoin }: { m: Meeting; onJoin: (m: Meeting) => void }) {
  const fFull = m.joined.f >= m.femaleCount;
  const mFull = m.joined.m >= m.maleCount;
  const full  = fFull && mFull;

  return (
    <div
      className="rounded-[20px] p-4 border"
      style={{
        background: 'var(--bg-card)',
        borderColor: full ? 'var(--primary-border)' : 'var(--border)',
      }}
    >
      {/* 제목 */}
      <p className="text-[14px] font-bold leading-snug mb-2.5" style={{ color: 'var(--text)' }}>
        {m.title}
      </p>

      {/* 키워드 */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {m.keywords.map(k => (
          <span
            key={k}
            className="text-[11px] font-semibold px-[8px] py-[3px] rounded-[7px]"
            style={{ color: 'var(--primary)', background: 'var(--primary-bg)' }}
          >
            #{k}
          </span>
        ))}
      </div>

      {/* 배터리 인원 표시 */}
      <div className="flex items-center justify-around mb-3">
        {/* 여성 */}
        <div className="flex flex-col items-center gap-2">
          <span style={{ fontSize: 28 }}>🩷</span>
          <Battery filled={m.joined.f} total={m.femaleCount} />
          <div className="flex flex-col items-center gap-[2px]">
            <span className="text-[22px] font-extrabold" style={{ color: fFull ? 'var(--primary)' : 'var(--text)', lineHeight: 1 }}>
              {m.joined.f}
              <span className="text-[14px] font-semibold" style={{ color: 'var(--text-muted)' }}>/{m.femaleCount}</span>
            </span>
            {fFull && <span className="text-[10px] font-bold px-1.5 py-[1px] rounded-[5px]" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>FULL</span>}
          </div>
        </div>

        {/* 가운데: 날짜 + VS */}
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="text-[15px] font-extrabold px-3 py-1 rounded-[10px]"
            style={{ background: 'var(--gradient)', color: 'white' }}
          >
            {m.day}
          </span>
          <span className="text-[12px] font-bold" style={{ color: 'var(--text-muted)' }}>VS</span>
        </div>

        {/* 남성 */}
        <div className="flex flex-col items-center gap-2">
          <span style={{ fontSize: 28 }}>🩵</span>
          <Battery filled={m.joined.m} total={m.maleCount} />
          <div className="flex flex-col items-center gap-[2px]">
            <span className="text-[22px] font-extrabold" style={{ color: mFull ? 'var(--primary)' : 'var(--text)', lineHeight: 1 }}>
              {m.joined.m}
              <span className="text-[14px] font-semibold" style={{ color: 'var(--text-muted)' }}>/{m.maleCount}</span>
            </span>
            {mFull && <span className="text-[10px] font-bold px-1.5 py-[1px] rounded-[5px]" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>FULL</span>}
          </div>
        </div>
      </div>

      {/* 참여 버튼 */}
      <button
        className="w-full text-[14px] font-bold py-[12px] rounded-[14px] min-h-[44px] active:opacity-80"
        style={{
          background: full ? 'var(--bg-card2)' : 'var(--gradient)',
          color: full ? 'var(--text-muted)' : 'white',
          cursor: full ? 'not-allowed' : 'pointer',
          boxShadow: full ? 'none' : '0 3px 12px rgba(255,128,171,0.3)',
        }}
        disabled={full}
        onClick={() => !full && onJoin(m)}
      >
        {full ? '🔒 마감된 미팅이에요' : '참여하기'}
      </button>
    </div>
  );
}

/* ── 방장 초대 코드 배너 ── */
function OwnerCodeBanner({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-[18px] p-4 border" style={{ background: 'var(--primary-bg)', borderColor: 'var(--primary-border)' }}>
      <p className="text-[11px] font-bold mb-2.5" style={{ color: 'var(--primary)' }}>🎉 내가 만든 방 · 친구에게 코드를 공유해보세요</p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[24px] font-extrabold tracking-[4px]" style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>
          {code}
        </span>
        <button
          className="text-[13px] font-bold px-4 py-2 rounded-[12px] min-w-[72px] shrink-0"
          style={copied
            ? { background: 'rgba(100,200,130,0.15)', color: '#4CAF50', border: '1px solid rgba(100,200,130,0.4)' }
            : { background: 'var(--gradient)', color: 'white' }
          }
          onClick={handleCopy}
        >
          {copied ? '✓ 복사됨' : '코드 복사'}
        </button>
      </div>
    </div>
  );
}

/* ── 미팅 룸 뷰 ── */
function MeetingRoomView({ meeting, ownerCode, onBack }: { meeting: Meeting; ownerCode?: string; onBack: () => void }) {
  const females = meeting.participants.filter(p => p.gender === 'f');
  const males   = meeting.participants.filter(p => p.gender === 'm');

  const ParticipantCard = ({ p }: { p: Participant }) => (
    <div
      className="flex items-start gap-3 rounded-[18px] p-3.5 border"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div
        className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center text-[26px] shrink-0"
        style={{ background: 'var(--primary-bg)' }}
      >
        {p.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>{p.nickname}</span>
          <span className="text-[11px] font-bold px-2 py-[2px] rounded-[7px]" style={{ color: 'var(--primary)', background: 'var(--primary-bg)' }}>{p.mbti}</span>
          <span className="text-[11px] font-semibold px-2 py-[2px] rounded-[7px]" style={{ color: 'var(--text-sub)', background: 'var(--bg-card2)' }}>{p.face}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {p.charmPoints.map(c => (
            <span
              key={c}
              className="text-[12px] font-semibold px-2.5 py-[4px] rounded-[20px]"
              style={{ color: 'var(--primary)', background: 'var(--primary-bg)', border: '1px solid var(--primary-border)' }}
            >
              #{c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 flex justify-center"
      style={{ zIndex: 200 }}
    >
    <div
      className="slide-in-right w-full overflow-y-auto pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ background: 'var(--bg)', maxWidth: '390px' }}
    >
      {/* 헤더 */}
      <div
        className="sticky top-0 flex items-center gap-3 px-[18px] py-3 border-b z-10"
        style={{ background: 'var(--header-bg)', backdropFilter: 'blur(16px)', borderColor: 'var(--border)' }}
      >
        <button
          className="w-9 h-9 rounded-[11px] flex items-center justify-center text-[17px] font-semibold border shrink-0"
          style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text-sub)' }}
          onClick={onBack}
        >←</button>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold truncate" style={{ color: 'var(--text)' }}>{meeting.title}</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{meeting.day}</p>
        </div>
      </div>

      <div className="px-[18px] pt-5 flex flex-col gap-5">
        {/* 내가 만든 방 - 초대 코드 */}
        {ownerCode && <OwnerCodeBanner code={ownerCode} />}

        {/* 키워드 + 날짜 */}
        <div className="flex items-center gap-2 flex-wrap">
          {meeting.keywords.map(k => (
            <span key={k} className="text-[12px] font-semibold px-[10px] py-[4px] rounded-[8px]" style={{ color: 'var(--primary)', background: 'var(--primary-bg)' }}>#{k}</span>
          ))}
          <span className="text-[12px] font-semibold px-[10px] py-[4px] rounded-[8px]" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>📅 {meeting.day}</span>
        </div>

        {/* 여성 참가자 */}
        {females.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[18px]">🩷</span>
              <span className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>여성 참가자</span>
              <span className="text-[12px] font-semibold px-2 py-[2px] rounded-[7px]" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>{females.length}/{meeting.femaleCount}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {females.map(p => <ParticipantCard key={p.nickname} p={p} />)}
              {Array.from({ length: meeting.femaleCount - females.length }, (_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-[18px] p-3.5 border border-dashed" style={{ borderColor: 'var(--border)' }}>
                  <div className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center text-[22px] shrink-0" style={{ background: 'var(--bg-card2)' }}>🩷</div>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>자리 비어있어요</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 남성 참가자 */}
        {males.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[18px]">🩵</span>
              <span className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>남성 참가자</span>
              <span className="text-[12px] font-semibold px-2 py-[2px] rounded-[7px]" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>{males.length}/{meeting.maleCount}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {males.map(p => <ParticipantCard key={p.nickname} p={p} />)}
              {Array.from({ length: meeting.maleCount - males.length }, (_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-[18px] p-3.5 border border-dashed" style={{ borderColor: 'var(--border)' }}>
                  <div className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center text-[22px] shrink-0" style={{ background: 'var(--bg-card2)' }}>🩵</div>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>자리 비어있어요</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 아직 아무도 없을 때 */}
        {meeting.participants.length === 0 && (
          <div className="flex flex-col items-center py-12 gap-3">
            <span className="text-[48px]">🎉</span>
            <p className="text-[15px] font-bold" style={{ color: 'var(--text-sub)' }}>아직 참가자가 없어요</p>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>첫 번째 참가자가 되어보세요!</p>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

/* ── 개설 폼 (바텀시트) ── */
function CreateSheet({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (data: { title: string; keywords: string[]; femaleCount: number; maleCount: number; day: string }) => void;
}) {
  const weekDays = getWeekDays();
  const [title,        setTitle]        = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords,     setKeywords]     = useState<string[]>([]);
  const [femaleCount,  setFemaleCount]  = useState(2);
  const [maleCount,    setMaleCount]    = useState(2);
  const [selectedDay,  setSelectedDay]  = useState(0);

  const addKeyword = () => {
    const k = keywordInput.trim();
    if (!k || keywords.includes(k) || keywords.length >= 3) return;
    setKeywords(prev => [...prev, k]);
    setKeywordInput('');
  };

  const removeKeyword = (k: string) => setKeywords(prev => prev.filter(x => x !== k));

  const Counter = ({ count, set }: { count: number; set: React.Dispatch<React.SetStateAction<number>> }) => (
    <div className="flex items-center gap-3">
      <button
        className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[18px] font-bold border"
        style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)' }}
        onClick={() => set(c => Math.max(1, c - 1))}
      >−</button>
      <span className="text-[20px] font-extrabold min-w-[24px] text-center" style={{ color: 'var(--text)' }}>{count}</span>
      <button
        className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[18px] font-bold border"
        style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)' }}
        onClick={() => set(c => Math.min(5, c + 1))}
      >+</button>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[390px] rounded-[28px_28px_0_0] px-5 pt-6 pb-10 overflow-y-auto max-h-[88vh] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ background: 'var(--bg-card)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-[18px] font-extrabold" style={{ color: 'var(--text)' }}>🎉 미팅 개설하기</span>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] border"
            style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            onClick={onClose}
          >✕</button>
        </div>

        {/* 인원 */}
        <p className="text-[13px] font-bold mb-3" style={{ color: 'var(--text-sub)' }}>인원 구성</p>
        <div
          className="flex items-center justify-around rounded-[18px] py-4 px-3 mb-5 border"
          style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)' }}
        >
          <div className="flex flex-col items-center gap-2.5">
            <span className="text-[28px]">👩</span>
            <span className="text-[12px] font-semibold" style={{ color: 'var(--text-sub)' }}>여성</span>
            <Counter count={femaleCount} set={setFemaleCount} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[22px]">💕</span>
            <span className="text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>VS</span>
          </div>
          <div className="flex flex-col items-center gap-2.5">
            <span className="text-[28px]">👨</span>
            <span className="text-[12px] font-semibold" style={{ color: 'var(--text-sub)' }}>남성</span>
            <Counter count={maleCount} set={setMaleCount} />
          </div>
        </div>

        {/* 요일 */}
        <p className="text-[13px] font-bold mb-3" style={{ color: 'var(--text-sub)' }}>날짜</p>
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {weekDays.map((d, i) => (
            <button
              key={i}
              className="flex flex-col items-center gap-[3px] rounded-[14px] px-3 py-2.5 min-w-[54px] shrink-0 border"
              style={selectedDay === i
                ? { background: 'var(--gradient)', borderColor: 'transparent', color: 'white' }
                : { background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text-sub)' }
              }
              onClick={() => setSelectedDay(i)}
            >
              <span className="text-[13px] font-bold">{d.short}</span>
              <span className="text-[10px] opacity-70">{d.label}</span>
              <span className="text-[10px] opacity-60">{d.day}요일</span>
            </button>
          ))}
        </div>

        {/* 제목 */}
        <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-sub)' }}>미팅 제목</p>
        <input
          className="w-full rounded-[14px] px-4 py-3 text-[14px] font-medium border mb-5"
          style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)' }}
          placeholder="ex. 공대생 카페 미팅 구해요 ☕"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        {/* 키워드 직접 입력 */}
        <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-sub)' }}>
          키워드
          <span className="text-[11px] font-normal ml-1.5" style={{ color: 'var(--text-muted)' }}>최대 3개</span>
        </p>
        <div className="flex gap-2 mb-3">
          <input
            placeholder={keywords.length >= 3 ? '최대 3개까지 입력할 수 있어요' : 'ex. 카페, 운동, 감성적…'}
            value={keywordInput}
            onChange={e => setKeywordInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); addKeyword(); } }}
            disabled={keywords.length >= 3}
            style={keywords.length >= 3
              ? { background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)', opacity: 0.45, flex: 1, borderRadius: '12px', padding: '11px 16px', fontSize: '14px', border: '1px solid var(--border)' }
              : { background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)', flex: 1, borderRadius: '12px', padding: '11px 16px', fontSize: '14px', border: '1px solid var(--border)' }
            }
          />
          <button
            className="px-4 rounded-[12px] text-[13px] font-bold shrink-0"
            style={keywordInput.trim() && keywords.length < 3
              ? { background: 'var(--gradient)', color: 'white' }
              : { background: 'var(--bg-card2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
            }
            onClick={addKeyword}
            disabled={!keywordInput.trim() || keywords.length >= 3}
          >추가</button>
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {keywords.map(k => (
              <span
                key={k}
                className="inline-flex items-center gap-1.5 text-[13px] font-bold px-3 py-[7px] rounded-[20px]"
                style={{ background: 'var(--primary-bg)', border: '1.5px solid var(--primary-border)', color: 'var(--primary)' }}
              >
                #{k}
                <button className="text-[14px] opacity-60 hover:opacity-100" onClick={() => removeKeyword(k)}>×</button>
              </span>
            ))}
          </div>
        )}
        {keywords.length === 0 && <div className="mb-5" />}

        {/* 미리보기 요약 */}
        <div
          className="flex items-center gap-3 rounded-[14px] px-4 py-3 mb-5 border"
          style={{ background: 'var(--primary-bg)', borderColor: 'var(--primary-border)' }}
        >
          <span className="text-[20px]">📋</span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold truncate" style={{ color: 'var(--primary)' }}>
              {title || '제목을 입력해주세요'}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {femaleCount}명 : {maleCount}명 · {weekDays[selectedDay].label}({weekDays[selectedDay].day}){keywords.length > 0 ? ' · ' + keywords.map(k => `#${k}`).join(' ') : ''}
            </p>
          </div>
        </div>

        <button
          className="w-full text-[15px] font-bold py-[15px] rounded-[16px] min-h-[52px] text-white active:opacity-80"
          style={title.trim()
            ? { background: 'var(--gradient)', boxShadow: '0 4px 16px rgba(255,128,171,0.35)' }
            : { background: 'var(--bg-card2)', color: 'var(--text-muted)' }
          }
          disabled={!title.trim()}
          onClick={() => onSubmit({ title, keywords, femaleCount, maleCount, day: weekDays[selectedDay].label })}
        >
          개설하기 🎉
        </button>
      </div>
    </div>
  );
}

/* ── 친구 초대 바텀시트 ── */
function InviteSheet({ code, onClose }: { code: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[390px] rounded-[28px_28px_0_0] px-5 pt-5 pb-10"
        style={{ background: 'var(--bg-card)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-9 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--border)' }} />

        <p className="text-[18px] font-extrabold mb-1" style={{ color: 'var(--text)' }}>👫 친구 초대하기</p>
        <p className="text-[13px] mb-5" style={{ color: 'var(--text-muted)' }}>
          친구가 이 코드로 입장하면 같은 팀에 자동 배정돼요
        </p>

        {/* 초대 코드 */}
        <div
          className="flex items-center justify-between rounded-[16px] px-4 py-3.5 mb-3 border"
          style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)' }}
        >
          <span className="text-[22px] font-extrabold tracking-[4px]" style={{ color: 'var(--primary)' }}>{code}</span>
          <button
            className="text-[12px] font-bold px-3 py-1.5 rounded-[10px] min-w-[60px] transition-all"
            style={copied
              ? { background: 'rgba(100,200,130,0.15)', color: '#4CAF50', border: '1px solid rgba(100,200,130,0.4)' }
              : { background: 'var(--gradient)', color: 'white' }
            }
            onClick={handleCopy}
          >
            {copied ? '✓ 복사됨' : '복사'}
          </button>
        </div>

        {/* 카카오 공유 */}
        <button
          className="w-full flex items-center justify-center gap-2 py-[14px] rounded-[16px] text-[14px] font-bold mb-4"
          style={{ background: '#FEE500', color: '#3A1D1D' }}
          onClick={onClose}
        >
          <span className="text-[18px]">💬</span>
          카카오로 친구에게 공유하기
        </button>

        <p className="text-center text-[11px]" style={{ color: 'var(--text-muted)' }}>
          코드는 이 미팅이 마감될 때까지 유효해요
        </p>
      </div>
    </div>
  );
}

/* ── 기회 사용 페이지 (크레이지 아케이드 대기창 스타일) ── */
function ChancePage({
  meeting,
  ownerCode,
  onBack,
  onUse,
}: {
  meeting: Meeting;
  ownerCode?: string;
  onBack: () => void;
  onUse?: () => void;
}) {
  const { hasChance } = useChance();
  const [showInvite,    setShowInvite]    = useState(false);
  const [friendInvited, setFriendInvited] = useState(false);
  const [inviteCode]                      = useState(() => 'DT-' + Math.random().toString(36).slice(2, 6).toUpperCase());
  const codeForInvite = ownerCode ?? inviteCode;

  const females = meeting.participants.filter(p => p.gender === 'f');
  const males   = meeting.participants.filter(p => p.gender === 'm');

  // 슬롯 배열: 실제 참가자 + null(빈 자리)
  const femaleSlots = Array.from({ length: meeting.femaleCount }, (_, i) => females[i] ?? null);
  const maleSlots   = Array.from({ length: meeting.maleCount  }, (_, i) => males[i]   ?? null);

  const FilledSlot = ({ p, delay, teamColor }: { p: Participant; delay: number; teamColor: string }) => (
    <div
      className="slot-reel rounded-[14px] px-2.5 py-2 border flex items-center gap-2.5"
      style={{
        animationDelay: `${delay}s`,
        background: 'var(--bg-card)',
        borderColor: teamColor === 'pink' ? 'var(--primary-border)' : 'rgba(100,180,255,0.35)',
        boxShadow: teamColor === 'pink'
          ? '0 2px 8px rgba(255,128,171,0.15)'
          : '0 2px 8px rgba(100,180,255,0.15)',
      }}
    >
      {/* 아바타 */}
      <div
        className="w-[40px] h-[40px] rounded-[11px] flex items-center justify-center text-[20px] shrink-0"
        style={{
          background: teamColor === 'pink' ? 'var(--primary-bg)' : 'rgba(100,180,255,0.12)',
        }}
      >
        {p.emoji}
      </div>
      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-[3px]">
          <span className="text-[12px] font-extrabold truncate" style={{ color: 'var(--text)' }}>{p.nickname}</span>
          <span
            className="text-[9px] font-bold px-1.5 py-[1px] rounded-[5px] shrink-0"
            style={{
              color: teamColor === 'pink' ? 'var(--primary)' : '#60B4FF',
              background: teamColor === 'pink' ? 'var(--primary-bg)' : 'rgba(100,180,255,0.14)',
            }}
          >{p.mbti}</span>
        </div>
        {p.charmPoints[0] && (
          <span
            className="text-[9px] font-semibold px-1.5 py-[1px] rounded-[20px] inline-block truncate max-w-full"
            style={{
              color: teamColor === 'pink' ? 'var(--primary)' : '#60B4FF',
              background: teamColor === 'pink' ? 'var(--primary-bg)' : 'rgba(100,180,255,0.12)',
              border: teamColor === 'pink' ? '1px solid var(--primary-border)' : '1px solid rgba(100,180,255,0.3)',
            }}
          >#{p.charmPoints[0]}</span>
        )}
      </div>
    </div>
  );

  const EmptySlot = ({ teamColor, delay, invited = false }: { teamColor: string; delay: number; invited?: boolean }) => (
    <div
      className="wait-slot rounded-[14px] px-2.5 py-2 border flex items-center gap-2.5"
      style={{
        animationDelay: `${delay}s`,
        height: 56,
        borderStyle: invited ? 'solid' : 'dashed',
        borderColor: invited
          ? (teamColor === 'pink' ? 'rgba(255,128,171,0.7)' : 'rgba(100,180,255,0.7)')
          : (teamColor === 'pink' ? 'rgba(255,128,171,0.3)' : 'rgba(100,180,255,0.3)'),
        background: invited
          ? (teamColor === 'pink' ? 'rgba(255,128,171,0.1)' : 'rgba(100,180,255,0.1)')
          : (teamColor === 'pink' ? 'rgba(255,128,171,0.04)' : 'rgba(100,180,255,0.04)'),
      }}
    >
      <div
        className="w-[40px] h-[40px] rounded-[11px] flex items-center justify-center text-[18px] shrink-0"
        style={{
          opacity: invited ? 0.9 : 0.35,
          background: teamColor === 'pink' ? 'rgba(255,128,171,0.12)' : 'rgba(100,180,255,0.12)',
        }}
      >
        {invited ? '👫' : (teamColor === 'pink' ? '🩷' : '🩵')}
      </div>
      {invited ? (
        <div className="flex flex-col gap-[2px]">
          <span className="text-[11px] font-bold" style={{ color: teamColor === 'pink' ? 'var(--primary)' : '#60B4FF' }}>
            친구 대기 중
          </span>
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>초대 코드 공유됨</span>
        </div>
      ) : (
        <div className="flex items-center gap-[2px]">
          <span className="dot1 text-[18px] font-black leading-none" style={{ color: teamColor === 'pink' ? 'var(--primary)' : '#60B4FF' }}>·</span>
          <span className="dot2 text-[18px] font-black leading-none" style={{ color: teamColor === 'pink' ? 'var(--primary)' : '#60B4FF' }}>·</span>
          <span className="dot3 text-[18px] font-black leading-none" style={{ color: teamColor === 'pink' ? 'var(--primary)' : '#60B4FF' }}>·</span>
        </div>
      )}
    </div>
  );

  return (
    <>
    <div className="fixed inset-0 flex justify-center" style={{ zIndex: 200 }}>
    <div
      className="slide-in-right w-full flex flex-col overflow-hidden"
      style={{ background: 'var(--bg)', maxWidth: '390px' }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center gap-3 px-[18px] py-3 border-b shrink-0"
        style={{ background: 'var(--header-bg)', backdropFilter: 'blur(16px)', borderColor: 'var(--border)' }}
      >
        <button
          className="w-9 h-9 rounded-[11px] flex items-center justify-center text-[17px] font-semibold border shrink-0"
          style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text-sub)' }}
          onClick={onBack}
        >←</button>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold truncate" style={{ color: 'var(--text)' }}>{meeting.title}</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{meeting.day}</p>
        </div>
      </div>

      {/* 대기창 본체 */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        {/* 상단 배너 */}
        <div
          className="rounded-[16px] px-3.5 py-2.5 mb-3 flex items-center justify-between gap-2"
          style={{ background: 'var(--gradient)', boxShadow: '0 3px 14px rgba(255,128,171,0.35)' }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold text-white opacity-70 mb-0.5 tracking-widest">MATCHING ROOM</p>
            <p className="text-[13px] font-extrabold text-white truncate">{meeting.title}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            {meeting.keywords.map(k => (
              <span
                key={k}
                className="text-[9px] font-bold px-1.5 py-[2px] rounded-[6px]"
                style={{ background: 'rgba(255,255,255,0.22)', color: 'white' }}
              >#{k}</span>
            ))}
          </div>
        </div>

        {/* 팀 헤더 */}
        <div className="flex items-center mb-2.5 gap-2">
          <div className="flex-1 flex items-center gap-1 rounded-[10px] px-2.5 py-1.5" style={{ background: 'var(--primary-bg)', border: '1.5px solid var(--primary-border)' }}>
            <span className="text-[13px]">🩷</span>
            <span className="text-[11px] font-extrabold" style={{ color: 'var(--primary)' }}>TEAM</span>
            <span className="text-[10px] font-bold ml-auto" style={{ color: 'var(--primary)' }}>
              {females.length}/{meeting.femaleCount}
            </span>
          </div>
          <div
            className="text-[11px] font-extrabold px-2 py-1 rounded-[8px] shrink-0"
            style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >VS</div>
          <div className="flex-1 flex items-center gap-1 rounded-[10px] px-2.5 py-1.5" style={{ background: 'rgba(100,180,255,0.1)', border: '1.5px solid rgba(100,180,255,0.3)' }}>
            <span className="text-[13px]">🩵</span>
            <span className="text-[11px] font-extrabold" style={{ color: '#60B4FF' }}>TEAM</span>
            <span className="text-[10px] font-bold ml-auto" style={{ color: '#60B4FF' }}>
              {males.length}/{meeting.maleCount}
            </span>
          </div>
        </div>

        {/* 슬롯 그리드 */}
        <div className="flex gap-2">
          {/* 여성 슬롯 컬럼 */}
          <div className="flex-1 flex flex-col gap-2">
            {femaleSlots.map((p, i) => {
              const emptyIdx = femaleSlots.filter((s, j) => j < i && !s).length;
              return p
                ? <FilledSlot key={i} p={p} delay={i * 0.15} teamColor="pink" />
                : <EmptySlot  key={i} delay={0} teamColor="pink" invited={friendInvited && emptyIdx === 0} />;
            })}
          </div>

          {/* 중앙 구분선 */}
          <div className="flex flex-col items-center justify-center shrink-0 w-5 gap-1">
            {Array.from({ length: Math.max(meeting.femaleCount, meeting.maleCount) * 2 }).map((_, i) => (
              <div key={i} className="w-[2px] rounded-full flex-1" style={{ background: 'var(--border)', minHeight: 6 }} />
            ))}
          </div>

          {/* 남성 슬롯 컬럼 */}
          <div className="flex-1 flex flex-col gap-2">
            {maleSlots.map((p, i) => {
              const emptyIdx = maleSlots.filter((s, j) => j < i && !s).length;
              return p
                ? <FilledSlot key={i} p={p} delay={0.25 + i * 0.15} teamColor="blue" />
                : <EmptySlot  key={i} delay={0} teamColor="blue" invited={friendInvited && emptyIdx === 0} />;
            })}
          </div>
        </div>
      </div>

      {/* 하단 버튼 영역 */}
      <div
        className="shrink-0 px-4 pt-3 pb-8 border-t"
        style={{ background: 'var(--header-bg)', backdropFilter: 'blur(16px)', borderColor: 'var(--border)' }}
      >
        {ownerCode ? (
          /* 방장 모드: 코드 표시 */
          <>
            <p className="text-[11px] font-bold mb-2" style={{ color: 'var(--primary)' }}>
              🎉 내가 만든 방 · 친구에게 코드를 공유해보세요
            </p>
            <div className="flex items-center justify-between gap-3 rounded-[16px] px-4 py-3.5 mb-2.5 border"
              style={{ background: 'var(--primary-bg)', borderColor: 'var(--primary-border)' }}>
              <span className="text-[22px] font-extrabold tracking-[4px]"
                style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>
                {ownerCode}
              </span>
              <button
                className="text-[13px] font-bold px-4 py-2 rounded-[12px] shrink-0"
                style={{ background: 'var(--gradient)', color: 'white' }}
                onClick={() => { setShowInvite(true); }}
              >
                초대하기
              </button>
            </div>
          </>
        ) : (
          /* 일반 모드: 참여 버튼 */
          <>
            <button
              className="w-full flex items-center justify-center gap-2 text-[14px] font-bold py-[13px] rounded-[16px] mb-2.5 active:opacity-75"
              style={friendInvited
                ? { background: 'rgba(100,200,130,0.12)', color: '#4CAF50', border: '1.5px solid rgba(100,200,130,0.4)' }
                : { background: 'var(--bg-card2)', color: 'var(--text-sub)', border: '1.5px solid var(--border)' }
              }
              onClick={() => { setShowInvite(true); setFriendInvited(true); }}
            >
              <span className="text-[16px]">{friendInvited ? '✓' : '👫'}</span>
              {friendInvited ? '친구 초대 완료 · 자리 예약됨' : '친구 초대하기'}
            </button>
            <button
              className="w-full text-[16px] font-extrabold py-[16px] rounded-[18px] min-h-[56px] active:opacity-80"
              style={{
                background: hasChance ? 'var(--gradient)' : 'var(--bg-card2)',
                color: hasChance ? 'white' : 'var(--text-muted)',
                cursor: hasChance ? 'pointer' : 'not-allowed',
                boxShadow: hasChance ? '0 4px 18px rgba(255,128,171,0.4)' : 'none',
                letterSpacing: '0.3px',
              }}
              disabled={!hasChance}
              onClick={onUse}
            >
              {hasChance ? '⚡ 기회 사용하고 참여하기' : '오늘의 기회를 이미 사용했어요'}
            </button>
            {hasChance && (
              <p className="text-center text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
                하루에 하나의 미팅에만 참여할 수 있어요
              </p>
            )}
          </>
        )}
      </div>
    </div>
    </div>

    {showInvite && (
      <InviteSheet code={codeForInvite} onClose={() => setShowInvite(false)} />
    )}
    </>
  );
}

/* ── 메인 ── */
export default function MeetingPage() {
  const [search,        setSearch]        = useState('');
  const [showCreate,    setShowCreate]    = useState(false);
  const [chanceRoom,    setChanceRoom]    = useState<Meeting | null>(null);
  const [showChanceModal, setShowChanceModal] = useState(false);
  const [activeRoom,    setActiveRoom]    = useState<Meeting | null>(null);
  const [activeOwnerCode, setActiveOwnerCode] = useState<string | null>(null);
  const [codeInput,     setCodeInput]     = useState('');
  const [codeError,     setCodeError]     = useState(false);
  const [myMeetings,    setMyMeetings]    = useState<Meeting[]>([]);
  const [showCreateChanceModal, setShowCreateChanceModal] = useState(false);
  const [pendingCreate, setPendingCreate] = useState<{ title: string; keywords: string[]; femaleCount: number; maleCount: number; day: string } | null>(null);
  const { spend, hasChance } = useChance();

  const allMeetings = [...myMeetings, ...MEETINGS];

  const handleCodeEnter = () => {
    const match = allMeetings.find(m => m.code === codeInput.trim().toUpperCase());
    if (match) {
      setCodeInput('');
      setChanceRoom(match);
    } else {
      setCodeError(true);
      setTimeout(() => setCodeError(false), 600);
    }
  };

  const handleCreateSubmit = (data: { title: string; keywords: string[]; femaleCount: number; maleCount: number; day: string }) => {
    if (!hasChance) return;
    setPendingCreate(data);
    setShowCreateChanceModal(true);
  };

  const confirmCreate = () => {
    if (!pendingCreate) return;
    const code = 'DT-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    // TODO: 실제 로그인 유저 프로필로 교체
    const me: Participant = { nickname: '나', emoji: '🙂', face: '-', mbti: '-', charmPoints: [], gender: 'm' };
    const newMeeting: Meeting = {
      id: Date.now(),
      code,
      title: pendingCreate.title,
      keywords: pendingCreate.keywords,
      femaleCount: pendingCreate.femaleCount,
      maleCount: pendingCreate.maleCount,
      day: pendingCreate.day,
      joined: { f: 0, m: 1 },
      participants: [me],
      isOwner: true,
    };
    spend();
    setMyMeetings(prev => [newMeeting, ...prev]);
    setPendingCreate(null);
    setShowCreateChanceModal(false);
    setShowCreate(false);
    setActiveOwnerCode(code);
    setChanceRoom(newMeeting);
  };

  if (activeRoom) return (
    <MeetingRoomView
      meeting={activeRoom}
      ownerCode={activeOwnerCode ?? undefined}
      onBack={() => { setActiveRoom(null); setActiveOwnerCode(null); }}
    />
  );

  if (chanceRoom) {
    return (
      <>
        <ChancePage
          meeting={chanceRoom}
          ownerCode={activeOwnerCode ?? undefined}
          onBack={() => { setChanceRoom(null); setActiveOwnerCode(null); }}
          onUse={() => setShowChanceModal(true)}
        />
        {showChanceModal && !activeOwnerCode && (
          <ChanceModal
            label={`"${chanceRoom.title}"\n정말 오늘의 기회를 사용하시겠습니까?`}
            onConfirm={() => {
              spend();
              const room = chanceRoom;
              setShowChanceModal(false);
              setChanceRoom(null);
              setTimeout(() => setActiveRoom(room), 50);
            }}
            onCancel={() => setShowChanceModal(false)}
          />
        )}
      </>
    );
  }

  const filtered = search.trim()
    ? allMeetings.filter(m =>
        m.title.includes(search.trim()) ||
        m.keywords.some(k => k.includes(search.trim()))
      )
    : allMeetings;

  const handleJoin = (m: Meeting) => {
    setChanceRoom(m);
  };

  return (
    <div className="px-[18px] pb-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between pt-6 pb-[18px]">
        <div>
          <h1 className="text-[clamp(20px,6vw,24px)] font-extrabold tracking-tight mb-1" style={{ color: 'var(--text)' }}>
            미팅 / 과팅 🎉
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-sub)' }}>마음 맞는 사람들과 함께해요</p>
        </div>
        {/* 개설 버튼 */}
        <button
          className="flex items-center gap-1.5 text-[13px] font-bold px-[14px] py-[10px] rounded-[14px] shrink-0 mt-1 active:opacity-75"
          style={hasChance
            ? { background: 'var(--gradient)', color: 'white', boxShadow: '0 3px 12px rgba(255,128,171,0.35)' }
            : { background: 'var(--bg-card2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
          }
          onClick={() => hasChance && setShowCreate(true)}
        >
          <span className="text-[15px]">＋</span>
          {hasChance ? '개설' : '기회 없음'}
        </button>
      </div>

      {/* 검색 */}
      <div
        className="flex items-center gap-2 rounded-[14px] px-[14px] py-[11px] mb-3 border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <span className="text-[15px] shrink-0">🔍</span>
        <input
          className="flex-1 bg-transparent text-[14px] min-w-0"
          style={{ color: 'var(--text)' }}
          placeholder="키워드로 검색 (ex. 카페, 운동)"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="text-[12px] px-1" style={{ color: 'var(--text-muted)' }} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* 방 코드 입장 */}
      <div
        className="rounded-[18px] p-3.5 mb-4 border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <p className="text-[11px] font-bold mb-2.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <span>🎮</span> 방 코드로 바로 입장
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-[12px] px-3 py-2.5 text-[15px] font-extrabold tracking-[3px] border min-w-0 uppercase"
            style={{
              background: 'var(--bg-card2)',
              color: codeError ? '#FF5252' : 'var(--primary)',
              borderColor: codeError ? '#FF5252' : 'var(--border)',
              fontFamily: 'monospace',
              animation: codeError ? 'shake 0.3s ease' : 'none',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            placeholder="DT-????"
            value={codeInput}
            maxLength={7}
            onChange={e => setCodeInput(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === 'Enter') handleCodeEnter(); }}
          />
          <button
            className="px-4 rounded-[12px] text-[13px] font-bold shrink-0 active:opacity-75"
            style={codeInput.length >= 4
              ? { background: 'var(--gradient)', color: 'white', boxShadow: '0 2px 10px rgba(255,128,171,0.35)' }
              : { background: 'var(--bg-card2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
            }
            onClick={handleCodeEnter}
          >입장</button>
        </div>
        {codeError && (
          <p className="text-[11px] mt-2" style={{ color: '#FF5252' }}>코드를 찾을 수 없어요. 다시 확인해주세요.</p>
        )}
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2.5">
          <span className="text-[48px]" style={{ animation: 'float 2.8s ease-in-out infinite' }}>🎉</span>
          <p className="text-[15px] font-bold" style={{ color: 'var(--text-sub)' }}>검색 결과가 없어요</p>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>다른 키워드로 검색하거나 미팅을 개설해보세요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((m, idx) => (
            <div
              key={m.id}
              className="slot-reel"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <MeetingCard m={m} onJoin={handleJoin} />
            </div>
          ))}
        </div>
      )}

      {/* 개설 바텀시트 */}
      {showCreate && (
        <CreateSheet
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreateSubmit}
        />
      )}

      {/* 개설 기회 사용 확인 */}
      {showCreateChanceModal && (
        <ChanceModal
          label={`미팅을 개설하면\n오늘의 기회를 사용해요`}
          onConfirm={confirmCreate}
          onCancel={() => { setShowCreateChanceModal(false); setPendingCreate(null); }}
        />
      )}
    </div>
  );
}
