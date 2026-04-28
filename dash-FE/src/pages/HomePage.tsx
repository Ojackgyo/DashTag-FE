import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChance } from '../hooks/useChance';
import ChanceModal from '../components/ChanceModal';
import './HomePage.css';

interface DashPerson {
  id: string;
  name: string;
  emoji: string;
  mbti: string;
  face: string;
  major: string;
  age: number;
  studentId: string;
  height: number;
  weight: number;
  skinTone: string;
  hairStyle: string;
  tattoo: string;
  smoking: string;
  charmPoints: string[];
}

const RECEIVED_DASHES: DashPerson[] = [
  {
    id: 'jeff', name: 'Jeff', emoji: '🐺',
    mbti: 'INTJ', face: '늑대상', major: '컴퓨터공학과', age: 25, studentId: '19학번',
    height: 180, weight: 73, skinTone: '밝음', hairStyle: '짧은 머리', tattoo: '없어요', smoking: '비흡연',
    charmPoints: ['논리적', '운동 잘함', '과묵한 매력'],
  },
  {
    id: 'michael', name: 'Michael', emoji: '🐶',
    mbti: 'ENFP', face: '강아지상', major: '경영학과', age: 24, studentId: '20학번',
    height: 176, weight: 68, skinTone: '매우 밝음', hairStyle: '중단발', tattoo: '없어요', smoking: '비흡연',
    charmPoints: ['유머러스', '애교 많음', '추진력 있음'],
  },
];

const SENT_DASHES: DashPerson[] = [
  {
    id: 'john', name: 'John', emoji: '🐻',
    mbti: 'ISTJ', face: '곰상', major: '기계공학과', age: 26, studentId: '18학번',
    height: 178, weight: 75, skinTone: '중간', hairStyle: '스포츠 컷', tattoo: '없어요', smoking: '금연 중이에요',
    charmPoints: ['믿음직함', '요리 잘함'],
  },
];

const TODAY_SCHEDULE    = '4/30 (목) 미팅';
const UPCOMING_SCHEDULE = ['5/13 (수) 영화 모임', '5/19 (월) Michael'];

