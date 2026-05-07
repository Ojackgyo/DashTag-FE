import { useState } from 'react';

type Gender = '전체' | '남' | '여';

interface Schedule {
  title: string;
  time: string;
  enrolled: number;
  max: number;
  isRecruiting: boolean;
  isEnded?: boolean;
}

interface Member {
  emoji: string;
  name: string;
  location: string;
  info: string;
}

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
  location?: string;
  openedAt?: string;
  ageRange?: string;
  description?: string;
  members?: Member[];
  schedules?: Schedule[];
  leader?: { emoji: string; name: string; temp: string; duration: string };
  recentJoins?: number;
}

const GROUPS: Group[] = [
  {
    id: 1, emoji: '🎸', title: '홍대 버스킹 감상단', subtitle: '매주 금요일 저녁, 버스킹 같이 봐요',
    tags: ['음악', '감성', '홍대'], gender: '혼성', maxMembers: 8, currentMembers: 5, active: true,
    location: '미추홀구', openedAt: '2024년 3월 개설', ageRange: '20~30세 모집',
    description: '홍대 앞 버스킹을 함께 즐기는 모임이에요 🎵\n매주 금요일 저녁 7시에 만나서 거리 공연을 구경하고, 맛있는 것도 먹으면서 수다 떨어요. 음악 좋아하는 분이라면 누구든 환영해요!',
    members: [
      { emoji: '🎸', name: '뮤직러버', location: '미추홀구', info: '95년생 여' },
      { emoji: '🎵', name: '버스킹팬', location: '남구', info: '98년생 남' },
      { emoji: '🎤', name: '노래좋아', location: '연수구', info: '97년생 여' },
      { emoji: '🎹', name: '피아노맨', location: '미추홀구', info: '96년생 남' },
      { emoji: '🎺', name: '재즈러', location: '남구', info: '00년생 여' },
    ],
    schedules: [
      { title: '홍대 버스킹 감상 (4월)', time: '금 오후 7:00', enrolled: 4, max: 8, isRecruiting: true },
      { title: '신촌 버스킹 탐방', time: '토 오후 5:00', enrolled: 3, max: 6, isRecruiting: true },
      { title: '홍대 버스킹 감상 (3월)', time: '3월 28일', enrolled: 6, max: 8, isRecruiting: false, isEnded: true },
    ],
    leader: { emoji: '🎸', name: '뮤직러버', temp: '38.2°C', duration: '1년 이상 모임 운영' },
    recentJoins: 4,
  },
  {
    id: 2, emoji: '🧗', title: '주말 클라이밍 크루', subtitle: '초보 환영! 같이 배워요',
    tags: ['스포츠', '운동', '건강'], gender: '혼성', maxMembers: 6, currentMembers: 3, active: true,
    location: '남구', openedAt: '2024년 1월 개설', ageRange: '20~35세 모집',
    description: '인하대 근처 클라이밍 센터에서 활동하는 크루예요 🧗\n초보자도 환영해요! 처음 시작하시는 분들께 기초부터 알려드려요. 주말마다 정기적으로 모여요.',
    members: [
      { emoji: '🧗', name: '클라이머', location: '남구', info: '96년생 남' },
      { emoji: '💪', name: '헬스왕', location: '미추홀구', info: '98년생 남' },
      { emoji: '🏋️', name: '운동매니아', location: '남구', info: '00년생 여' },
    ],
    schedules: [
      { title: '주말 클라이밍 (4월)', time: '토 오전 10:00', enrolled: 2, max: 6, isRecruiting: true },
      { title: '초보자 클라이밍 특강', time: '일 오후 2:00', enrolled: 3, max: 4, isRecruiting: true },
    ],
    leader: { emoji: '🧗', name: '클라이머', temp: '41.0°C', duration: '6개월 이상 모임 운영' },
    recentJoins: 2,
  },
  {
    id: 3, emoji: '📚', title: '공대생 독서 모임', subtitle: '한 달에 한 권, 꾸준히 읽어요',
    tags: ['독서', '자기계발'], gender: '남', maxMembers: 5, currentMembers: 4, active: true, isMine: true,
    location: '미추홀구', openedAt: '2023년 9월 개설', ageRange: '20~28세 모집',
    description: '공대생들이 모여 한 달에 책 한 권씩 읽고 이야기 나누는 모임이에요 📖\n기술서적부터 인문학까지 다양하게 읽어요. 독서 후 카페에서 2시간 토론 진행해요.',
    members: [
      { emoji: '📚', name: '책쟁이', location: '미추홀구', info: '99년생 남' },
      { emoji: '💻', name: 'CS전공', location: '남구', info: '01년생 남' },
      { emoji: '🔬', name: '공학도', location: '미추홀구', info: '00년생 남' },
      { emoji: '📐', name: '수학사랑', location: '연수구', info: '02년생 남' },
    ],
    schedules: [
      { title: '4월 독서 토론 - 클린코드', time: '토 오후 3:00', enrolled: 4, max: 5, isRecruiting: true },
      { title: '3월 독서 토론', time: '3월 토론', enrolled: 4, max: 5, isRecruiting: false, isEnded: true },
    ],
    leader: { emoji: '📚', name: '책쟁이', temp: '39.5°C', duration: '7개월 이상 모임 운영' },
    recentJoins: 1,
  },
  {
    id: 4, emoji: '📸', title: '한강 사진 산책', subtitle: '사진 찍으면서 산책해요 🌊',
    tags: ['사진', '한강', '힐링'], gender: '여', maxMembers: 6, currentMembers: 2, active: false,
    location: '남구', openedAt: '2024년 2월 개설', ageRange: '20~30세 모집',
    description: '카메라 들고 한강변을 거닐며 사진 찍는 모임이에요 📷\n실력 상관없이 사진 찍는 것 좋아하는 분이라면 환영해요!',
    members: [
      { emoji: '📸', name: '사진작가', location: '남구', info: '98년생 여' },
      { emoji: '🌸', name: '꽃보다봄', location: '미추홀구', info: '00년생 여' },
    ],
    schedules: [
      { title: '봄 한강 출사 (모집 중)', time: '4월 20일 오후 4:00', enrolled: 1, max: 6, isRecruiting: true },
    ],
    leader: { emoji: '📸', name: '사진작가', temp: '37.8°C', duration: '2개월 이상 모임 운영' },
    recentJoins: 2,
  },
  {
    id: 5, emoji: '🎮', title: 'VALORANT 파티원 구해요', subtitle: 'PC방에서 같이 해요',
    tags: ['게임', '파티', 'PC방'], gender: '남', maxMembers: 5, currentMembers: 4, active: true,
    location: '미추홀구', openedAt: '2024년 4월 개설', ageRange: '18~27세 모집',
    description: '인하대 근처 PC방에서 발로란트 함께 즐길 파티원을 구해요 🎮\n현재 골드~플래티넘 위주이며, 다이아도 환영해요. 주말 저녁 주로 모입니다.',
    members: [
      { emoji: '🎮', name: '게이머킹', location: '미추홀구', info: '01년생 남' },
      { emoji: '⚔️', name: '발로고수', location: '남구', info: '02년생 남' },
      { emoji: '🏆', name: '랭커지망', location: '미추홀구', info: '00년생 남' },
      { emoji: '🎯', name: '에임장인', location: '연수구', info: '03년생 남' },
    ],
    schedules: [
      { title: '주말 PC방 파티 (4/27)', time: '토 오후 8:00', enrolled: 3, max: 5, isRecruiting: true },
      { title: '주중 저녁 파티', time: '화/목 오후 10:00', enrolled: 4, max: 5, isRecruiting: true },
    ],
    leader: { emoji: '🎮', name: '게이머킹', temp: '42.1°C', duration: '3개월 이상 모임 운영' },
    recentJoins: 6,
  },
  {
    id: 6, emoji: '🍜', title: '신촌 맛집 탐방대', subtitle: '매주 새로운 곳을 발견해요',
    tags: ['맛집', '신촌', '미식'], gender: '혼성', maxMembers: 6, currentMembers: 2, active: true,
    location: '미추홀구', openedAt: '2024년 3월 개설', ageRange: '20~30세 모집',
    description: '인하대 근처 맛집부터 인천 전역을 탐방하는 미식 모임이에요 🍽️\n매주 새로운 맛집을 발굴하고 솔직한 리뷰를 남겨요. 먹는 걸 좋아한다면 무조건 환영!',
    members: [
      { emoji: '🍜', name: '먹부림', location: '미추홀구', info: '97년생 여' },
      { emoji: '🍱', name: '맛잘알', location: '남구', info: '99년생 남' },
    ],
    schedules: [
      { title: '인하대 근처 신상 라멘 탐방', time: '토 오후 12:00', enrolled: 2, max: 6, isRecruiting: true },
      { title: '차이나타운 맛집 투어', time: '일 오후 1:00', enrolled: 1, max: 6, isRecruiting: true },
    ],
    leader: { emoji: '🍜', name: '먹부림', temp: '40.3°C', duration: '1개월 이상 모임 운영' },
    recentJoins: 2,
  },
];

