import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCommunities, createCommunity, joinCommunity, getCommunityDashboard, removeCommunityMember } from '../api/community';
import { isLoggedIn } from '../api/client';
import { useMe } from '../hooks/useMe';
import { useDebounce } from '../lib/hooks';
import { queryKeys } from '../lib/queryKeys';
import type { CommunityResponse, CommunityDashboard, CommunityMemberInfo } from '../api/community';

type GenderFilter = '전체' | '남' | '여';

const TAGS = ['전체', '음악', '스포츠', '독서', '게임', '맛집', '사진', '운동', '힐링', '자기계발'];
const GENDER_FILTERS: GenderFilter[] = ['전체', '남', '여'];
const CATEGORIES = ['운동', '게임', '독서', '맛집', '음악', '사진/여행', '스터디', '동네친구', '기타'];
const EMOJI_LIST = ['🎯', '🎸', '🧗', '📚', '📸', '🎮', '🍜', '🎨', '⚽', '🏃', '🎤', '🌿'];

function genderColor(g: string): string {
  if (g === '남' || g === 'male') return '#5B8DEF';
  if (g === '여' || g === 'female') return '#FF80AB';
  return '#9E9E9E';
}

function genderLabel(g: string): string {
  if (g === '남' || g === 'male') return '남성';
  if (g === '여' || g === 'female') return '여성';
  return '혼성';
}

function genderKey(g: string): string {
  if (g === 'male') return '남';
  if (g === 'female') return '여';
  return g; // '남', '여', '혼성' already Korean
}

