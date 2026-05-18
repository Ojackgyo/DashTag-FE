import { useState, useEffect } from 'react';
import { useChance } from '../hooks/useChance';
import ChanceModal from '../components/ChanceModal';
import { getMeetings, createMeeting, joinMeeting } from '../api/meeting';
import type { MeetingResponse } from '../api/meeting';

const DAYS_KR = ['일', '월', '화', '수', '목', '금', '토'];

function getWeekDays() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      day: DAYS_KR[d.getDay()],
      short: i === 0 ? '오늘' : i === 1 ? '내일' : DAYS_KR[d.getDay()],
      dateObj: d,
    };
  });
}

function formatScheduledAt(iso?: string | null): string {
  if (!iso) return '날짜 미정';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}(${DAYS_KR[d.getDay()]})`;
}

function dayToISO(dayOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(18, 0, 0, 0);
  return d.toISOString();
}

/* ── 세로 배터리 컴포넌트 ── */
function Battery({ filled, total }: { filled: number; total: number }) {
  const isFull = filled >= total;
  const cellH = Math.min(20, Math.floor(80 / total));

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div style={{
        width: 10, height: 4, borderRadius: '3px 3px 0 0', marginBottom: -1,
        background: isFull ? 'var(--primary)' : 'var(--border)', transition: 'background 0.3s',
      }} />
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '2px', padding: '3px',
        border: `2px solid ${isFull ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: '7px', background: 'var(--bg-card2)',
        boxShadow: isFull ? '0 0 10px rgba(255,128,171,0.45)' : 'none',
        transition: 'box-shadow 0.3s, border-color 0.3s',
      }}>
        {Array.from({ length: total }, (_, i) => {
          const cellIndex = total - 1 - i;
          const active = cellIndex < filled;
          return (
            <div key={i} style={{
              width: 22, height: cellH, borderRadius: 4,
              transition: 'background 0.35s, box-shadow 0.35s',
              background: active ? (isFull ? '#FF80AB' : '#FFB3CC') : 'var(--bg-card)',
              boxShadow: active && isFull ? '0 0 5px rgba(255,128,171,0.7)' : 'none',
            }} />
          );
        })}
      </div>
    </div>
  );
}

/* ── 미팅 카드 ── */
function MeetingCard({ m, onJoin }: { m: MeetingResponse; onJoin: (m: MeetingResponse) => void }) {
  const total = m.required_male + m.required_female;
  const filledF = Math.min(Math.ceil(m.participant_count / 2), m.required_female);
  const filledM = Math.min(m.participant_count - filledF, m.required_male);
  const fFull = filledF >= m.required_female;
  const mFull = filledM >= m.required_male;
  const full = !m.is_active || m.participant_count >= total;

  return (
    <div
      className="rounded-[20px] p-4 border"
      style={{ background: 'var(--bg-card)', borderColor: full ? 'var(--primary-border)' : 'var(--border)' }}
    >
      <p className="text-[14px] font-bold leading-snug mb-2.5" style={{ color: 'var(--text)' }}>{m.title}</p>

      <div className="flex gap-1.5 flex-wrap mb-3">
        {m.keywords.map(k => (
          <span key={k} className="text-[11px] font-semibold px-[8px] py-[3px] rounded-[7px]" style={{ color: 'var(--primary)', background: 'var(--primary-bg)' }}>#{k}</span>
        ))}
      </div>

      <div className="flex items-center justify-around mb-3">
        <div className="flex flex-col items-center gap-2">
          <span style={{ fontSize: 28 }}>🩷</span>
          <Battery filled={filledF} total={m.required_female} />
          <div className="flex flex-col items-center gap-[2px]">
            <span className="text-[22px] font-extrabold" style={{ color: fFull ? 'var(--primary)' : 'var(--text)', lineHeight: 1 }}>
              {filledF}<span className="text-[14px] font-semibold" style={{ color: 'var(--text-muted)' }}>/{m.required_female}</span>
            </span>
            {fFull && <span className="text-[10px] font-bold px-1.5 py-[1px] rounded-[5px]" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>FULL</span>}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[15px] font-extrabold px-3 py-1 rounded-[10px]" style={{ background: 'var(--gradient)', color: 'white' }}>
            {formatScheduledAt(m.scheduled_at)}
          </span>
          <span className="text-[12px] font-bold" style={{ color: 'var(--text-muted)' }}>VS</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span style={{ fontSize: 28 }}>🩵</span>
          <Battery filled={filledM} total={m.required_male} />
          <div className="flex flex-col items-center gap-[2px]">
            <span className="text-[22px] font-extrabold" style={{ color: mFull ? 'var(--primary)' : 'var(--text)', lineHeight: 1 }}>
              {filledM}<span className="text-[14px] font-semibold" style={{ color: 'var(--text-muted)' }}>/{m.required_male}</span>
            </span>
            {mFull && <span className="text-[10px] font-bold px-1.5 py-[1px] rounded-[5px]" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>FULL</span>}
          </div>
        </div>
      </div>

      <button
        className="w-full text-[14px] font-bold py-[12px] rounded-[14px] min-h-[44px] active:opacity-80"
        style={{
          background: full ? 'var(--bg-card2)' : m.is_joined ? 'var(--primary-bg)' : 'var(--gradient)',
          color: full ? 'var(--text-muted)' : m.is_joined ? 'var(--primary)' : 'white',
          cursor: full ? 'not-allowed' : 'pointer',
          boxShadow: (!full && !m.is_joined) ? '0 3px 12px rgba(255,128,171,0.3)' : 'none',
          border: m.is_joined ? '1.5px solid var(--primary-border)' : 'none',
        }}
        disabled={full}
        onClick={() => !full && !m.is_joined && onJoin(m)}
      >
        {full ? '🔒 마감된 미팅이에요' : m.is_joined ? '✓ 참여 중' : '참여하기'}
      </button>
    </div>
  );
}

