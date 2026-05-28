import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useChance } from '../hooks/useChance';
import { useDebounce, useThrottle } from '../lib/hooks';
import { isLoggedIn } from '../api/client';
import { queryKeys } from '../lib/queryKeys';
import ChanceModal from '../components/ChanceModal';
import { getMeetings, createMeeting, joinMeeting, joinMeetingByCode, getMeetingParticipants } from '../api/meeting';
import { faceTypeToEmoji } from '../api/user';
import type { MeetingResponse, MeetingParticipant } from '../api/meeting';

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

/* ── 미팅 카드 (클릭 시 상세 시트 열림) ── */
function MeetingCard({ m, onOpen }: { m: MeetingResponse; onOpen: () => void }) {
  const total = m.required_male + m.required_female;
  const filledF = Math.min(m.female_count, m.required_female);
  const filledM = Math.min(m.male_count, m.required_male);
  const fFull = filledF >= m.required_female;
  const mFull = filledM >= m.required_male;
  const full = !m.is_active || m.participant_count >= total;

  return (
    <button
      className="rounded-[20px] p-4 border w-full text-left active:opacity-85"
      style={{ background: 'var(--bg-card)', borderColor: full ? 'var(--primary-border)' : 'var(--border)' }}
      onClick={onOpen}
    >
      <p className="text-[14px] font-bold leading-snug mb-2.5" style={{ color: 'var(--text)' }}>{m.title}</p>

      <div className="flex gap-1.5 flex-wrap mb-3">
        {m.keywords.map(k => (
          <span key={k} className="text-[11px] font-semibold px-[8px] py-[3px] rounded-[7px]" style={{ color: 'var(--primary)', background: 'var(--primary-bg)' }}>#{k}</span>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3 rounded-[12px] px-3 py-2.5" style={{ background: 'var(--bg-card2)' }}>
        <span className="text-[15px]">🩷</span>
        <span className="text-[13px] font-bold" style={{ color: fFull ? 'var(--primary)' : 'var(--text)' }}>{filledF}/{m.required_female}</span>
        {fFull && <span className="text-[10px] font-bold px-1.5 py-[1px] rounded-[5px]" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>FULL</span>}
        <span className="flex-1 text-center text-[12px] font-bold" style={{ color: 'var(--primary)' }}>{formatScheduledAt(m.scheduled_at)}</span>
        {mFull && <span className="text-[10px] font-bold px-1.5 py-[1px] rounded-[5px]" style={{ background: 'rgba(96,175,255,0.15)', color: '#60AFFF' }}>FULL</span>}
        <span className="text-[13px] font-bold" style={{ color: mFull ? '#60AFFF' : 'var(--text)' }}>{filledM}/{m.required_male}</span>
        <span className="text-[15px]">🩵</span>
      </div>

      <div
        className="w-full text-[14px] font-bold py-[12px] rounded-[14px] min-h-[44px] flex items-center justify-center"
        style={{
          background: full ? 'var(--bg-card2)' : m.is_joined ? 'var(--primary-bg)' : 'var(--gradient)',
          color: full ? 'var(--text-muted)' : m.is_joined ? 'var(--primary)' : 'white',
          boxShadow: (!full && !m.is_joined) ? '0 3px 12px rgba(255,128,171,0.3)' : 'none',
          border: m.is_joined ? '1.5px solid var(--primary-border)' : 'none',
        }}
      >
        {full ? '🔒 마감된 미팅이에요' : m.is_joined ? '✓ 참여 중' : '자세히 보기 →'}
      </div>
    </button>
  );
}

/* ── 참여자 프로필 팝업 ── */
function ParticipantProfileModal({ p, gender, onClose }: { p: MeetingParticipant; gender: 'female' | 'male'; onClose: () => void }) {
  const isFemale = gender === 'female';
  const accent = isFemale ? '#FF80AB' : '#60AFFF';
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 520, borderRadius: '28px 28px 0 0', background: 'var(--bg-card)', padding: '12px 24px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '8px 0 4px' }} />
        <div style={{ width: 88, height: 88, borderRadius: 26, background: `${accent}15`, border: `2px solid ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
          {faceTypeToEmoji(p.face_type)}
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px' }}>{p.nickname}</p>
          {p.mbti && <p style={{ fontSize: 13, color: accent, fontWeight: 700, marginTop: 4 }}>{p.mbti}</p>}
        </div>
        {p.charm_points && p.charm_points.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
            {p.charm_points.map(cp => (
              <span key={cp} style={{ fontSize: 12, color: 'var(--text-sub)', background: 'var(--bg-card2)', padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', fontWeight: 600 }}>#{cp}</span>
            ))}
          </div>
        )}
        <button onClick={onClose} style={{ marginTop: 4, width: '100%', padding: '15px', borderRadius: 16, fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>닫기</button>
      </div>
    </div>
  );
}

/* ── 참여자 슬롯 ── */
function ParticipantCard({ p, gender, delay, onTap }: { p: MeetingParticipant | null; gender: 'female' | 'male'; delay: number; onTap?: () => void }) {
  const isFemale = gender === 'female';
  const accent = isFemale ? '#FF80AB' : '#60AFFF';

  if (!p) {
    return (
      <div style={{
        borderRadius: 14, height: 80,
        background: 'var(--bg-card2)', border: `1.5px dashed var(--border)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}>
        <span style={{ fontSize: 18, opacity: 0.15 }}>{isFemale ? '🩷' : '🩵'}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.3px' }}>WAITING</span>
      </div>
    );
  }

  const isAnon = p.user_id < 0;

  return (
    <button
      onClick={!isAnon ? onTap : undefined}
      style={{
        borderRadius: 14, padding: '10px 8px', width: '100%',
        background: `${accent}10`,
        border: `1.5px solid ${accent}30`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        cursor: isAnon ? 'default' : 'pointer',
        transition: 'opacity 0.15s',
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 11, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
        {isAnon ? (isFemale ? '🙍‍♀️' : '🙍‍♂️') : faceTypeToEmoji(p.face_type)}
      </div>
      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {isAnon ? '···' : p.nickname}
      </span>
      {!isAnon && p.mbti && (
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: `${accent}20`, color: accent, letterSpacing: '0.3px' }}>{p.mbti}</span>
      )}
    </button>
  );
}

/* ── 미팅 상세 시트 ── */
function MeetingDetailSheet({ m, onClose, onJoin, hasChance, chanceLoading }: {
  m: MeetingResponse;
  onClose: () => void;
  onJoin: (m: MeetingResponse) => void;
  hasChance: boolean;
  chanceLoading: boolean;
}) {
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [selectedP, setSelectedP] = useState<{ p: MeetingParticipant; gender: 'female' | 'male' } | null>(null);

  useEffect(() => {
    getMeetingParticipants(m.id).then(setParticipants).catch(() => {});
  }, [m.id]);

  const total  = m.required_male + m.required_female;
  const filledF = Math.min(m.female_count, m.required_female);
  const filledM = Math.min(m.male_count, m.required_male);
  const fFull  = filledF >= m.required_female;
  const mFull  = filledM >= m.required_male;
  const full   = !m.is_active || m.participant_count >= total;

  const femaleFromAPI = participants.filter(p => p.gender === 'female' || p.gender === '여성');
  const maleFromAPI   = participants.filter(p => p.gender === 'male'   || p.gender === '남성');

  const femaleSlots: (MeetingParticipant | null)[] = Array.from({ length: m.required_female }, (_, i) => {
    if (femaleFromAPI[i]) return femaleFromAPI[i];
    if (i < filledF) return { user_id: -(i + 1), nickname: '참여중', gender: 'female', face_type: null, mbti: null, charm_points: null };
    return null;
  });
  const maleSlots: (MeetingParticipant | null)[] = Array.from({ length: m.required_male }, (_, i) => {
    if (maleFromAPI[i]) return maleFromAPI[i];
    if (i < filledM) return { user_id: -(i + 1), nickname: '참여중', gender: 'male', face_type: null, mbti: null, charm_points: null };
    return null;
  });

  const handleInvite = () => {
    const text = m.invite_code ? `미팅 초대코드: ${m.invite_code}` : `[DashTag] "${m.title}" 미팅에 같이 참여해요!`;
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      animation: 'slideInFromRight 0.3s cubic-bezier(0.22,1,0.36,1)',
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 18px',
        background: 'var(--header-bg)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--bg-card2)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: 'var(--text-sub)', flexShrink: 0,
        }}>‹</button>
        {selectedP && <ParticipantProfileModal p={selectedP.p} gender={selectedP.gender} onClose={() => setSelectedP(null)} />}
        <p style={{ flex: 1, fontSize: 15, fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</p>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 11px', borderRadius: 20, background: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid var(--primary-border)', flexShrink: 0 }}>
          {formatScheduledAt(m.scheduled_at)}
        </span>
      </div>

      {/* 스크롤 콘텐츠 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 140px', scrollbarWidth: 'none' }}>

        {/* 키워드 */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {m.keywords.map(k => (
            <span key={k} style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', padding: '4px 10px', borderRadius: 20 }}>#{k}</span>
          ))}
        </div>

        {/* 팀 카드 */}
        <div style={{
          borderRadius: 20, overflow: 'hidden',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}>
          {/* 팀 헤더 행 */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            <div style={{ flex: 1, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>🩷</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: fFull ? 'var(--primary)' : 'var(--text-sub)' }}>여성 팀</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginLeft: 'auto' }}>{filledF}/{m.required_female}</span>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div style={{ flex: 1, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>🩵</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: mFull ? '#60AFFF' : 'var(--text-sub)' }}>남성 팀</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginLeft: 'auto' }}>{filledM}/{m.required_male}</span>
            </div>
          </div>

          {/* 참여자 그리드 */}
          <div style={{ display: 'flex', gap: 8, padding: '12px 12px 14px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {femaleSlots.map((p, i) => (
                <ParticipantCard key={i} p={p} gender="female" delay={i * 0.12} onTap={p && p.user_id > 0 ? () => setSelectedP({ p, gender: 'female' }) : undefined} />
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {maleSlots.map((p, i) => (
                <ParticipantCard key={i} p={p} gender="male" delay={i * 0.12 + 0.08} onTap={p && p.user_id > 0 ? () => setSelectedP({ p, gender: 'male' }) : undefined} />
              ))}
            </div>
          </div>

          {/* 진행바 */}
          <div style={{ padding: '10px 14px 14px', borderTop: '1px solid var(--border)' }}>
            <div style={{ borderRadius: 99, overflow: 'hidden', height: 4, background: 'var(--bg-card2)', marginBottom: 6 }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${Math.min(100, (m.participant_count / total) * 100)}%`,
                background: 'var(--gradient)',
                transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)',
              }} />
            </div>
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
              {m.participant_count}/{total}명 참여 중 · {full ? '마감' : '모집 중'}
            </p>
          </div>
        </div>

        {/* 초대코드 */}
        {m.is_joined && m.invite_code && (
          <div style={{ marginTop: 12, borderRadius: 16, padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>🔑 초대코드</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>친구에게 공유하세요</span>
              <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: 6, color: 'var(--primary)' }}>{m.invite_code}</span>
            </div>
          </div>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 520,
        padding: '10px 18px 40px',
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <button
          style={{ width: '100%', padding: '13px', borderRadius: 14, fontSize: 14, fontWeight: 700, color: 'var(--text-sub)', background: 'var(--bg-card2)', border: '1px solid var(--border)' }}
          onClick={handleInvite}
        >👫 친구 초대하기</button>

        {full ? (
          <button style={{ width: '100%', padding: '15px', borderRadius: 14, fontSize: 15, fontWeight: 800, color: 'var(--text-muted)', background: 'var(--bg-card2)', border: '1px solid var(--border)', cursor: 'not-allowed' }} disabled>🔒 마감된 미팅이에요</button>
        ) : m.is_joined ? (
          <button style={{ width: '100%', padding: '15px', borderRadius: 14, fontSize: 15, fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-bg)', border: '1.5px solid var(--primary-border)' }} disabled>✓ 참여 중이에요</button>
        ) : !chanceLoading && !hasChance ? (
          <button style={{ width: '100%', padding: '15px', borderRadius: 14, fontSize: 15, fontWeight: 800, color: 'var(--text-muted)', background: 'var(--bg-card2)', border: '1px solid var(--border)', cursor: 'not-allowed' }} disabled>⚡ 오늘의 기회를 이미 사용했어요</button>
        ) : (
          <button
            style={{ width: '100%', padding: '16px', borderRadius: 14, fontSize: 15, fontWeight: 800, color: 'white', background: 'var(--gradient)', boxShadow: '0 4px 16px rgba(255,128,171,0.35)', opacity: chanceLoading ? 0.7 : 1 }}
            disabled={chanceLoading}
            onClick={() => onJoin(m)}
          >{chanceLoading ? '확인 중...' : '⚡ 기회 사용하고 참여하기'}</button>
        )}
      </div>
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
      <button className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[18px] font-bold border" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)' }} onClick={() => set(c => Math.max(2, c - 1))}>−</button>
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
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [pendingJoin, setPendingJoin] = useState<MeetingResponse | null>(null);
  const [pendingCreate, setPendingCreate] = useState<{ title: string; keywords: string[]; femaleCount: number; maleCount: number; dayOffset: number } | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingResponse | null>(null);
  const { spend, hasChance, chanceLoading } = useChance();

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: queryKeys.meetings,
    queryFn: getMeetings,
    enabled: isLoggedIn(),
    staleTime: 60 * 1000,
  });

  const { mutateAsync: doJoinMeeting } = useMutation({
    mutationFn: joinMeeting,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.meetings }),
  });

  const { mutateAsync: doJoinByCode } = useMutation({
    mutationFn: joinMeetingByCode,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.meetings }),
  });

  const { mutateAsync: doCreateMeeting } = useMutation({
    mutationFn: createMeeting,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.meetings }),
  });

  const debouncedSetSearch = useDebounce((v: string) => setSearch(v), 300);

  const handleJoin = (m: MeetingResponse) => {
    setPendingJoin(m);
    setShowJoinModal(true);
  };

  const confirmJoin = useThrottle(async () => {
    if (!pendingJoin) return;
    try {
      const updated = await doJoinMeeting(pendingJoin.id);
      setSelectedMeeting(updated);
      spend();
    } catch { /* ignore */ }
    setShowJoinModal(false);
    setPendingJoin(null);
  }, 2000);

  const handleCreateSubmit = (data: { title: string; keywords: string[]; femaleCount: number; maleCount: number; dayOffset: number }) => {
    setPendingCreate(data);
    setShowCreateModal(true);
    setShowCreate(false);
  };

  const handleJoinByCode = useThrottle(async () => {
    const code = codeInput.trim();
    if (!code) return;
    try { await doJoinByCode(code); } catch { /* ignore */ }
    setShowCodeModal(false);
    setCodeInput('');
  }, 2000);

  const confirmCreate = useThrottle(async () => {
    if (!pendingCreate) return;
    try {
      await doCreateMeeting({
        title: pendingCreate.title,
        keywords: pendingCreate.keywords,
        required_female: pendingCreate.femaleCount,
        required_male: pendingCreate.maleCount,
        scheduled_at: dayToISO(pendingCreate.dayOffset),
      });
      spend();
    } catch { /* ignore */ }
    setShowCreateModal(false);
    setPendingCreate(null);
  }, 2000);

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
        <div className="flex gap-2 mt-1">
          <button
            className="flex items-center gap-1 text-[13px] font-bold px-3 py-[10px] rounded-[14px] shrink-0 active:opacity-75 border"
            style={{ background: 'var(--bg-card2)', color: 'var(--text-sub)', borderColor: 'var(--border)' }}
            onClick={() => setShowCodeModal(true)}
          >
            🔑 코드입장
          </button>
          <button
            className="flex items-center gap-1.5 text-[13px] font-bold px-[14px] py-[10px] rounded-[14px] shrink-0 active:opacity-75"
            style={(!chanceLoading && hasChance)
              ? { background: 'var(--gradient)', color: 'white', boxShadow: '0 3px 12px rgba(255,128,171,0.35)' }
              : { background: 'var(--bg-card2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
            }
            onClick={() => hasChance && setShowCreate(true)}
          >
            <span className="text-[15px]">＋</span>
            {chanceLoading ? '...' : hasChance ? '개설' : '기회 없음'}
          </button>
        </div>
      </div>

      {/* 검색 */}
      <div className="flex items-center gap-2 rounded-[14px] px-[14px] py-[11px] mb-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <span className="text-[15px] shrink-0">🔍</span>
        <input className="flex-1 bg-transparent text-[14px] min-w-0" style={{ color: 'var(--text)' }} placeholder="키워드로 검색 (ex. 카페, 운동)" value={searchInput} onChange={e => { setSearchInput(e.target.value); debouncedSetSearch(e.target.value); }} />
        {search && <button className="text-[12px] px-1" style={{ color: 'var(--text-muted)' }} onClick={() => setSearch('')}>✕</button>}
      </div>

      {/* 목록 */}
      {meetingsLoading ? (
        <div className="flex flex-col items-center py-16 gap-2.5">
          <span className="text-[48px]">🎉</span>
          <p className="text-[15px] font-bold" style={{ color: 'var(--text-sub)' }}>불러오는 중이에요...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2.5">
          <span className="text-[48px]" style={{ animation: 'float 2.8s ease-in-out infinite' }}>🎉</span>
          <p className="text-[15px] font-bold" style={{ color: 'var(--text-sub)' }}>{search ? '검색 결과가 없어요' : '아직 미팅이 없어요'}</p>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>미팅을 개설하거나 다른 키워드로 검색해보세요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((m, idx) => (
            <div key={m.id} className="slot-reel" style={{ animationDelay: `${idx * 0.1}s` }}>
              <MeetingCard m={m} onOpen={() => setSelectedMeeting(m)} />
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateSheet onClose={() => setShowCreate(false)} onSubmit={handleCreateSubmit} />
      )}

      {selectedMeeting && (
        <MeetingDetailSheet
          m={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          onJoin={handleJoin}
          hasChance={hasChance}
          chanceLoading={chanceLoading}
        />
      )}

      {showCodeModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-5" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }} onClick={() => { setShowCodeModal(false); setCodeInput(''); }}>
          <div className="w-full max-w-[340px] rounded-[24px] p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <p className="text-[17px] font-extrabold mb-1.5" style={{ color: 'var(--text)' }}>🔑 코드로 입장하기</p>
            <p className="text-[13px] mb-5" style={{ color: 'var(--text-muted)' }}>친구에게 받은 초대코드를 입력하세요</p>
            <input
              className="w-full rounded-[14px] px-4 py-3 text-[16px] font-bold text-center tracking-widest border mb-4"
              style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              placeholder="초대코드 입력"
              value={codeInput}
              onChange={e => setCodeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoinByCode()}
            />
            <div className="flex gap-2">
              <button className="flex-1 py-3 rounded-[14px] text-[14px] font-bold border" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)', borderColor: 'var(--border)' }} onClick={() => { setShowCodeModal(false); setCodeInput(''); }}>취소</button>
              <button className="flex-1 py-3 rounded-[14px] text-[14px] font-bold text-white" style={{ background: codeInput.trim() ? 'var(--gradient)' : 'var(--bg-card2)', color: codeInput.trim() ? 'white' : 'var(--text-muted)' }} disabled={!codeInput.trim()} onClick={handleJoinByCode}>입장하기</button>
            </div>
          </div>
        </div>
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