/* ── 호스트 대시보드 ── */
function DashboardSheet({ communityId, myUserId, onClose }: { communityId: number; myUserId: number; onClose: () => void }) {
  const [dashboard, setDashboard] = useState<CommunityDashboard | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);

  useEffect(() => {
    getCommunityDashboard(communityId).then(setDashboard).catch(() => {});
  }, [communityId]);

  const handleRemove = async (member: CommunityMemberInfo) => {
    if (removing) return;
    setRemoving(member.user_id);
    try {
      await removeCommunityMember(communityId, member.user_id);
      setDashboard(prev => prev ? { ...prev, members: prev.members.filter(m => m.user_id !== member.user_id), member_count: prev.member_count - 1 } : prev);
    } catch { /* ignore */ }
    setRemoving(null);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'var(--bg)', display: 'flex', flexDirection: 'column', animation: 'slideInFromRight 0.3s cubic-bezier(0.22,1,0.36,1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'var(--header-bg)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--text)' }}>‹</button>
        <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>호스트 대시보드</p>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', scrollbarWidth: 'none' }}>
        {!dashboard ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>불러오는 중...</p>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-around', padding: '16px', borderRadius: 18, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{dashboard.member_count}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>전체</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#FF80AB' }}>{dashboard.female_count}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>여성</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#5B8DEF' }}>{dashboard.male_count}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>남성</p>
              </div>
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 10 }}>멤버 목록</p>
            <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              {dashboard.members.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px', fontSize: 13, color: 'var(--text-muted)' }}>멤버가 없어요</p>
              ) : dashboard.members.map((m, i) => (
                <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{m.nickname}{m.user_id === myUserId ? ' (나)' : ''}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{[m.age ? `${m.age}세` : null, m.major, m.gender].filter(Boolean).join(' · ')}</p>
                  </div>
                  {m.user_id !== myUserId && (
                    <button
                      style={{ fontSize: 12, fontWeight: 700, color: '#FF6B6B', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', padding: '6px 12px', borderRadius: 10, opacity: removing === m.user_id ? 0.5 : 1 }}
                      disabled={removing === m.user_id}
                      onClick={() => handleRemove(m)}
                    >내보내기</button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── 그룹 상세 뷰 ── */
function GroupDetailView({ group, onClose, onJoin, isCreator, userId, userGender }: { group: CommunityResponse; onClose: () => void; onJoin: (id: number) => Promise<void>; isCreator: boolean; userId: number; userGender: string | null }) {
  const navigate = useNavigate();
  const [joined, setJoined] = useState(group.is_joined);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);
  const gc = genderColor(group.gender);

  // 외부에서 group.is_joined 가 바뀌면 동기화
  useEffect(() => { setJoined(group.is_joined); }, [group.is_joined]);

  const genderAllowed = (() => {
    const g = group.gender;
    if (g === '혼성') return true;
    if (!userGender) return true;
    if (g === '남' && userGender !== 'male') return false;
    if (g === '여' && userGender !== 'female') return false;
    return true;
  })();

  const handleJoin = async () => {
    if (joining || joined) return;
    setJoining(true);
    setJoinError('');
    try {
      await onJoin(group.id);
      setJoined(true);
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : '가입에 실패했어요. 다시 시도해주세요.');
    }
    setJoining(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'var(--bg)', display: 'flex', flexDirection: 'column',
      animation: 'slideInFromRight 0.3s cubic-bezier(0.22,1,0.36,1)',
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
        background: 'var(--header-bg)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--text)' }}>‹</button>
        <p style={{ flex: 1, fontSize: 16, fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.title}</p>
        {isCreator && (
          <button onClick={() => setShowDashboard(true)} style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', padding: '6px 12px', borderRadius: 10 }}>대시보드</button>
        )}
      </div>
      {showDashboard && <DashboardSheet communityId={group.id} myUserId={userId} onClose={() => setShowDashboard(false)} />}

      {/* 스크롤 콘텐츠 */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100, scrollbarWidth: 'none' }}>

        {/* 헤더 배너 */}
        <div style={{ background: 'linear-gradient(160deg, var(--primary-bg) 0%, var(--bg-card2) 100%)', padding: '28px 20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24, flexShrink: 0,
              background: 'var(--bg-card)', border: '2px solid var(--primary-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
              boxShadow: 'var(--shadow-primary)',
            }}>{group.emoji}</div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              <p style={{ fontSize: 21, fontWeight: 900, color: 'var(--text)', marginBottom: 6 }}>{group.title}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>멤버 {group.member_count}명</p>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {group.tags.map(t => (
                  <span key={t} style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', padding: '3px 9px', borderRadius: 20 }}>#{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 기본 정보 */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 14 }}>👥</span>
              <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>멤버 {group.member_count}명</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 14, color: gc }}>●</span>
              <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>{genderLabel(group.gender)}</span>
            </div>
            {!group.is_active && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 14 }}>🔒</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>모집 종료</span>
              </div>
            )}
          </div>
          {group.description && (
            <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{group.description}</p>
          )}
        </div>

        {/* 통계 */}
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card2)' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>{group.member_count}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>멤버</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 17, fontWeight: 800, color: group.is_active ? '#48c774' : 'var(--text-muted)' }}>{group.is_active ? '활성' : '종료'}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>상태</p>
          </div>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 520,
        padding: '12px 20px 36px',
        background: 'linear-gradient(to top, var(--bg) 70%, transparent)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {joinError && (
          <p style={{ fontSize: 12, color: '#FF6B6B', textAlign: 'center', marginBottom: 4 }}>{joinError}</p>
        )}
        {joined ? (
          <>
            <button
              style={{ width: '100%', padding: '14px', borderRadius: 18, fontSize: 15, fontWeight: 800, color: 'white', background: 'var(--gradient)', boxShadow: '0 5px 20px rgba(255,128,171,0.4)' }}
              onClick={() => navigate('/chat', { state: { openRoom: { type: 'community', relatedId: group.id } } })}
            >💬 채팅방으로 이동</button>
            <button style={{ width: '100%', padding: '14px', borderRadius: 18, fontSize: 15, fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-bg)', border: '2px solid var(--primary-border)' }} disabled>✓ 가입 완료</button>
          </>
        ) : !genderAllowed ? (
          <button style={{ width: '100%', padding: '16px', borderRadius: 18, fontSize: 15, fontWeight: 800, color: 'var(--text-muted)', background: 'var(--bg-card2)', cursor: 'not-allowed' }} disabled>
            {group.gender === '남' ? '👨 남성 전용 소모임이에요' : '👩 여성 전용 소모임이에요'}
          </button>
        ) : (
          <button
            style={{
              width: '100%', padding: '16px', borderRadius: 18, fontSize: 16, fontWeight: 800,
              color: group.is_active ? 'white' : 'var(--text-muted)',
              background: group.is_active ? 'var(--gradient)' : 'var(--bg-card2)',
              boxShadow: group.is_active ? '0 5px 20px rgba(255,128,171,0.45)' : 'none',
              cursor: group.is_active ? 'pointer' : 'not-allowed',
            }}
            disabled={!group.is_active || joining}
            onClick={handleJoin}
          >
            {joining ? '가입 중...' : group.is_active ? '입장하기' : '모집 종료'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── 그룹 카드 ── */
function GroupCard({ g, onOpen }: { g: CommunityResponse; onOpen: () => void }) {
  const gc = genderColor(g.gender);
  return (
    <div
      className={`rounded-[18px] p-[14px] border ${!g.is_active ? 'opacity-55' : ''}`}
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', cursor: 'pointer' }}
      onClick={onOpen}
    >
      <div className="flex gap-3 items-start">
        <div className="w-[50px] h-[50px] rounded-[14px] flex items-center justify-center text-[24px] shrink-0 relative" style={{ background: 'var(--bg-card2)' }}>
          {g.emoji}
          {!g.is_active && (
            <div className="absolute inset-0 bg-black/45 rounded-[14px] flex items-center justify-center text-[10px] font-bold text-white">종료</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-[3px]">
            <h3 className="text-[14px] font-bold flex-1 leading-snug" style={{ color: 'var(--text)' }}>{g.title}</h3>
            <span className="text-[10px] font-bold px-2 py-[2px] rounded-[7px] shrink-0 whitespace-nowrap" style={{ color: gc, background: `${gc}18` }}>
              {genderLabel(g.gender)}
            </span>
          </div>
          {g.description && (
            <p className="text-[12px] mb-2 leading-snug truncate" style={{ color: 'var(--text-sub)' }}>{g.description}</p>
          )}
          <div className="flex gap-[5px] flex-wrap mb-2.5">
            {g.tags.map(t => (
              <span key={t} className="text-[11px] px-[7px] py-[2px] rounded-[6px]" style={{ color: 'var(--text-muted)', background: 'var(--bg-card2)' }}>#{t}</span>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>👥 {g.member_count}명</span>
            {g.is_joined && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-[8px]" style={{ background: 'rgba(72,199,116,0.14)', color: '#48c774' }}>✓ 가입됨</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 생성 모달 ── */
function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: { emoji: string; title: string; description: string; tags: string[]; gender: string }) => Promise<void> }) {
  const [emoji, setEmoji] = useState('🎯');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [gender, setGender] = useState('혼성');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title.trim().length >= 2;

  const toggleTag = (t: string) => {
    setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t].slice(0, 5));
  };

  const handleCreate = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await onCreate({ emoji, title: title.trim(), description: description.trim(), tags: selectedTags, gender });
      onClose();
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/55 flex items-end justify-center z-[200]" onClick={onClose}>
      <div
        className="rounded-[28px_28px_0_0] px-5 pt-6 pb-9 w-full max-w-[520px] max-h-[92vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ background: 'var(--bg-card)', animation: 'slideUpSheet 0.35s cubic-bezier(0.22,1,0.36,1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>
        <div className="flex justify-between items-center mb-5">
          <span className="text-[17px] font-extrabold" style={{ color: 'var(--text)' }}>소모임 만들기</span>
          <button className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px]" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }} onClick={onClose}>✕</button>
        </div>

        <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-sub)' }}>이모티콘</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {EMOJI_LIST.map(e => (
            <button key={e} className="w-[42px] h-[42px] rounded-[12px] text-[20px] flex items-center justify-center border-2"
              style={emoji === e ? { background: 'var(--primary-bg)', borderColor: 'var(--primary)' } : { background: 'var(--bg-card2)', borderColor: 'transparent' }}
              onClick={() => setEmoji(e)}>{e}</button>
          ))}
        </div>

        <p className="text-[13px] font-bold mb-1" style={{ color: 'var(--text-sub)' }}>모임명 <span style={{ color: 'var(--primary)' }}>*</span></p>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input
            className="w-full rounded-[12px] px-[14px] py-3 text-[14px] border"
            style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)', paddingRight: 44 }}
            placeholder="모임명을 입력해주세요"
            value={title}
            onChange={e => setTitle(e.target.value.slice(0, 24))}
          />
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-muted)' }}>{title.length}/24</span>
        </div>

        <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-sub)' }}>태그 (최대 5개)</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map(c => (
            <button key={c} className="text-[13px] font-semibold px-[13px] py-[8px] rounded-[20px] border"
              style={selectedTags.includes(c)
                ? { background: 'var(--primary-bg)', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 700 }
                : { background: 'var(--bg-card2)', borderColor: 'transparent', color: 'var(--text-sub)' }
              }
              onClick={() => toggleTag(c)}
            >{c}</button>
          ))}
        </div>

        <p className="text-[13px] font-bold mb-1" style={{ color: 'var(--text-sub)' }}>모임 소개</p>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <textarea
            className="w-full rounded-[12px] px-[14px] py-3 text-[14px] border resize-none"
            style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)', minHeight: 100, lineHeight: 1.6 }}
            placeholder="모임 소개를 입력해주세요"
            value={description}
            onChange={e => setDescription(e.target.value.slice(0, 500))}
          />
          <span style={{ position: 'absolute', right: 12, bottom: 10, fontSize: 11, color: 'var(--text-muted)' }}>{description.length}/500</span>
        </div>

        <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-sub)' }}>성별</p>
        <div className="flex gap-2 mb-6">
          {(['혼성', '남', '여'] as const).map(g => (
            <button key={g} className="flex-1 text-[14px] font-semibold py-[11px] rounded-[12px] border-2"
              style={gender === g ? { borderColor: 'var(--primary)', background: 'var(--primary-bg)', color: 'var(--primary)' } : { borderColor: 'transparent', background: 'var(--bg-card2)', color: 'var(--text-sub)' }}
              onClick={() => setGender(g)}>{g}</button>
          ))}
        </div>

        <button
          className="w-full text-[15px] font-bold py-[15px] rounded-[16px] min-h-[52px] active:opacity-80"
          style={{
            background: canSubmit ? 'var(--gradient)' : 'var(--bg-card2)',
            color: canSubmit ? 'white' : 'var(--text-muted)',
            boxShadow: canSubmit ? '0 4px 20px rgba(255,128,171,0.35)' : 'none',
          }}
          disabled={!canSubmit || submitting}
          onClick={handleCreate}
        >
          {submitting ? '만드는 중...' : '모임 만들기'}
        </button>
      </div>
    </div>
  );
}