/* ── 개설 폼 (바텀시트) ── */
function CreateSheet({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (data: { title: string; keywords: string[]; femaleCount: number; maleCount: number; dayOffset: number }) => void;
}) {
  const weekDays = getWeekDays();
  const [title, setTitle] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [femaleCount, setFemaleCount] = useState(2);
  const [maleCount, setMaleCount] = useState(2);
  const [selectedDay, setSelectedDay] = useState(0);

  const addKeyword = () => {
    const k = keywordInput.trim();
    if (!k || keywords.includes(k) || keywords.length >= 3) return;
    setKeywords(prev => [...prev, k]);
    setKeywordInput('');
  };
  const removeKeyword = (k: string) => setKeywords(prev => prev.filter(x => x !== k));

  const Counter = ({ count, set }: { count: number; set: React.Dispatch<React.SetStateAction<number>> }) => (
    <div className="flex items-center gap-3">
      <button className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[18px] font-bold border" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)' }} onClick={() => set(c => Math.max(1, c - 1))}>−</button>
      <span className="text-[20px] font-extrabold min-w-[24px] text-center" style={{ color: 'var(--text)' }}>{count}</span>
      <button className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[18px] font-bold border" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)' }} onClick={() => set(c => Math.min(5, c + 1))}>+</button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-[390px] rounded-[28px_28px_0_0] px-5 pt-6 pb-10 overflow-y-auto max-h-[88vh] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ background: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <span className="text-[18px] font-extrabold" style={{ color: 'var(--text)' }}>🎉 미팅 개설하기</span>
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] border" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text-muted)' }} onClick={onClose}>✕</button>
        </div>

        <p className="text-[13px] font-bold mb-3" style={{ color: 'var(--text-sub)' }}>인원 구성</p>
        <div className="flex items-center justify-around rounded-[18px] py-4 px-3 mb-5 border" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)' }}>
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

        <p className="text-[13px] font-bold mb-3" style={{ color: 'var(--text-sub)' }}>날짜</p>
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {weekDays.map((d, i) => (
            <button key={i} className="flex flex-col items-center gap-[3px] rounded-[14px] px-3 py-2.5 min-w-[54px] shrink-0 border"
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

        <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-sub)' }}>미팅 제목</p>
        <input
          className="w-full rounded-[14px] px-4 py-3 text-[14px] font-medium border mb-5"
          style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)' }}
          placeholder="ex. 공대생 카페 미팅 구해요 ☕"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-sub)' }}>키워드 <span className="text-[11px] font-normal ml-1.5" style={{ color: 'var(--text-muted)' }}>최대 3개</span></p>
        <div className="flex gap-2 mb-3">
          <input
            placeholder={keywords.length >= 3 ? '최대 3개까지 입력할 수 있어요' : 'ex. 카페, 운동, 감성적…'}
            value={keywordInput}
            onChange={e => setKeywordInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); addKeyword(); } }}
            disabled={keywords.length >= 3}
            style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)', flex: 1, borderRadius: '12px', padding: '11px 16px', fontSize: '14px', border: '1px solid var(--border)', opacity: keywords.length >= 3 ? 0.45 : 1 }}
          />
          <button className="px-4 rounded-[12px] text-[13px] font-bold shrink-0"
            style={keywordInput.trim() && keywords.length < 3
              ? { background: 'var(--gradient)', color: 'white' }
              : { background: 'var(--bg-card2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
            }
            onClick={addKeyword} disabled={!keywordInput.trim() || keywords.length >= 3}
          >추가</button>
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {keywords.map(k => (
              <span key={k} className="inline-flex items-center gap-1.5 text-[13px] font-bold px-3 py-[7px] rounded-[20px]" style={{ background: 'var(--primary-bg)', border: '1.5px solid var(--primary-border)', color: 'var(--primary)' }}>
                #{k}<button className="text-[14px] opacity-60 hover:opacity-100" onClick={() => removeKeyword(k)}>×</button>
              </span>
            ))}
          </div>
        )}
        {keywords.length === 0 && <div className="mb-5" />}

        <button
          className="w-full text-[15px] font-bold py-[15px] rounded-[16px] min-h-[52px] text-white active:opacity-80"
          style={title.trim() ? { background: 'var(--gradient)', boxShadow: '0 4px 16px rgba(255,128,171,0.35)' } : { background: 'var(--bg-card2)', color: 'var(--text-muted)' }}
          disabled={!title.trim()}
          onClick={() => onSubmit({ title, keywords, femaleCount, maleCount, dayOffset: selectedDay })}
        >
          개설하기 🎉
        </button>
      </div>
    </div>
  );
}

