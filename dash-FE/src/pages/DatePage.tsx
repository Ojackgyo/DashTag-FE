import { useState } from 'react';
import { useChance } from '../hooks/useChance';
import ChanceModal from '../components/ChanceModal';

interface Profile {
  id: number;
  emoji: string;
  face: string;
  nickname: string;
  major: string;
  age: number;
  studentId: string;
  mbti: string;
  height: number;
  weight: number;
  skinTone: string;
  hairStyle: string;
  tattoo: string;
  smoking: string;
  charmPoints: string[];
}

const PROFILES: Profile[] = [
  {
    id: 1, emoji: '🦊', face: '여우상', nickname: 'Aria',
    major: '경영학과', age: 23, studentId: '21학번',
    mbti: 'ENFP', height: 163, weight: 50,
    skinTone: '밝음', hairStyle: '긴 머리', tattoo: '없어요', smoking: '비흡연',
    charmPoints: ['유머러스', '요리 잘함', '애교 많음'],
  },
  {
    id: 2, emoji: '🐱', face: '고양이상', nickname: 'Nova',
    major: '디자인학과', age: 25, studentId: '19학번',
    mbti: 'INFJ', height: 160, weight: 48,
    skinTone: '매우 밝음', hairStyle: '중단발', tattoo: '작은 타투', smoking: '비흡연',
    charmPoints: ['감성적', '그림 잘 그림'],
  },
  {
    id: 3, emoji: '🦌', face: '사슴상', nickname: 'Luna',
    major: '심리학과', age: 22, studentId: '22학번',
    mbti: 'ISFP', height: 165, weight: 52,
    skinTone: '중간', hairStyle: '긴 머리', tattoo: '없어요', smoking: '가끔 피워요',
    charmPoints: ['공감 잘함', '독서 좋아함', '목소리 좋음'],
  },
  {
    id: 4, emoji: '🐶', face: '강아지상', nickname: 'Zack',
    major: '컴퓨터공학과', age: 24, studentId: '20학번',
    mbti: 'ENTP', height: 175, weight: 70,
    skinTone: '밝음', hairStyle: '짧은 머리', tattoo: '없어요', smoking: '비흡연',
    charmPoints: ['운동 잘함', '재미있음', '추진력 있음'],
  },
  {
    id: 5, emoji: '🐻', face: '곰상', nickname: 'Gray',
    major: '사회학과', age: 26, studentId: '18학번',
    mbti: 'ISTJ', height: 178, weight: 75,
    skinTone: '어두운 편', hairStyle: '스포츠 컷', tattoo: '없어요', smoking: '금연 중이에요',
    charmPoints: ['믿음직함', '요리 잘함'],
  },
  {
    id: 6, emoji: '🐰', face: '토끼상', nickname: 'Mia',
    major: '간호학과', age: 21, studentId: '23학번',
    mbti: 'ESFJ', height: 158, weight: 46,
    skinTone: '매우 밝음', hairStyle: '긴 머리', tattoo: '없어요', smoking: '비흡연',
    charmPoints: ['친절함', '밝은 에너지', '노래 잘함'],
  },
];

const DETAIL_ROWS = (p: Profile) => [
  { label: '🎂 나이', value: `${p.age}세 (${p.studentId})` },
  { label: '🎓 학과', value: p.major },
  { label: '📏 키 / 몸무게', value: `${p.height}cm / ${p.weight}kg` },
  { label: '🎨 피부톤', value: p.skinTone },
  { label: '💇 헤어스타일', value: p.hairStyle },
  { label: '🖊️ 타투', value: p.tattoo },
  { label: '🚬 흡연', value: p.smoking },
];