const TAGS = ['전체', '음악', '스포츠', '독서', '게임', '맛집', '사진', '운동', '힐링', '자기계발'];
const GENDER_FILTERS: Gender[] = ['전체', '남', '여'];
const CATEGORIES = ['운동', '게임', '독서', '맛집', '음악', '사진/여행', '스터디', '동네친구', '기타'];
const LOCATIONS = ['인하대 근처', '미추홀구', '남구', '연수구', '부평구', '계양구', '서구'];
const GENDER_COLOR: Record<string, string> = { 남: '#5B8DEF', 여: '#FF80AB', 혼성: '#9E9E9E' };

/* ── 방장 대시보드 ── */
function HostDashboard({ group, onClose }: { group: Group; onClose: () => void }) {
  const [tab, setTab] = useState<'overview' | 'members' | 'schedule' | 'settings'>('overview');
  const [active, setActive] = useState(group.active);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleMax, setScheduleMax] = useState('6');
  const [schedules, setSchedules] = useState(group.schedules ?? []);
  const [members, setMembers] = useState(group.members ?? []);

  const PENDING = [
    { emoji: '🎓', name: '신입회원', location: '미추홀구', info: '03년생 남' },
    { emoji: '📖', name: '독서왕', location: '남구', info: '01년생 남' },
  ];

  const tabs = [
    { key: 'overview', label: '현황', icon: '📊' },
    { key: 'members',  label: '멤버',  icon: '👥' },
    { key: 'schedule', label: '일정',  icon: '📅' },
    { key: 'settings', label: '설정',  icon: '⚙️' },
  ] as const;

  const addSchedule = () => {
    if (!scheduleTitle.trim() || !scheduleTime.trim()) return;
    setSchedules(prev => [...prev, {
      title: scheduleTitle.trim(), time: scheduleTime.trim(),
      enrolled: 0, max: parseInt(scheduleMax) || 6,
      isRecruiting: true,
    }]);
    setScheduleTitle(''); setScheduleTime('');
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'var(--bg)', display: 'flex', flexDirection: 'column',
      animation: 'slideInFromRight 0.3s cubic-bezier(0.22,1,0.36,1)',
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
        background: 'var(--header-bg)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--text)' }}>‹</button>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>모임 관리</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{group.emoji} {group.title}</p>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
          background: active ? 'rgba(72,199,116,0.14)' : 'var(--bg-card2)',
          color: active ? '#48c774' : 'var(--text-muted)',
          border: `1px solid ${active ? 'rgba(72,199,116,0.3)' : 'var(--border)'}`,
        }}>{active ? '● 활성' : '○ 비활성'}</div>
      </div>

      {/* 탭 바 */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            style={{
              flex: 1, padding: '11px 4px', fontSize: 12, fontWeight: tab === t.key ? 800 : 500,
              color: tab === t.key ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: tab === t.key ? '2.5px solid var(--primary)' : '2.5px solid transparent',
              background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}
            onClick={() => setTab(t.key)}
          >
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 40px', scrollbarWidth: 'none' }}>

        {/* ── 현황 탭 ── */}
        {tab === 'overview' && (
          <div>
            {/* 가입 신청 알림 */}
            {PENDING.length > 0 && (
              <div style={{
                padding: '14px 16px', borderRadius: 16, marginBottom: 16,
                background: 'rgba(255,128,171,0.1)', border: '1.5px solid var(--primary-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginBottom: 2 }}>
                    📩 가입 신청 {PENDING.length}건
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>멤버 탭에서 확인할 수 있어요</p>
                </div>
                <button
                  style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', padding: '6px 12px', borderRadius: 20, background: 'var(--primary-bg)', border: '1px solid var(--primary-border)' }}
                  onClick={() => setTab('members')}
                >확인 ›</button>
              </div>
            )}

            {/* 통계 카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: '전체 멤버', value: members.length, icon: '👥', color: '#5B8DEF' },
                { label: '일정', value: schedules.length, icon: '📅', color: 'var(--primary)' },
              ].map(s => (
                <div key={s.label} style={{ padding: '16px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <span style={{ fontSize: 24 }}>{s.icon}</span>
                  <p style={{ fontSize: 22, fontWeight: 900, color: s.color, margin: '6px 0 2px' }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* 최근 활동 */}
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-card2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>최근 활동</div>
              {[
                { icon: '🆕', text: `독서왕 님이 가입 신청했어요`, time: '1시간 전' },
                { icon: '📅', text: `4월 독서 토론 일정이 마감됐어요`, time: '3시간 전' },
                { icon: '💬', text: `멤버가 게시글을 작성했어요`, time: '1일 전' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                  <p style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{item.text}</p>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 멤버 탭 ── */}
        {tab === 'members' && (
          <div>
            {/* 가입 신청 */}
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>가입 신청 <span style={{ color: 'var(--primary)' }}>{PENDING.length}</span></p>
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 20 }}>
              {PENDING.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-card)', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{p.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{p.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.location} · {p.info}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ padding: '7px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: 'rgba(72,199,116,0.14)', color: '#48c774', border: '1px solid rgba(72,199,116,0.3)' }}>수락</button>
                    <button style={{ padding: '7px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: 'var(--bg-card2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>거절</button>
                  </div>
                </div>
              ))}
            </div>

            {/* 현재 멤버 */}
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>현재 멤버 <span style={{ color: 'var(--text-muted)' }}>{members.length}명</span></p>
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
              {members.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-card)', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: '1px solid var(--border)', flexShrink: 0 }}>{m.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{m.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.location} · {m.info}</p>
                  </div>
                  <button style={{ padding: '6px 11px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: 'var(--bg-card2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                    onClick={() => setMembers(prev => prev.filter((_, idx) => idx !== i))}
                  >내보내기</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 일정 탭 ── */}
        {tab === 'schedule' && (
          <div>
            {/* 일정 추가 폼 */}
            <div style={{ padding: '16px', borderRadius: 18, border: '1.5px solid var(--primary-border)', background: 'var(--primary-bg)', marginBottom: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)', marginBottom: 12 }}>+ 새 일정 추가</p>
              <input
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, marginBottom: 8, boxSizing: 'border-box' }}
                placeholder="일정 이름 (예: 4월 독서 토론)"
                value={scheduleTitle}
                onChange={e => setScheduleTitle(e.target.value)}
              />
              <input
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, marginBottom: 8, boxSizing: 'border-box' }}
                placeholder="날짜/시간 (예: 토 오후 3:00)"
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>최대 인원</span>
                  <input
                    style={{ flex: 1, background: 'transparent', color: 'var(--text)', fontSize: 14, fontWeight: 700, textAlign: 'right' }}
                    type="number" min="2" max="50"
                    value={scheduleMax}
                    onChange={e => setScheduleMax(e.target.value)}
                  />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>명</span>
                </div>
                <button
                  style={{
                    padding: '10px 18px', borderRadius: 12, fontSize: 14, fontWeight: 800,
                    color: scheduleTitle && scheduleTime ? 'white' : 'var(--text-muted)',
                    background: scheduleTitle && scheduleTime ? 'var(--gradient)' : 'var(--bg-card2)',
                    border: '1px solid var(--border)',
                    cursor: scheduleTitle && scheduleTime ? 'pointer' : 'not-allowed',
                  }}
                  onClick={addSchedule}
                  disabled={!scheduleTitle || !scheduleTime}
                >추가</button>
              </div>
            </div>

            {/* 일정 목록 */}
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>일정 목록</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {schedules.map((s, i) => (
                <div key={i} style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{s.title}</p>
                      {s.isRecruiting && !s.isEnded && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#48c774', background: 'rgba(72,199,116,0.14)', padding: '1px 6px', borderRadius: 6 }}>모집중</span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>🕐 {s.time} &nbsp; 👥 {s.enrolled}/{s.max}명</p>
                  </div>
                  <button
                    style={{ padding: '6px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: 'rgba(255,107,107,0.12)', color: '#FF6B6B', border: '1px solid rgba(255,107,107,0.25)', flexShrink: 0 }}
                    onClick={() => setSchedules(prev => prev.filter((_, idx) => idx !== i))}
                  >삭제</button>
                </div>
              ))}
              {schedules.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '24px 0' }}>일정이 없어요. 위에서 추가해보세요!</p>
              )}
            </div>
          </div>
        )}

        {/* ── 설정 탭 ── */}
        {tab === 'settings' && (
          <div>
            <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)', marginBottom: 12 }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-card2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>기본 설정</div>
              {[
                { label: '모임 정보 수정', icon: '✏️', action: () => {} },
                { label: '가입 조건 설정', icon: '🔑', action: () => {} },
                { label: '공지 작성', icon: '📢', action: () => {} },
              ].map((item, i) => (
                <button
                  key={item.label}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
                  onClick={item.action}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{item.label}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>›</span>
                </button>
              ))}
            </div>

            {/* 활성화 토글 */}
            <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)', marginBottom: 12 }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-card2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>모임 상태</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>모임 활성화</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>비활성화하면 새 멤버가 가입할 수 없어요</p>
                </div>
                <button
                  onClick={() => setActive(v => !v)}
                  style={{
                    width: 48, height: 28, borderRadius: 14, flexShrink: 0,
                    background: active ? 'var(--gradient)' : 'var(--bg-card2)',
                    border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                    position: 'relative', transition: 'background 0.25s',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 2,
                    left: active ? 20 : 2,
                    width: 20, height: 20, borderRadius: '50%',
                    background: active ? 'white' : 'var(--text-muted)',
                    transition: 'left 0.25s',
                  }} />
                </button>
              </div>
            </div>

            {/* 위험 구역 */}
            <div style={{ borderRadius: 18, overflow: 'hidden', border: '1.5px solid rgba(255,107,107,0.3)', background: 'rgba(255,107,107,0.06)' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,107,107,0.2)', fontSize: 12, fontWeight: 700, color: '#FF6B6B', letterSpacing: '0.5px', textTransform: 'uppercase' }}>위험 구역</div>
              <button
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px' }}
                onClick={() => { if (window.confirm('정말 모임을 삭제하시겠어요?')) onClose(); }}
              >
                <span style={{ fontSize: 16 }}>🗑️</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#FF6B6B' }}>모임 삭제</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 그룹 상세 뷰 ── */
function GroupDetailView({ group, onClose }: { group: Group; onClose: () => void }) {
  const [joined, setJoined] = useState(false);
  const [showHostDashboard, setShowHostDashboard] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [showAllSchedules, setShowAllSchedules] = useState(false);

  const displayMembers = showAllMembers ? (group.members ?? []) : (group.members ?? []).slice(0, 5);
  const displaySchedules = showAllSchedules ? (group.schedules ?? []) : (group.schedules ?? []).slice(0, 3);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      animation: 'slideInFromRight 0.3s cubic-bezier(0.22,1,0.36,1)',
    }}>
      {/* 상단 네비게이션 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 20px',
        background: 'var(--header-bg)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={onClose}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: 'var(--text)',
          }}
        >‹</button>
        <p style={{ flex: 1, fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.title}</p>
        <button style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--text-muted)' }}>⬆</button>
      </div>

      {/* 스크롤 콘텐츠 */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100, scrollbarWidth: 'none' }}>

        {/* 그룹 헤더 배너 */}
        <div style={{
          background: 'linear-gradient(160deg, var(--primary-bg) 0%, var(--bg-card2) 100%)',
          padding: '28px 20px 24px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24, flexShrink: 0,
              background: 'var(--bg-card)', border: '2px solid var(--primary-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
              boxShadow: 'var(--shadow-primary)',
            }}>{group.emoji}</div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              <p style={{ fontSize: 21, fontWeight: 900, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.3px' }}>{group.title}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                {group.location} • 멤버 {group.currentMembers}명
              </p>
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
          <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 14 }}>📅</span>
              <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>{group.openedAt}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 14 }}>👤</span>
              <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>{group.ageRange}</span>
            </div>
          </div>
          {group.description && (
            <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{group.description}</p>
          )}
        </div>

        {/* 통계 */}
        <div style={{
          display: 'flex', justifyContent: 'space-around',
          padding: '14px 20px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card2)',
        }}>
          {[
            { label: '멤버', value: group.currentMembers },
            { label: '일정', value: group.schedules?.length ?? 0 },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>{s.value}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* 멤버 */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>멤버 <span style={{ color: 'var(--primary)' }}>{group.currentMembers}</span></p>
            {(group.members?.length ?? 0) > 5 && (
              <button style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }} onClick={() => setShowAllMembers(!showAllMembers)}>
                {showAllMembers ? '접기' : '더보기 ›'}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
            {displayMembers.map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: 'var(--bg-card)',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: '1px solid var(--border)', flexShrink: 0 }}>{m.emoji}</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{m.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.location} · {m.info}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 일정 */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>일정 <span style={{ color: 'var(--primary)' }}>{group.schedules?.length ?? 0}</span></p>
            {(group.schedules?.length ?? 0) > 3 && (
              <button style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }} onClick={() => setShowAllSchedules(!showAllSchedules)}>
                {showAllSchedules ? '접기' : '더보기 ›'}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displaySchedules.map((s, i) => (
              <div key={i} style={{
                padding: '14px 16px', borderRadius: 14,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                opacity: s.isEnded ? 0.55 : 1,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{s.title}</p>
                  {s.isRecruiting && !s.isEnded && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#48c774', background: 'rgba(72,199,116,0.14)', padding: '2px 7px', borderRadius: 6, flexShrink: 0, marginLeft: 8 }}>모집중</span>
                  )}
                  {s.isEnded && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-card2)', padding: '2px 7px', borderRadius: 6, flexShrink: 0, marginLeft: 8 }}>종료</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>🕐 {s.time}</span>
                  <span>👥 {s.enrolled}/{s.max}명</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 모임장 소개 */}
        {group.leader && (
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>모임장 소개</p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 14,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
            }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, border: '1px solid var(--border)', flexShrink: 0 }}>{group.leader.emoji}</div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>{group.leader.name}</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#FF6B6B' }}>🌡️ {group.leader.temp}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>• {group.leader.duration}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 최근 가입 */}
        {group.recentJoins && (
          <div style={{ padding: '14px 20px' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
              최근 30일간 <b style={{ color: 'var(--primary)' }}>{group.recentJoins}명</b>이 가입했어요
            </p>
          </div>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 520,
        padding: '12px 20px 36px',
        background: 'linear-gradient(to top, var(--bg) 70%, transparent)',
      }}>
        {group.isMine ? (
          <button
            style={{
              width: '100%', padding: '16px', borderRadius: 18,
              fontSize: 16, fontWeight: 800, color: 'white',
              background: 'var(--gradient)',
              boxShadow: '0 5px 20px rgba(255,128,171,0.45)',
            }}
            onClick={() => setShowHostDashboard(true)}
          >🛠 모임 관리하기</button>
        ) : joined ? (
          <button style={{
            width: '100%', padding: '16px', borderRadius: 18,
            fontSize: 16, fontWeight: 800, color: 'var(--primary)',
            background: 'var(--primary-bg)', border: '2px solid var(--primary-border)',
          }} disabled>✓ 입장 완료</button>
        ) : (
          <button
            style={{
              width: '100%', padding: '16px', borderRadius: 18,
              fontSize: 16, fontWeight: 800,
              color: group.active ? 'white' : 'var(--text-muted)',
              background: group.active ? 'var(--gradient)' : 'var(--bg-card2)',
              boxShadow: group.active ? '0 5px 20px rgba(255,128,171,0.45)' : 'none',
              cursor: group.active ? 'pointer' : 'not-allowed',
            }}
            disabled={!group.active}
            onClick={() => setJoined(true)}
          >
            {group.active ? '입장하기' : '모집 종료'}
          </button>
        )}
      </div>

      {showHostDashboard && <HostDashboard group={group} onClose={() => setShowHostDashboard(false)} />}
    </div>
  );
}

/* ── 그룹 카드 ── */
function GroupCard({ g, onOpen, onToggle }: { g: Group; onOpen: () => void; onToggle?: () => void }) {
  const gc = GENDER_COLOR[g.gender];
  return (
    <div
      className={`rounded-[18px] p-[14px] border ${!g.active ? 'opacity-55' : ''}`}
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', cursor: 'pointer' }}
      onClick={onOpen}
    >
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
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [gender, setGender] = useState<'남' | '여' | '혼성'>('혼성');

  const EMOJI_LIST = ['🎯', '🎸', '🧗', '📚', '📸', '🎮', '🍜', '🎨', '⚽', '🏃', '🎤', '🌿'];
  const canSubmit = title.trim().length >= 2 && category && location;

  return (
    <div className="fixed inset-0 bg-black/55 flex items-end justify-center z-[200]" onClick={onClose}>
      <div
        className="rounded-[28px_28px_0_0] px-5 pt-6 pb-9 w-full max-w-[520px] max-h-[92vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ background: 'var(--bg-card)', animation: 'slideUpSheet 0.35s cubic-bezier(0.22,1,0.36,1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center mb-4">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        <div className="flex justify-between items-center mb-5">
          <span className="text-[17px] font-extrabold" style={{ color: 'var(--text)' }}>소모임 만들기</span>
          <button className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px]" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }} onClick={onClose}>✕</button>
        </div>

        {/* 이모티콘 */}
        <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-sub)' }}>이모티콘</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {EMOJI_LIST.map(e => (
            <button key={e} className="w-[42px] h-[42px] rounded-[12px] text-[20px] flex items-center justify-center border-2" style={emoji === e ? { background: 'var(--primary-bg)', borderColor: 'var(--primary)' } : { background: 'var(--bg-card2)', borderColor: 'transparent' }} onClick={() => setEmoji(e)}>{e}</button>
          ))}
        </div>

        {/* 모임명 */}
        <p className="text-[13px] font-bold mb-1" style={{ color: 'var(--text-sub)' }}>모임명 <span style={{ color: 'var(--primary)' }}>*</span></p>
        <p className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>모임명이 짧을수록 이해하기 쉬워요</p>
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

        {/* 카테고리 */}
        <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-sub)' }}>카테고리 <span style={{ color: 'var(--primary)' }}>*</span></p>
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map(c => (
            <button key={c} className="text-[13px] font-semibold px-[13px] py-[8px] rounded-[20px] border"
              style={category === c
                ? { background: 'var(--primary-bg)', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 700 }
                : { background: 'var(--bg-card2)', borderColor: 'transparent', color: 'var(--text-sub)' }
              }
              onClick={() => setCategory(category === c ? '' : c)}
            >{c}</button>
          ))}
        </div>

        {/* 활동 지역 */}
        <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-sub)' }}>활동 지역 <span style={{ color: 'var(--primary)' }}>*</span></p>
        <div className="flex flex-wrap gap-2 mb-4">
          {LOCATIONS.map(l => (
            <button key={l} className="text-[13px] font-semibold px-[13px] py-[8px] rounded-[20px] border"
              style={location === l
                ? { background: 'var(--primary-bg)', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 700 }
                : { background: 'var(--bg-card2)', borderColor: 'transparent', color: 'var(--text-sub)' }
              }
              onClick={() => setLocation(location === l ? '' : l)}
            >{l}</button>
          ))}
        </div>

        {/* 모임 소개 */}
        <p className="text-[13px] font-bold mb-1" style={{ color: 'var(--text-sub)' }}>모임 소개</p>
        <p className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>활동 중심으로 모임을 소개해주세요. 소개를 잘 작성한 모임은 2배 많은 이웃이 가입해요.</p>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <textarea
            className="w-full rounded-[12px] px-[14px] py-3 text-[14px] border resize-none"
            style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)', minHeight: 120, lineHeight: 1.6 }}
            placeholder="모임 소개를 입력해주세요"
            value={description}
            onChange={e => setDescription(e.target.value.slice(0, 500))}
          />
          <span style={{ position: 'absolute', right: 12, bottom: 10, fontSize: 11, color: 'var(--text-muted)' }}>{description.length}/500</span>
        </div>

        {/* 성별 */}
        <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--text-sub)' }}>성별</p>
        <div className="flex gap-2 mb-6">
          {(['혼성', '남', '여'] as const).map(g => (
            <button key={g} className="flex-1 text-[14px] font-semibold py-[11px] rounded-[12px] border-2" style={gender === g ? { borderColor: 'var(--primary)', background: 'var(--primary-bg)', color: 'var(--primary)' } : { borderColor: 'transparent', background: 'var(--bg-card2)', color: 'var(--text-sub)' }} onClick={() => setGender(g)}>{g}</button>
          ))}
        </div>

        <button
          className="w-full text-[15px] font-bold py-[15px] rounded-[16px] min-h-[52px] active:opacity-80"
          style={{
            background: canSubmit ? 'var(--gradient)' : 'var(--bg-card2)',
            color: canSubmit ? 'white' : 'var(--text-muted)',
            boxShadow: canSubmit ? '0 4px 20px rgba(255,128,171,0.35)' : 'none',
          }}
          disabled={!canSubmit}
          onClick={onClose}
        >
          모임 만들기
        </button>
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
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

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
          : filtered.map(g => (
            <GroupCard
              key={g.id}
              g={g}
              onOpen={() => setSelectedGroup(g)}
              onToggle={() => toggleActive(g.id)}
            />
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

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
      {selectedGroup && <GroupDetailView group={selectedGroup} onClose={() => setSelectedGroup(null)} />}
    </div>
  );
}
