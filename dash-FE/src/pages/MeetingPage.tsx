import { useState } from 'react';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

function getWeekDays() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      label: `${d.getMonth() + 1}/${d.getDate()}(${DAYS[d.getDay()]})`,
      short: i === 0 ? '오늘' : DAYS[d.getDay()],
    };
  });
}

interface Meeting {
  id: number;
  type: 'select' | 'random';
  keywords: string[];
  femaleCount: number;
  maleCount: number;
  day: string;
  joined: { f: number; m: number };
}

const MEETINGS: Meeting[] = [
  { id: 1, type: 'select', keywords: ['카페', '조용한'], femaleCount: 2, maleCount: 2, day: '4/20(일)', joined: { f: 1, m: 2 } },
  { id: 2, type: 'select', keywords: ['운동', '활발한'], femaleCount: 3, maleCount: 3, day: '4/22(화)', joined: { f: 2, m: 1 } },
  { id: 3, type: 'random', keywords: ['맛집', '유쾌한'], femaleCount: 2, maleCount: 2, day: '4/23(수)', joined: { f: 0, m: 1 } },
  { id: 4, type: 'random', keywords: ['영화', '취미'], femaleCount: 3, maleCount: 3, day: '4/25(금)', joined: { f: 2, m: 2 } },
];

const KEYWORDS = ['카페', '운동', '맛집', '영화', '게임', '취미', '조용한', '활발한', '유쾌한', '감성적'];

type Tab = 'select' | 'random';