/* ── 메인 ── */
export default function MeetingPage() {
  const [search, setSearch] = useState('');
  const [meetings, setMeetings] = useState<MeetingResponse[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingJoin, setPendingJoin] = useState<MeetingResponse | null>(null);
  const [pendingCreate, setPendingCreate] = useState<{ title: string; keywords: string[]; femaleCount: number; maleCount: number; dayOffset: number } | null>(null);
  const { spend, hasChance } = useChance();

  useEffect(() => {
    getMeetings().then(setMeetings).catch(() => {});
  }, []);

  const handleJoin = (m: MeetingResponse) => {
    setPendingJoin(m);
    setShowJoinModal(true);
  };

  const confirmJoin = async () => {
    if (!pendingJoin) return;
    try {
      const updated = await joinMeeting(pendingJoin.id);
      setMeetings(prev => prev.map(m => m.id === updated.id ? updated : m));
      spend();
    } catch { /* ignore */ }
    setShowJoinModal(false);
    setPendingJoin(null);
  };

  const handleCreateSubmit = (data: { title: string; keywords: string[]; femaleCount: number; maleCount: number; dayOffset: number }) => {
    setPendingCreate(data);
    setShowCreateModal(true);
    setShowCreate(false);
  };

  const confirmCreate = async () => {
    if (!pendingCreate) return;
    try {
      const newMeeting = await createMeeting({
        title: pendingCreate.title,
        keywords: pendingCreate.keywords,
        required_female: pendingCreate.femaleCount,
        required_male: pendingCreate.maleCount,
        scheduled_at: dayToISO(pendingCreate.dayOffset),
      });
      setMeetings(prev => [newMeeting, ...prev]);
      spend();
    } catch { /* ignore */ }
    setShowCreateModal(false);
    setPendingCreate(null);
  };

  const filtered = search.trim()
    ? meetings.filter(m => m.title.includes(search.trim()) || m.keywords.some(k => k.includes(search.trim())))
    : meetings;

  return (
    <div className="px-[18px] pb-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between pt-6 pb-[18px]">
        <div>
          <h1 className="text-[clamp(20px,6vw,24px)] font-extrabold tracking-tight mb-1" style={{ color: 'var(--text)' }}>미팅 / 과팅 🎉</h1>
          <p className="text-[13px]" style={{ color: 'var(--text-sub)' }}>마음 맞는 사람들과 함께해요</p>
        </div>
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
      <div className="flex items-center gap-2 rounded-[14px] px-[14px] py-[11px] mb-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <span className="text-[15px] shrink-0">🔍</span>
        <input className="flex-1 bg-transparent text-[14px] min-w-0" style={{ color: 'var(--text)' }} placeholder="키워드로 검색 (ex. 카페, 운동)" value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button className="text-[12px] px-1" style={{ color: 'var(--text-muted)' }} onClick={() => setSearch('')}>✕</button>}
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2.5">
          <span className="text-[48px]" style={{ animation: 'float 2.8s ease-in-out infinite' }}>🎉</span>
          <p className="text-[15px] font-bold" style={{ color: 'var(--text-sub)' }}>{search ? '검색 결과가 없어요' : '아직 미팅이 없어요'}</p>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>미팅을 개설하거나 다른 키워드로 검색해보세요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((m, idx) => (
            <div key={m.id} className="slot-reel" style={{ animationDelay: `${idx * 0.1}s` }}>
              <MeetingCard m={m} onJoin={handleJoin} />
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateSheet onClose={() => setShowCreate(false)} onSubmit={handleCreateSubmit} />
      )}

      {showJoinModal && pendingJoin && (
        <ChanceModal
          label={`"${pendingJoin.title}"\n정말 오늘의 기회를 사용하시겠습니까?`}
          onConfirm={confirmJoin}
          onCancel={() => { setShowJoinModal(false); setPendingJoin(null); }}
        />
      )}

      {showCreateModal && pendingCreate && (
        <ChanceModal
          label={`미팅을 개설하면\n오늘의 기회를 사용해요`}
          onConfirm={confirmCreate}
          onCancel={() => { setShowCreateModal(false); setPendingCreate(null); }}
        />
      )}
    </div>
  );
}
