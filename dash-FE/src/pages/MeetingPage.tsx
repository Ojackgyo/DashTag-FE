import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useChance } from '../hooks/useChance';
import { useMe } from '../hooks/useMe';
import QueryStatus from '../components/QueryStatus';
import { isLoggedIn } from '../api/client';
import { queryKeys } from '../lib/queryKeys';
import ChanceModal from '../components/ChanceModal';
import { getMeetingPage, getMeeting, createMeeting, joinMeeting, joinMeetingByCode, leaveMeeting, getMeetingParticipants } from '../api/meeting';
import { faceTypeToEmoji } from '../api/user';
import type { MeetingResponse, MeetingParticipant } from '../api/meeting';

function koreanToday() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
function scheduledInstant(iso: string) {
  return new Date(/(?:Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso}+09:00`).getTime();
}
function formatScheduledAt(iso?: string | null): string {
  if (!iso) return '날짜 미정';
  const d = new Date(scheduledInstant(iso));
  return `${new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(d)}`;
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
      <div style={{ width: '100%', maxWidth: 'var(--app-max-width)', borderRadius: '28px 28px 0 0', background: 'var(--bg-card)', padding: '12px 24px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }} onClick={e => e.stopPropagation()}>
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
function ParticipantCard({ p, gender, onTap }: { p: MeetingParticipant | null; gender: 'female' | 'male'; delay?: number; onTap?: () => void }) {
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
function MeetingDetailSheet({ id, onClose, onJoin, onChat, onLeave, busy, hasChance, chanceLoading, myGender, myId }: {
  id: number; onClose: () => void; onJoin: (m: MeetingResponse) => void;
  onChat: (id: number) => void; onLeave: (m: MeetingResponse) => void; busy: boolean;
  hasChance: boolean; chanceLoading: boolean; myGender?: string | null; myId?: number;
}) {
  const detail = useQuery({ queryKey: [...queryKeys.meetings, id], queryFn: () => getMeeting(id), refetchInterval: 15000 });
  const people = useQuery({ queryKey: [...queryKeys.meetings, id, 'participants'], queryFn: () => getMeetingParticipants(id), refetchInterval: 15000 });
  const participants = people.data ?? [];
  const [selectedP, setSelectedP] = useState<{ p: MeetingParticipant; gender: 'female' | 'male' } | null>(null);
  const m = detail.data;
  if (!m) return <div className="mobile-screen" style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)', padding: 20 }}>
    <button className="icon-button" onClick={onClose} aria-label="닫기">‹</button>
    <QueryStatus loading={detail.isLoading} error={detail.error} retry={() => { void detail.refetch(); }} />
  </div>;

  const total  = m.required_male + m.required_female;
  const filledF = Math.min(m.female_count, m.required_female);
  const filledM = Math.min(m.male_count, m.required_male);
  const fFull  = filledF >= m.required_female;
  const mFull  = filledM >= m.required_male;
  const full = !m.is_active || scheduledInstant(m.scheduled_at) <= Date.now() || m.participant_count >= total;
  const myTeamFull = myGender === 'male' ? mFull : myGender === 'female' ? fFull : true;
  const creatorCannotLeave = myId === m.creator_id && scheduledInstant(m.scheduled_at) > Date.now();

  const femaleFromAPI = participants.filter(p => p.gender === 'female' || p.gender === '여성');
  const maleFromAPI   = participants.filter(p => p.gender === 'male'   || p.gender === '남성');

  const femaleSlots: (MeetingParticipant | null)[] = Array.from({ length: m.required_female }, (_, i) => {
    if (femaleFromAPI[i]) return femaleFromAPI[i];
    if (i < filledF) return { user_id: -(i + 1), nickname: '참여중', gender: 'female', face_type: null, mbti: null, charm_points: [] };
    return null;
  });
  const maleSlots: (MeetingParticipant | null)[] = Array.from({ length: m.required_male }, (_, i) => {
    if (maleFromAPI[i]) return maleFromAPI[i];
    if (i < filledM) return { user_id: -(i + 1), nickname: '참여중', gender: 'male', face_type: null, mbti: null, charm_points: [] };
    return null;
  });

  const handleInvite = () => {
    const text = m.invite_code ? `미팅 초대코드: ${m.invite_code}` : `[DashTag] "${m.title}" 미팅에 같이 참여해요!`;
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <div className="mobile-screen" style={{
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
        <button className="icon-button" onClick={onClose} style={{
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

      <QueryStatus error={detail.error ?? people.error} retry={() => { void detail.refetch(); void people.refetch(); }} />
      {/* 스크롤 콘텐츠 */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px 24px', scrollbarWidth: 'none' }}>

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>친구에게 공유하세요</span>
              <span style={{ fontSize: 15, fontWeight: 800, overflowWrap: 'anywhere', color: 'var(--primary)' }}>{m.invite_code}</span>
            </div>
          </div>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      <div className="mobile-actions" style={{
        position: 'static',
        width: '100%', maxWidth: 'var(--app-max-width)',
        padding: '10px 18px 40px',
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {m.is_joined && m.invite_code && <button
          style={{ width: '100%', padding: 13, borderRadius: 14, fontWeight: 700, color: 'var(--text-sub)', background: 'var(--bg-card2)', border: '1px solid var(--border)' }}
          onClick={handleInvite}
        >👫 친구 초대하기</button>}
        {m.is_joined ? <>
          {m.chat_room_id != null && <button className="action-button" style={{ background: 'var(--gradient)', color: 'white', borderRadius: 14 }} onClick={() => onChat(m.chat_room_id!)}>💬 미팅 채팅방으로 이동</button>}
          <button className="action-button" disabled={busy || creatorCannotLeave} onClick={() => onLeave(m)} style={{ color: 'var(--text-muted)', borderRadius: 14, border: '1px solid var(--border)' }}>
            {creatorCannotLeave ? '개설자는 예정 시각부터 나갈 수 있어요' : '미팅 나가기'}
          </button>
        </> : <button className="action-button" style={{ width: '100%', padding: 16, borderRadius: 14, fontWeight: 800, color: 'white', background: 'var(--gradient)', opacity: full || myTeamFull || !hasChance || busy ? 0.6 : 1 }}
          disabled={full || myTeamFull || chanceLoading || !hasChance || busy} onClick={() => onJoin(m)}>
          {full ? '마감된 미팅이에요' : myTeamFull ? '내 성별의 정원이 찼어요' : chanceLoading ? '기회 확인 중…' : !hasChance ? '남은 기회가 없어요' : '⚡ 기회 1회 사용하고 참여하기'}
        </button>}

      </div>
    </div>
  );
}

type CreateForm = { title: string; femaleCount: number; maleCount: number; date: string; time: string };
const inputStyle = { width: '100%', padding: 12, borderRadius: 12, background: 'var(--bg-card2)', color: 'var(--text)', border: '1px solid var(--border)', minWidth: 0 };
function CreateSheet({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: CreateForm) => void }) {
  const [value, setValue] = useState<CreateForm>({ title: '', femaleCount: 2, maleCount: 2, date: koreanToday(), time: '18:00' });
  const [error, setError] = useState<Error | null>(null);
  return <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
    <form className="mobile-sheet w-full rounded-[28px_28px_0_0] px-5 pt-6 pb-10 overflow-y-auto max-h-[88dvh]" style={{ background: 'var(--bg-card)' }} onClick={e => e.stopPropagation()} onSubmit={e => {
      e.preventDefault();
      if (scheduledInstant(`${value.date}T${value.time}:00`) <= Date.now()) { setError(new Error('현재보다 미래인 한국 시간 일정을 선택해주세요')); return; }
      onSubmit(value);
    }}>
      <div className="flex justify-between items-center mb-5"><h2 style={{ color: 'var(--text)', fontSize: 18, fontWeight: 800 }}>🎉 미팅 개설하기</h2><button type="button" className="icon-button" onClick={onClose} aria-label="닫기">✕</button></div>
      <label style={{ color: 'var(--text)', fontWeight: 700 }}>미팅 제목<input aria-label="미팅 제목" required maxLength={100} style={{ ...inputStyle, margin: '8px 0 18px' }} placeholder="같이 카페 갈 사람 ☕" value={value.title} onChange={e => setValue(v => ({ ...v, title: e.target.value }))} /></label>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 }}>개설자를 포함한 성별 총 정원이에요.</p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        {([{ key: 'femaleCount', label: '여성 정원' }, { key: 'maleCount', label: '남성 정원' }] as const).map(f => <label key={f.key} style={{ flex: 1, minWidth: 0, color: 'var(--text)', fontWeight: 700 }}>{f.label}<select aria-label={f.label} style={{ ...inputStyle, marginTop: 8 }} value={value[f.key]} onChange={e => setValue(v => ({ ...v, [f.key]: Number(e.target.value) }))}>{[2,3,4,5].map(n => <option key={n} value={n}>{n}명</option>)}</select></label>)}
      </div>
      <label style={{ color: 'var(--text)', fontWeight: 700 }}>날짜 (한국 시간)<input aria-label="미팅 날짜" type="date" required min={koreanToday()} style={{ ...inputStyle, margin: '8px 0 18px' }} value={value.date} onChange={e => setValue(v => ({ ...v, date: e.target.value }))} /></label>
      <label style={{ color: 'var(--text)', fontWeight: 700 }}>시간 (한국 시간)<input aria-label="미팅 시간" type="time" required style={{ ...inputStyle, margin: '8px 0 18px' }} value={value.time} onChange={e => setValue(v => ({ ...v, time: e.target.value }))} /></label>
      <QueryStatus error={error} />
      <button className="action-button w-full rounded-[16px] text-white font-bold" style={{ background: 'var(--gradient)' }} disabled={!value.title.trim()}>기회 1회 사용하고 개설하기</button>
    </form>
  </div>;
}

export default function MeetingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const { hasChance, chanceLoading } = useChance();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sizeFilter, setSizeFilter] = useState(0);
  const [pending, setPending] = useState<{ kind: 'join'; meeting: MeetingResponse } | { kind: 'code'; code: string } | { kind: 'create'; data: CreateForm } | { kind: 'leave'; meeting: MeetingResponse } | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState<Error | null>(null);
  const query = useInfiniteQuery({ queryKey: queryKeys.meetings, initialPageParam: undefined as number | undefined,
    queryFn: ({ pageParam }) => getMeetingPage(pageParam),
    getNextPageParam: page => page.hasNext ? page.nextCursor ?? undefined : undefined,
    enabled: isLoggedIn(), staleTime: 15000,
  });
  const meetings = [...new Map((query.data?.pages.flatMap(p => p.items) ?? []).map(m => [m.id, m])).values()];
  const filtered = meetings.filter(m => (!sizeFilter || (m.required_male === sizeFilter && m.required_female === sizeFilter)) && m.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.meetings });
    void queryClient.invalidateQueries({ queryKey: queryKeys.chance });
    void queryClient.invalidateQueries({ queryKey: queryKeys.chatRooms });
  };
  const confirm = async () => {
    if (!pending || lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    try {
      if (pending.kind === 'create') {
        const { data } = pending;
        const created = await createMeeting({ title: data.title, required_female: data.femaleCount, required_male: data.maleCount, scheduled_at: `${data.date}T${data.time}:00` });
        setShowCreate(false); setSelectedId(created.id);
      } else if (pending.kind === 'leave') {
        await leaveMeeting(pending.meeting.id); setSelectedId(null);
      } else {
        const joined = pending.kind === 'code' ? await joinMeetingByCode(pending.code) : await joinMeeting(pending.meeting.id);
        setShowCode(false); setCodeInput(''); setSelectedId(joined.id);
      }
      refresh(); setPending(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('처리하지 못했어요. 다시 시도해주세요'));
      refresh(); setPending(null);
    } finally { lock.current = false; setBusy(false); }
  };
  const openChat = (roomId: number) => navigate('/chat', { state: { openRoom: { type: 'meeting', roomId } } });
  const reset = () => { if (!lock.current) { setPending(null); setError(null); } };
  return <div className="page-container px-[18px] pb-6">
    <div className="flex flex-wrap gap-3 items-start justify-between pt-6 pb-[18px]">
      <div><h1 className="text-[clamp(20px,6vw,24px)] font-extrabold" style={{ color: 'var(--text)' }}>미팅 / 과팅 🎉</h1><p className="text-[13px] mt-1" style={{ color: 'var(--text-sub)' }}>마음 맞는 사람들과 함께해요</p></div>
      <div className="flex gap-2">
        <button className="action-button rounded-[14px] px-3 text-[13px] font-bold" style={{ background: 'var(--bg-card2)', color: 'var(--text)' }} onClick={() => { setError(null); setShowCode(true); }}>🔑 코드입장</button>
        <button className="action-button rounded-[14px] px-3 text-[13px] font-bold" disabled={chanceLoading || !hasChance} style={{ background: 'var(--gradient)', color: 'white', opacity: hasChance ? 1 : 0.5 }} onClick={() => { setError(null); setShowCreate(true); }}>{chanceLoading ? '확인 중…' : hasChance ? '＋ 개설' : '기회 없음'}</button>
      </div>
    </div>
    <div className="flex gap-2 mb-3">{[0,2,3,4,5].map(n => <button key={n} type="button" onClick={() => setSizeFilter(n)} className="flex-1 rounded-[12px] py-2.5 text-[13px] font-bold border" style={{ color: sizeFilter === n ? 'white' : 'var(--text-sub)', background: sizeFilter === n ? 'var(--gradient)' : 'var(--bg-card)', borderColor: 'var(--border)' }}>{n ? `${n}:${n}` : '전체'}</button>)}</div>
    <input aria-label="미팅 검색" placeholder="미팅 제목으로 검색" style={{ ...inputStyle, marginBottom: 16 }} value={search} onChange={e => setSearch(e.target.value)} />
    <QueryStatus loading={query.isLoading} error={query.error ?? error} retry={() => { setError(null); void query.refetch(); }} />
    {!query.isLoading && !query.error && (filtered.length ? <div className="flex flex-col gap-3">{filtered.map(m => <MeetingCard key={m.id} m={m} onOpen={() => { setError(null); setSelectedId(m.id); }} />)}</div> : <p style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>{search || sizeFilter ? '불러온 미팅 중 검색 결과가 없어요' : '아직 미팅이 없어요. 첫 미팅을 개설해보세요!'}</p>)}
    {query.hasNextPage && <button className="action-button w-full mt-4" disabled={query.isFetchingNextPage} onClick={() => { void query.fetchNextPage(); }}>{query.isFetchingNextPage ? '불러오는 중…' : '미팅 더 보기'}</button>}
    {showCreate && <CreateSheet onClose={() => setShowCreate(false)} onSubmit={data => setPending({ kind: 'create', data })} />}
    {selectedId != null && <MeetingDetailSheet id={selectedId} onClose={() => setSelectedId(null)} onJoin={meeting => { setError(null); setPending({ kind: 'join', meeting }); }} onLeave={meeting => { setError(null); setPending({ kind: 'leave', meeting }); }} onChat={openChat} busy={busy} hasChance={hasChance} chanceLoading={chanceLoading} myGender={me?.gender} myId={me?.id} />}
    {error && (selectedId != null || showCreate || showCode) && <div role="alert" style={{ position: 'fixed', zIndex: 600, bottom: 'max(20px, env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: 398, padding: 16, borderRadius: 14, background: 'var(--bg-card)', color: 'var(--text)', boxShadow: '0 4px 24px #0005' }}>{error.message}<button aria-label="오류 닫기" onClick={() => setError(null)} style={{ float: 'right', marginLeft: 8 }}>✕</button></div>}
    {showCode && <div className="fixed inset-0 z-[200] flex items-center justify-center px-5" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={() => setShowCode(false)}><form className="w-full max-w-[340px] rounded-[24px] p-6" style={{ background: 'var(--bg-card)' }} onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); setError(null); setPending({ kind: 'code', code: codeInput }); }}>
      <h2 style={{ color: 'var(--text)', fontSize: 17, fontWeight: 800 }}>🔑 코드로 입장하기</h2><p style={{ color: 'var(--text-muted)', margin: '10px 0', fontSize: 13 }}>친구에게 받은 32자리 초대코드를 입력하세요. 참여 시 기회 1회를 사용해요.</p>
      <input aria-label="초대코드" required pattern="[0-9A-Fa-f]{32}" maxLength={32} autoCapitalize="characters" autoComplete="off" style={inputStyle} value={codeInput} onChange={e => setCodeInput(e.target.value.trim().toUpperCase())} />
      <div className="flex gap-2 mt-4"><button type="button" className="action-button flex-1" style={{ color: 'var(--text-sub)' }} onClick={() => setShowCode(false)}>취소</button><button className="action-button flex-1 rounded-[14px]" disabled={!/^[0-9A-F]{32}$/.test(codeInput) || !hasChance || chanceLoading} style={{ background: 'var(--gradient)', color: 'white' }}>{chanceLoading ? '확인 중…' : hasChance ? '입장하기' : '기회 없음'}</button></div>
    </form></div>}
    {pending && pending.kind !== 'leave' && <ChanceModal busy={busy} label={pending.kind === 'create' ? '미팅을 개설하면 기회 1회를 사용해요' : '미팅에 참여하면 기회 1회를 사용해요'} onConfirm={() => { void confirm(); }} onCancel={reset} />}
    {pending?.kind === 'leave' && <div className="fixed inset-0 z-[500] flex items-center justify-center px-6" style={{ background: '#0009' }}><div className="w-full max-w-[340px] p-6 rounded-[24px]" style={{ background: 'var(--bg-card)', color: 'var(--text)' }}><h2 className="font-bold text-[18px]">미팅에서 나갈까요?</h2><p className="text-[13px] my-4">채팅방에서도 나가게 돼요. 사용한 기회는 환급되지 않고, 재참여하면 기회를 다시 사용해요.</p><div className="flex gap-3"><button className="action-button flex-1" disabled={busy} onClick={reset}>취소</button><button className="action-button flex-1" disabled={busy} onClick={() => { void confirm(); }}>{busy ? '처리 중…' : '나가기'}</button></div></div></div>}
  </div>;
}
