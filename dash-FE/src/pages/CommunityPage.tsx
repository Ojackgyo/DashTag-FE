import { useState } from 'react';

type Gender = '전체' | '남' | '여';

interface Group {
  id: number;
  emoji: string;
  title: string;
  subtitle: string;
  tags: string[];
  gender: '남' | '여' | '혼성';
  maxMembers: number;
  currentMembers: number;
  active: boolean;
  isMine?: boolean;
}

const GROUPS: Group[] = [
  { id: 1, emoji: '🎸', title: '홍대 버스킹 감상단', subtitle: '매주 금요일 저녁, 버스킹 같이 봐요', tags: ['음악', '감성', '홍대'], gender: '혼성', maxMembers: 8, currentMembers: 5, active: true },
  { id: 2, emoji: '🧗', title: '주말 클라이밍 크루', subtitle: '초보 환영! 같이 배워요', tags: ['스포츠', '운동', '건강'], gender: '혼성', maxMembers: 6, currentMembers: 3, active: true },
  { id: 3, emoji: '📚', title: '공대생 독서 모임', subtitle: '한 달에 한 권, 꾸준히 읽어요', tags: ['독서', '자기계발'], gender: '남', maxMembers: 5, currentMembers: 4, active: true, isMine: true },
  { id: 4, emoji: '📸', title: '한강 사진 산책', subtitle: '사진 찍으면서 산책해요 🌊', tags: ['사진', '한강', '힐링'], gender: '여', maxMembers: 6, currentMembers: 2, active: false },
  { id: 5, emoji: '🎮', title: 'VALORANT 파티원 구해요', subtitle: 'PC방에서 같이 해요', tags: ['게임', '파티', 'PC방'], gender: '남', maxMembers: 5, currentMembers: 4, active: true },
  { id: 6, emoji: '🍜', title: '신촌 맛집 탐방대', subtitle: '매주 새로운 곳을 발견해요', tags: ['맛집', '신촌', '미식'], gender: '혼성', maxMembers: 6, currentMembers: 2, active: true },
];

const TAGS = ['전체', '음악', '스포츠', '독서', '게임', '맛집', '사진', '운동', '힐링', '자기계발'];
const GENDER_FILTERS: Gender[] = ['전체', '남', '여'];

const GENDER_COLOR: Record<string, string> = { 남: '#5B8DEF', 여: '#FF80AB', 혼성: '#9E9E9E' };