/* ── 공통 칩 ── */
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      className="text-[13px] font-semibold px-[14px] py-2 rounded-[20px] whitespace-nowrap shrink-0 min-h-[36px]"
      style={active
        ? { background: 'var(--gradient)', color: 'white', fontWeight: 700 }
        : { background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text-sub)' }
      }
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/* ── 미팅 카드 ── */
function MeetingCard({ m }: { m: Meeting }) {
  return (
    <div className="rounded-[20px] p-4 border active:border-[var(--primary-border)]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex gap-1.5 flex-wrap mb-3.5">
        {m.keywords.map(k => (
          <span key={k} className="text-[12px] font-semibold px-[9px] py-[3px] rounded-[8px]" style={{ color: 'var(--primary)', background: 'var(--primary-bg)' }}>
            #{k}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2.5">
        {/* 여 */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[22px]">👩</span>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>여</span>
          <span className="text-[20px] font-extrabold" style={{ color: 'var(--text)' }}>
            {m.joined.f}<span className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>/{m.femaleCount}</span>
          </span>
        </div>
        {/* 가운데 */}
        <div className="flex-[1.2] flex flex-col items-center gap-2.5">
          <div className="rounded-[12px] px-3.5 py-2 text-[13px] font-bold text-center whitespace-nowrap border" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)' }}>
            {m.day}
          </div>
          <button className="text-[13px] font-bold px-[22px] py-[9px] rounded-[12px] min-h-[38px] text-white active:opacity-80" style={{ background: 'var(--gradient)' }}>
            참여
          </button>
        </div>
        {/* 남 */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[22px]">👨</span>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>남</span>
          <span className="text-[20px] font-extrabold" style={{ color: 'var(--text)' }}>
            {m.joined.m}<span className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>/{m.maleCount}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── 개설 폼 ── */
function CreateForm({ onClose }: { onClose: () => void }) {
  const weekDays = getWeekDays();
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [femaleCount, setFemaleCount] = useState(2);
  const [maleCount, setMaleCount] = useState(2);
  const [selectedDay, setSelectedDay] = useState(0);

  const toggleKeyword = (k: string) => {
    setSelectedKeywords(prev =>
      prev.includes(k) ? prev.filter(x => x !== k) : prev.length < 3 ? [...prev, k] : prev
    );
  };

  return (
    <div className="rounded-[20px] p-[18px] border mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--primary-border)' }}>
      <div className="flex justify-between items-center mb-[18px]">
        <span className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>미팅 개설하기</span>
        <button className="w-7 h-7 rounded-full flex items-center justify-center text-[13px]" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }} onClick={onClose}>✕</button>
      </div>

      {/* 인원 */}
      <div className="flex items-center gap-3 mb-5">
        {[
          { label: '👩 여', count: femaleCount, set: setFemaleCount },
          { label: '남 👨', count: maleCount, set: setMaleCount },
        ].map((side, i) => (
          <>
            {i === 1 && <span className="text-[12px] font-extrabold" style={{ color: 'var(--text-muted)' }}>VS</span>}
            <div key={side.label} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{side.label}</span>
              <div className="flex items-center gap-3.5">
                <button className="w-[30px] h-[30px] rounded-[8px] text-[16px] font-bold flex items-center justify-center" style={{ background: 'var(--bg-card2)', color: 'var(--text)' }} onClick={() => side.set(c => Math.max(1, c - 1))}>−</button>
                <span className="text-[18px] font-bold min-w-[20px] text-center" style={{ color: 'var(--text)' }}>{side.count}</span>
                <button className="w-[30px] h-[30px] rounded-[8px] text-[16px] font-bold flex items-center justify-center" style={{ background: 'var(--bg-card2)', color: 'var(--text)' }} onClick={() => side.set(c => Math.min(5, c + 1))}>+</button>
              </div>
            </div>
          </>
        ))}
      </div>

      {/* 요일 */}
      <p className="text-[13px] font-bold mb-2.5" style={{ color: 'var(--text-sub)' }}>원하는 요일</p>
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-[18px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {weekDays.map((d, i) => (
          <button
            key={i}
            className="flex flex-col items-center gap-[2px] rounded-[12px] px-[10px] py-2 min-w-[52px] shrink-0 border"
            style={selectedDay === i
              ? { background: 'var(--gradient)', borderColor: 'transparent', color: 'white' }
              : { background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text-sub)' }
            }
            onClick={() => setSelectedDay(i)}
          >
            <span className="text-[13px] font-bold">{d.short}</span>
            <span className="text-[9px] opacity-70">{d.label}</span>
          </button>
        ))}
      </div>

      {/* 키워드 */}
      <p className="text-[13px] font-bold mb-2.5" style={{ color: 'var(--text-sub)' }}>
        키워드 <span className="text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>(최대 3개)</span>
      </p>
      <div className="flex flex-wrap gap-[7px] mb-[18px]">
        {KEYWORDS.map(k => (
          <button
            key={k}
            className="text-[13px] font-medium px-[13px] py-[7px] rounded-[20px] border"
            style={selectedKeywords.includes(k)
              ? { background: 'var(--primary-bg)', borderColor: 'var(--primary-border)', color: 'var(--primary)', fontWeight: 700 }
              : { background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text-sub)' }
            }
            onClick={() => toggleKeyword(k)}
          >
            {k}
          </button>
        ))}
      </div>

      <button className="w-full text-[14px] font-bold py-[14px] rounded-[14px] min-h-[48px] text-white active:opacity-80" style={{ background: 'var(--gradient)' }} onClick={onClose}>
        개설하기
      </button>
    </div>
  );
}

/* ── 메인 ── */
export default function MeetingPage() {
  const [tab, setTab] = useState<Tab>('select');
  const [showCreate, setShowCreate] = useState(false);

  const visibleMeetings = MEETINGS.filter(m => m.type === tab);

  return (
    <div className="px-[18px] pb-6">
      {/* 헤더 */}
      <div className="pt-6 pb-[18px]">
        <h1 className="text-[clamp(20px,6vw,24px)] font-extrabold tracking-tight mb-1" style={{ color: 'var(--text)' }}>미팅 / 과팅 🎉</h1>
        <p className="text-[13px]" style={{ color: 'var(--text-sub)' }}>마음 맞는 사람들과 함께해요</p>
      </div>

      {/* 탭 */}
      <div className="flex rounded-[14px] p-1 gap-0.5 mb-4" style={{ background: 'var(--bg-card2)' }}>
        {(['select', 'random'] as Tab[]).map(t => (
          <button
            key={t}
            className="flex-1 text-[13px] font-semibold py-[9px] px-1.5 rounded-[11px]"
            style={tab === t
              ? { background: 'var(--bg-card)', color: 'var(--primary)', boxShadow: '0 1px 6px var(--shadow)' }
              : { background: 'transparent', color: 'var(--text-sub)' }
            }
            onClick={() => setTab(t)}
          >
            {t === 'select' ? '원하는 사람끼리' : '랜덤'}
          </button>
        ))}
      </div>

      {/* 개설 버튼 */}
      {!showCreate && (
        <button
          className="w-full text-[14px] font-bold py-[14px] rounded-[16px] min-h-[48px] mb-4 border border-dashed active:opacity-75"
          style={{ background: 'var(--gradient-soft)', borderColor: 'var(--primary-border)', color: 'var(--primary-light)' }}
          onClick={() => setShowCreate(true)}
        >
          + 미팅 개설하기
        </button>
      )}

      {showCreate && <CreateForm onClose={() => setShowCreate(false)} />}

      <div className="flex flex-col gap-3">
        {visibleMeetings.map(m => <MeetingCard key={m.id} m={m} />)}
      </div>
    </div>
  );
}