export default function DatePage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [chatSentId, setChatSentId] = useState<number | null>(null);
  const [showChanceModal, setShowChanceModal] = useState(false);
  const { hasChance, spend } = useChance();

  const selectedProfile = PROFILES.find(p => p.id === selectedId) ?? null;

  const handleCardClick = (id: number) => {
    setFlipped(false);
    setSelectedId(id);
    // 모달이 마운트된 뒤 flip 시작
    setTimeout(() => setFlipped(true), 60);
  };

  const handleClose = () => {
    setFlipped(false);
    setTimeout(() => setSelectedId(null), 650);
  };

  const handleChatRequest = () => {
    if (chatSentId !== null || !hasChance) return;
    setShowChanceModal(true);
  };

  const confirmChat = () => {
    spend();
    setChatSentId(selectedId);
    setShowChanceModal(false);
  };

  const isChatSent = selectedId !== null && chatSentId === selectedId;
  const chatDisabled = (chatSentId !== null && chatSentId !== selectedId) || (!hasChance && chatSentId === null);

  return (
    <div className="px-[18px] pb-6">
      {/* 상단 */}
      <div className="pt-6 pb-[18px]">
        <h1 className="text-[clamp(20px,6vw,24px)] font-extrabold tracking-tight mb-1" style={{ color: 'var(--text)' }}>
          1대1 소개팅 💘
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-sub)' }}>나랑 꼭 맞는 한 사람을 만나보세요</p>
      </div>

      {/* 2열 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {PROFILES.map((p, idx) => {
          // 왼쪽 컬럼(짝수) → 오른쪽 컬럼(홀수) 순으로 릴 멈춤
          const col = idx % 2;          // 0=left, 1=right
          const row = Math.floor(idx / 2);
          const delay = col * 0.18 + row * 0.12;
          return (
          <button
            key={p.id}
            className="slot-reel aspect-square rounded-[22px] flex flex-col items-center justify-center gap-2 active:scale-[0.96]"
            style={{
              background: 'var(--primary-bg)',
              border: '1.5px solid var(--primary-border)',
              animationDelay: `${delay}s`,
            }}
            onClick={() => handleCardClick(p.id)}
          >
            <span style={{ fontSize: '48px', lineHeight: 1 }}>{p.emoji}</span>
            <p className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{p.face}</p>
            <span
              className="text-[11px] font-bold px-2 py-[2px] rounded-[7px]"
              style={{ color: 'var(--primary)', background: 'rgba(255,128,171,0.18)' }}
            >
              {p.mbti}
            </span>
          </button>
          );
        })}
      </div>

      {/* 기회 확인 팝업 */}
      {showChanceModal && (
        <ChanceModal
          label="정말 오늘의 기회를 사용하시겠습니까?"
          onConfirm={confirmChat}
          onCancel={() => setShowChanceModal(false)}
        />
      )}

      {/* 카드 플립 모달 */}
      {selectedId !== null && selectedProfile && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[200] px-5"
          style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(8px)' }}
          onClick={handleClose}
        >
          {/* 카드 컨테이너 */}
          <div
            style={{ perspective: '1200px', width: '100%', maxWidth: '340px' }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                position: 'relative',
                height: '520px',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* ── 앞면 ── */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  borderRadius: '28px',
                  background: 'var(--primary-bg)',
                  border: '2px solid var(--primary-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                }}
              >
                <span style={{ fontSize: '90px', lineHeight: 1 }}>{selectedProfile.emoji}</span>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>{selectedProfile.face}</p>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', background: 'rgba(255,128,171,0.2)', padding: '4px 14px', borderRadius: '10px' }}>
                    {selectedProfile.mbti}
                  </span>
                </div>
              </div>

              {/* ── 뒷면 (상세 정보) ── */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  borderRadius: '28px',
                  background: 'var(--bg-card)',
                  border: '2px solid var(--primary-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* 닫기 */}
                <button
                  style={{
                    position: 'absolute', top: '14px', right: '14px',
                    width: '30px', height: '30px', borderRadius: '50%',
                    background: 'var(--bg-card2)', color: 'var(--text-muted)',
                    fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--border)', zIndex: 1,
                  }}
                  onClick={handleClose}
                >✕</button>

                {/* 스크롤 영역 */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '22px 20px 0', scrollbarWidth: 'none' }}>
                  {/* 헤더 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '18px',
                      background: 'var(--primary-bg)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '30px',
                    }}>
                      {selectedProfile.emoji}
                    </div>
                    <div>
                      <p style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text)', marginBottom: '5px' }}>
                        {selectedProfile.nickname}
                      </p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-bg)', padding: '2px 9px', borderRadius: '7px' }}>
                          {selectedProfile.mbti}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-sub)', background: 'var(--bg-card2)', padding: '2px 9px', borderRadius: '7px' }}>
                          {selectedProfile.face}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 매력포인트 */}
                  {selectedProfile.charmPoints.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>✨ 매력포인트</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {selectedProfile.charmPoints.map(c => (
                          <span
                            key={c}
                            style={{
                              fontSize: '13px', fontWeight: 700,
                              color: 'var(--primary)', background: 'var(--primary-bg)',
                              border: '1.5px solid var(--primary-border)',
                              padding: '5px 12px', borderRadius: '20px',
                            }}
                          >
                            #{c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 정보 rows */}
                  {DETAIL_ROWS(selectedProfile).map(row => (
                    <div
                      key={row.label}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{row.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* 채팅 버튼 (고정) */}
                <div style={{ padding: '14px 20px 20px', background: 'var(--bg-card)' }}>
                  <button
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '16px',
                      fontSize: '15px',
                      fontWeight: 700,
                      color: isChatSent ? 'var(--primary)' : chatDisabled ? 'var(--text-muted)' : 'white',
                      background: isChatSent
                        ? 'var(--primary-bg)'
                        : chatDisabled
                          ? 'var(--bg-card2)'
                          : 'var(--gradient)',
                      border: isChatSent ? '1.5px solid var(--primary-border)' : '1.5px solid transparent',
                      cursor: chatDisabled ? 'not-allowed' : 'pointer',
                      boxShadow: (!isChatSent && !chatDisabled) ? '0 4px 16px rgba(255,128,171,0.35)' : 'none',
                    }}
                    onClick={handleChatRequest}
                    disabled={chatDisabled || isChatSent}
                  >
                    {isChatSent
                      ? '💌 채팅 요청 완료'
                      : !hasChance && !isChatSent
                        ? '⚡ 오늘 기회를 사용했어요'
                        : chatDisabled
                          ? '오늘 채팅 요청을 이미 보냈어요'
                          : '💬 채팅하기'}
                  </button>
                  {!isChatSent && !chatDisabled && (
                    <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                      하루에 한 명에게만 채팅을 보낼 수 있어요
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