/* ── 그룹 카드 ── */
function GroupCard({ g, onToggle }: { g: Group; onToggle?: () => void }) {
  const gc = GENDER_COLOR[g.gender];
  return (
    <div className={`rounded-[18px] p-[14px] border ${!g.active ? 'opacity-55' : ''}`} style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex gap-3 items-start">
        <div className="w-[50px] h-[50px] rounded-[14px] flex items-center justify-center text-[24px] shrink-0 relative" style={{ background: 'var(--bg-card2)' }}>
          {g.emoji}
          {!g.active && (
            <div className="absolute inset-0 bg-black/45 rounded-[14px] flex items-center justify-center text-[10px] font-bold text-white">종료</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-[3px]">
            <h3 className="text-[14px] font-bold flex-1 leading-snug" style={{ color: 'var(--text)' }}>{g.title}</h3>
            <span className="text-[10px] font-bold px-2 py-[2px] rounded-[7px] shrink-0 whitespace-nowrap" style={{ color: gc, background: `${gc}18` }}>
              {g.gender === '남' ? '남성' : g.gender === '여' ? '여성' : '혼성'}
            </span>
          </div>
          <p className="text-[12px] mb-2 leading-snug" style={{ color: 'var(--text-sub)' }}>{g.subtitle}</p>
          <div className="flex gap-[5px] flex-wrap mb-2.5">
            {g.tags.map(t => (
              <span key={t} className="text-[11px] px-[7px] py-[2px] rounded-[6px]" style={{ color: 'var(--text-muted)', background: 'var(--bg-card2)' }}>#{t}</span>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>👥 {g.currentMembers}/{g.maxMembers}명</span>
            {g.isMine && (
              <button
                className="text-[11px] font-bold px-2.5 py-1 rounded-[8px]"
                style={g.active
                  ? { background: 'rgba(72,199,116,0.14)', color: '#48c774' }
                  : { background: 'var(--bg-card2)', color: 'var(--text-muted)' }
                }
                onClick={e => { e.stopPropagation(); onToggle?.(); }}
              >
                {g.active ? '● 활성화' : '○ 비활성'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 생성 모달 ── */
function CreateModal({ onClose }: { onClose: () => void }) {
  const [emoji, setEmoji] = useState('🎯');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [gender, setGender] = useState<'남' | '여' | '혼성'>('혼성');

  const addTag = () => {
    const t = tagInput.trim().replace('#', '');
    if (t && !tags.includes(t) && tags.length < 4) { setTags([...tags, t]); setTagInput(''); }
  };

  const EMOJI_LIST = ['🎯', '🎸', '🧗', '📚', '📸', '🎮', '🍜', '🎨', '⚽', '🏃', '🎤', '🌿'];

  return (
    <div className="fixed inset-0 bg-black/55 flex items-end justify-center z-[200]" onClick={onClose}>
      <div
        className="rounded-[28px_28px_0_0] px-5 pt-6 pb-9 w-full max-w-[390px] max-h-[88vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ background: 'var(--bg-card)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <span className="text-[17px] font-extrabold" style={{ color: 'var(--text)' }}>소모임 만들기</span>
          <button className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px]" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }} onClick={onClose}>✕</button>
        </div>

        <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-sub)' }}>이모티콘</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {EMOJI_LIST.map(e => (
            <button key={e} className="w-[42px] h-[42px] rounded-[12px] text-[20px] flex items-center justify-center border-2" style={emoji === e ? { background: 'var(--primary-bg)', borderColor: 'var(--primary)' } : { background: 'var(--bg-card2)', borderColor: 'transparent' }} onClick={() => setEmoji(e)}>{e}</button>
          ))}
        </div>

        <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-sub)' }}>제목</p>
        <input className="w-full rounded-[12px] px-[14px] py-3 text-[14px] mb-3.5 border" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)' }} placeholder="소모임 이름을 입력하세요" value={title} onChange={e => setTitle(e.target.value)} maxLength={30} />

        <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-sub)' }}>소제목</p>
        <input className="w-full rounded-[12px] px-[14px] py-3 text-[14px] mb-3.5 border" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)' }} placeholder="한 줄 소개를 입력하세요" value={subtitle} onChange={e => setSubtitle(e.target.value)} maxLength={40} />

        <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-sub)' }}>태그 <span className="text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>(최대 4개)</span></p>
        <div className="flex gap-2 mb-2">
          <input className="flex-1 rounded-[12px] px-[14px] py-3 text-[14px] border" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)' }} placeholder="#태그" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} />
          <button className="text-[13px] font-bold px-4 rounded-[12px] border whitespace-nowrap" style={{ background: 'var(--primary-bg)', borderColor: 'var(--primary-border)', color: 'var(--primary)' }} onClick={addTag}>추가</button>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4 min-h-[12px]">
          {tags.map(t => (
            <span key={t} className="flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-[8px] border" style={{ background: 'var(--primary-bg)', borderColor: 'var(--primary-border)', color: 'var(--primary)' }}>
              #{t}
              <button className="text-[10px]" style={{ color: 'var(--primary)' }} onClick={() => setTags(tags.filter(x => x !== t))}>✕</button>
            </span>
          ))}
        </div>

        <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-sub)' }}>성별</p>
        <div className="flex gap-2 mb-5">
          {(['혼성', '남', '여'] as const).map(g => (
            <button key={g} className="flex-1 text-[14px] font-semibold py-[11px] rounded-[12px] border-2" style={gender === g ? { borderColor: 'var(--primary)', background: 'var(--primary-bg)', color: 'var(--primary)' } : { borderColor: 'transparent', background: 'var(--bg-card2)', color: 'var(--text-sub)' }} onClick={() => setGender(g)}>{g}</button>
          ))}
        </div>

        <button className="w-full text-[15px] font-bold py-[15px] rounded-[16px] min-h-[52px] text-white active:opacity-80" style={{ background: 'var(--gradient)' }} onClick={onClose}>소모임 개설하기</button>
      </div>
    </div>
  );
}

/* ── 메인 ── */
export default function CommunityPage() {
  const [genderFilter, setGenderFilter] = useState<Gender>('전체');
  const [tagFilter, setTagFilter] = useState('전체');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [groups, setGroups] = useState<Group[]>(GROUPS);

  const toggleActive = (id: number) => setGroups(prev => prev.map(g => g.id === id ? { ...g, active: !g.active } : g));

  const filtered = groups.filter(g => {
    if (genderFilter === '남' && g.gender !== '남') return false;
    if (genderFilter === '여' && g.gender !== '여') return false;
    if (tagFilter !== '전체' && !g.tags.includes(tagFilter)) return false;
    if (search && !g.title.includes(search) && !g.subtitle.includes(search)) return false;
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
        <input className="flex-1 bg-transparent text-[14px] min-w-0" style={{ color: 'var(--text)' }} placeholder="소모임 검색" value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button className="text-[12px] px-1" style={{ color: 'var(--text-muted)' }} onClick={() => setSearch('')}>✕</button>}
      </div>

      {/* 성별 필터 */}
      <div className="flex gap-[7px] mb-2.5">
        {GENDER_FILTERS.map(g => (
          <button key={g} className="text-[13px] font-semibold px-4 py-[7px] rounded-[20px] min-h-[34px] border" style={genderFilter === g ? { background: 'var(--gradient)', borderColor: 'transparent', color: 'white' } : { background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-sub)' }} onClick={() => setGenderFilter(g)}>{g}</button>
        ))}
      </div>

      {/* 태그 필터 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TAGS.map(t => (
          <button key={t} className="text-[12px] font-medium px-[13px] py-[7px] rounded-[20px] whitespace-nowrap min-h-[34px] border shrink-0" style={tagFilter === t ? { background: 'var(--primary-bg)', borderColor: 'var(--primary-border)', color: 'var(--primary)', fontWeight: 700 } : { background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-sub)' }} onClick={() => setTagFilter(t)}>{t}</button>
        ))}
      </div>

      {/* 목록 */}
      <div className="flex flex-col gap-2.5">
        {filtered.length === 0
          ? <p className="text-center py-12 text-[14px]" style={{ color: 'var(--text-muted)' }}>검색 결과가 없어요</p>
          : filtered.map(g => <GroupCard key={g.id} g={g} onToggle={() => toggleActive(g.id)} />)
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

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