const DETAIL_ROWS = (p: DashPerson) => [
  { label: '🎂 나이',      value: `${p.age}세 (${p.studentId})` },
  { label: '🎓 학과',      value: p.major },
  { label: '📏 키 / 몸무게', value: `${p.height}cm / ${p.weight}kg` },
  { label: '🎨 피부톤',    value: p.skinTone },
  { label: '💇 헤어스타일', value: p.hairStyle },
  { label: '🖊️ 타투',     value: p.tattoo },
  { label: '🚬 흡연',      value: p.smoking },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { hasChance, spend } = useChance();
  const [selected, setSelected]         = useState<DashPerson | null>(null);
  const [flipped,  setFlipped]          = useState(false);
  const [showChanceModal, setShowChanceModal] = useState(false);
  const [acceptedIds, setAcceptedIds]   = useState<string[]>([]);

  const isReceived = selected ? RECEIVED_DASHES.some(p => p.id === selected.id) : false;
  const isAccepted = selected ? acceptedIds.includes(selected.id) : false;

  const openCard = (p: DashPerson) => {
    setFlipped(false);
    setSelected(p);
    setTimeout(() => setFlipped(true), 60);
  };

  const closeCard = () => {
    setFlipped(false);
    setTimeout(() => setSelected(null), 650);
  };

  const handleAccept = () => {
    if (!hasChance || isAccepted) return;
    setShowChanceModal(true);
  };

  const confirmAccept = () => {
    spend();
    if (selected) setAcceptedIds(prev => [...prev, selected.id]);
    setShowChanceModal(false);
  };

  return (
    <div className="home-page">
      {/* ── 오늘의 Dash ── */}
      <section className="dash-header">
        <span className="hash-label">#오늘의 Dash</span>
        <div className="dash-energy-box">
          <div className="dash-energy-card">
            <div className="dash-energy-left">
              <p className="dash-energy-label">⚡ 오늘의 기회</p>
              <p className="dash-energy-msg">
                {hasChance ? '오늘 사용할 수 있는 기회가 있어요' : '오늘의 기회를 이미 사용했어요'}
              </p>
            </div>
            <span className="dash-energy-count" style={{ color: hasChance ? 'var(--primary)' : 'var(--text-muted)' }}>
              {hasChance ? '1' : '0'}<span className="dash-energy-total">/1</span>
            </span>
          </div>
          <div className="dash-energy-track">
            <div className={`dash-energy-fill ${hasChance ? 'available' : 'spent'}`} />
          </div>
        </div>
      </section>

      {/* ── 일정 카드 ── */}
      <div className="home-card">
        <p className="hash-label">#오늘 일정</p>
        <div className="schedule-pills">
          <span className="schedule-pill today">{TODAY_SCHEDULE}</span>
        </div>
        <p className="hash-label" style={{ marginTop: 16 }}>#다가오는 일정</p>
        <div className="schedule-pills">
          {UPCOMING_SCHEDULE.map(s => (
            <span key={s} className="schedule-pill upcoming">{s}</span>
          ))}
        </div>
      </div>

      {/* ── 받은 대쉬 ── */}
      <div className="home-card received">
        <p className="hash-label">#받은 대쉬</p>
        <div className="dash-avatars">
          {RECEIVED_DASHES.map(p => (
            <button key={p.id} className="dash-avatar-btn" onClick={() => openCard(p)}>
              <div className="dash-circle received-circle">{p.emoji}</div>
              <span className="dash-name">#{p.name}</span>
            </button>
          ))}
          {RECEIVED_DASHES.length === 0 && <p className="dash-empty">아직 받은 대쉬가 없어요</p>}
        </div>
      </div>

      {/* ── 보낸 대쉬 ── */}
      <div className="home-card">
        <p className="hash-label">#보낸 대쉬</p>
        <div className="dash-avatars">
          {SENT_DASHES.map(p => (
            <button key={p.id} className="dash-avatar-btn" onClick={() => openCard(p)}>
              <div className="dash-circle sent-circle">{p.emoji}</div>
              <span className="dash-name">#{p.name}</span>
            </button>
          ))}
          {SENT_DASHES.length === 0 && <p className="dash-empty">아직 보낸 대쉬가 없어요</p>}
        </div>
      </div>

      <div className="bottom-spacer" />

      {/* ── 기회 사용 확인 팝업 ── */}
      {showChanceModal && (
        <ChanceModal
          label="정말 오늘의 기회를 사용하시겠습니까?"
          onConfirm={confirmAccept}
          onCancel={() => setShowChanceModal(false)}
        />
      )}

      {/* ── 플립 카드 모달 ── */}
      {selected && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[200] px-5"
          style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(8px)' }}
          onClick={closeCard}
        >
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
              {/* 앞면 */}
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
                <span style={{ fontSize: '90px', lineHeight: 1 }}>{selected.emoji}</span>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>{selected.face}</p>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', background: 'rgba(255,128,171,0.2)', padding: '4px 14px', borderRadius: '10px' }}>
                    {selected.mbti}
                  </span>
                </div>
              </div>

              {/* 뒷면 */}
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
                  onClick={closeCard}
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
                      {selected.emoji}
                    </div>
                    <div>
                      <p style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text)', marginBottom: '5px' }}>
                        {selected.name}
                      </p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-bg)', padding: '2px 9px', borderRadius: '7px' }}>
                          {selected.mbti}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-sub)', background: 'var(--bg-card2)', padding: '2px 9px', borderRadius: '7px' }}>
                          {selected.face}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 매력포인트 */}
                  {selected.charmPoints.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>✨ 매력포인트</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {selected.charmPoints.map(c => (
                          <span key={c} style={{
                            fontSize: '13px', fontWeight: 700,
                            color: 'var(--primary)', background: 'var(--primary-bg)',
                            border: '1.5px solid var(--primary-border)',
                            padding: '5px 12px', borderRadius: '20px',
                          }}>#{c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 정보 rows */}
                  {DETAIL_ROWS(selected).map(row => (
                    <div key={row.label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid var(--border)',
                    }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{row.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* 하단 버튼 */}
                <div style={{ padding: '14px 20px 20px', background: 'var(--bg-card)' }}>
                  {isReceived ? (
                    isAccepted ? (
                      <button style={{
                        width: '100%', padding: '14px', borderRadius: '16px',
                        fontSize: '15px', fontWeight: 700,
                        color: 'var(--primary)', background: 'var(--primary-bg)',
                        border: '1.5px solid var(--primary-border)',
                      }} disabled>
                        💌 수락 완료
                      </button>
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            style={{
                              flex: 1, padding: '14px', borderRadius: '16px',
                              fontSize: '15px', fontWeight: 700,
                              background: 'var(--bg-card2)', color: 'var(--text-muted)',
                              border: '1px solid var(--border)',
                            }}
                            onClick={closeCard}
                          >
                            거절하기
                          </button>
                          <button
                            style={{
                              flex: 1, padding: '14px', borderRadius: '16px',
                              fontSize: '15px', fontWeight: 700,
                              color: !hasChance ? 'var(--text-muted)' : 'white',
                              background: !hasChance ? 'var(--bg-card2)' : 'var(--gradient)',
                              border: '1.5px solid transparent',
                              cursor: !hasChance ? 'not-allowed' : 'pointer',
                              boxShadow: hasChance ? '0 4px 16px rgba(255,128,171,0.35)' : 'none',
                            }}
                            disabled={!hasChance}
                            onClick={handleAccept}
                          >
                            {!hasChance ? '기회 없음' : '수락하기'}
                          </button>
                        </div>
                        {hasChance && (
                          <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                            하루에 한 명에게만 수락할 수 있어요
                          </p>
                        )}
                      </>
                    )
                  ) : (
                    <button
                      style={{
                        width: '100%', padding: '14px', borderRadius: '16px',
                        fontSize: '15px', fontWeight: 700,
                        background: 'var(--gradient)', color: 'white',
                        boxShadow: '0 4px 16px rgba(255,128,171,0.35)',
                      }}
                      onClick={() => { closeCard(); navigate('/chat'); }}
                    >
                      💬 채팅 보기
                    </button>
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