/* ── 메인 ── */
export default function CommunityPage() {
  const queryClient = useQueryClient();
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('전체');
  const [tagFilter, setTagFilter] = useState('전체');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<CommunityResponse | null>(null);

  const { data: me } = useMe();
  const userId   = me?.id ?? 0;
  const userGender = me?.gender ?? null;

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: queryKeys.communities,
    queryFn: getCommunities,
    enabled: isLoggedIn(),
    staleTime: 60 * 1000,
  });

  const { mutateAsync: doJoin } = useMutation({
    mutationFn: joinCommunity,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communities });
      setSelectedGroup(prev => prev?.id === result.id ? result : prev);
    },
  });

  const { mutateAsync: doCreate } = useMutation({
    mutationFn: createCommunity,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.communities }),
  });

  const debouncedSetSearch = useDebounce((v: string) => setSearch(v), 300);

  const handleCreate = async (data: { emoji: string; title: string; description: string; tags: string[]; gender: string }) => {
    await doCreate({
      emoji: data.emoji,
      title: data.title,
      description: data.description || null,
      tags: data.tags,
      gender: data.gender,
    });
  };

  const handleJoin = async (id: number) => {
    await doJoin(id);
  };

  const filtered = groups.filter(g => {
    const gk = genderKey(g.gender);
    if (genderFilter === '남' && gk !== '남') return false;
    if (genderFilter === '여' && gk !== '여') return false;
    if (tagFilter !== '전체' && !g.tags.includes(tagFilter)) return false;
    if (search && !g.title.includes(search) && !(g.description ?? '').includes(search)) return false;
    return true;
  });

  return (
    <div className="px-[18px] pb-20 relative">
      <div className="pt-6 pb-[18px]">
        <h1 className="text-[clamp(20px,6vw,24px)] font-extrabold tracking-tight mb-1" style={{ color: 'var(--text)' }}>소모임 🌟</h1>
        <p className="text-[13px]" style={{ color: 'var(--text-sub)' }}>취미로 연결되는 특별한 인연</p>
      </div>

      {/* 검색 */}
      <div className="flex items-center gap-2 rounded-[14px] px-[14px] py-[11px] mb-3 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <span className="text-[15px] shrink-0">🔍</span>
        <input className="flex-1 bg-transparent text-[14px] min-w-0" style={{ color: 'var(--text)' }} placeholder="소모임 검색" value={searchInput} onChange={e => { setSearchInput(e.target.value); debouncedSetSearch(e.target.value); }} />
        {searchInput && <button className="text-[12px] px-1" style={{ color: 'var(--text-muted)' }} onClick={() => { setSearchInput(''); setSearch(''); }}>✕</button>}
      </div>

      {/* 성별 필터 */}
      <div className="flex gap-[7px] mb-2.5">
        {GENDER_FILTERS.map(g => (
          <button key={g} className="text-[13px] font-semibold px-4 py-[7px] rounded-[20px] min-h-[34px] border"
            style={genderFilter === g ? { background: 'var(--gradient)', borderColor: 'transparent', color: 'white' } : { background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-sub)' }}
            onClick={() => setGenderFilter(g)}>{g}</button>
        ))}
      </div>

      {/* 태그 필터 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TAGS.map(t => (
          <button key={t} className="text-[12px] font-medium px-[13px] py-[7px] rounded-[20px] whitespace-nowrap min-h-[34px] border shrink-0"
            style={tagFilter === t ? { background: 'var(--primary-bg)', borderColor: 'var(--primary-border)', color: 'var(--primary)', fontWeight: 700 } : { background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-sub)' }}
            onClick={() => setTagFilter(t)}>{t}</button>
        ))}
      </div>

      {/* 목록 */}
      <div className="flex flex-col gap-2.5">
        {groupsLoading
          ? <p className="text-center py-12 text-[14px]" style={{ color: 'var(--text-muted)' }}>불러오는 중이에요...</p>
          : filtered.length === 0
            ? <p className="text-center py-12 text-[14px]" style={{ color: 'var(--text-muted)' }}>{search || genderFilter !== '전체' || tagFilter !== '전체' ? '검색 결과가 없어요' : '아직 소모임이 없어요'}</p>
            : filtered.map(g => (
              <GroupCard key={g.id} g={g} onOpen={() => setSelectedGroup(g)} />
            ))
        }
      </div>

      {/* FAB */}
      <button
        className="fixed w-[52px] h-[52px] rounded-full text-[26px] text-white flex items-center justify-center z-[100] active:scale-95"
        style={{
          bottom: 'calc(72px + 20px)',
          right: 'max(18px, calc(50vw - 195px + 18px))',
          background: 'var(--gradient)',
          boxShadow: '0 4px 16px rgba(255,128,171,0.45)',
        }}
        onClick={() => setShowCreate(true)}
      >
        +
      </button>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {selectedGroup && <GroupDetailView group={selectedGroup} onClose={() => setSelectedGroup(null)} onJoin={handleJoin} isCreator={userId === selectedGroup.creator_id} userId={userId} userGender={userGender} />}
    </div>
  );
}
