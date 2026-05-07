import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChance } from '../hooks/useChance';
import ChanceModal from '../components/ChanceModal';
import { useAcceptedDashes } from '../context/AcceptedDashContext';
import { RECEIVED_DASHES, DETAIL_ROWS } from '../data/dashes';
import type { DashPerson } from '../data/dashes';

export default function ReceivedDashPage() {
  const navigate = useNavigate();
  const { hasChance, spend } = useChance();
  const { acceptedDashes, addAccepted } = useAcceptedDashes();
  const [selected, setSelected] = useState<DashPerson | null>(null);
  const [showChanceModal, setShowChanceModal] = useState(false);

  const isAccepted = selected ? acceptedDashes.some(d => d.id === selected.id) : false;

  const openCard = (p: DashPerson) => setSelected(p);
  const closeCard = () => setSelected(null);

  const confirmAccept = () => {
    spend();
    if (selected) {
      addAccepted({ id: selected.id, name: selected.name, emoji: selected.emoji, requestMsg: selected.requestMsg ?? '' });
    }
    setShowChanceModal(false);
    closeCard();
    navigate('/chat');
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 40 }}>

      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 20px',
        background: 'var(--header-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: 'var(--text)', boxShadow: 'var(--shadow-sm)',
          }}
        >‹</button>
        <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>받은 대쉬</p>
        <span style={{
          marginLeft: 'auto', fontSize: 12, fontWeight: 700,
          color: 'var(--primary)', background: 'var(--primary-bg)',
          border: '1px solid var(--primary-border)', padding: '3px 10px', borderRadius: 20,
        }}>{RECEIVED_DASHES.length}개</span>
      </div>

      {/* 리스트 */}
      <div style={{ padding: '16px 20px' }}>
        {RECEIVED_DASHES.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <span style={{ fontSize: 52 }}>💌</span>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-sub)', marginTop: 14 }}>아직 받은 대쉬가 없어요</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>다른 사람이 먼저 대쉬를 보내올 거예요</p>
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-card)',
          }}>
            {RECEIVED_DASHES.map((p, i) => {
              const accepted = acceptedDashes.some(d => d.id === p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => openCard(p)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 13, padding: '16px', background: 'none',
                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
                    background: accepted
                      ? 'var(--bg-card2)'
                      : 'linear-gradient(135deg, rgba(255,128,171,0.22) 0%, rgba(255,179,204,0.12) 100%)',
                    border: `2px solid ${accepted ? 'var(--border)' : 'rgba(255,128,171,0.5)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24,
                    boxShadow: accepted ? 'var(--shadow-sm)' : 'var(--shadow-avatar-pink)',
                  }}>{p.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{p.name}</p>
                      {accepted && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: 'var(--primary)',
                          background: 'var(--primary-bg)', border: '1px solid var(--primary-border)',
                          padding: '1px 7px', borderRadius: 10,
                        }}>수락됨</span>
                      )}
                    </div>
                    <p style={{
                      fontSize: 12, color: 'var(--text-muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{p.requestMsg}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{p.sentAt}</p>
                    {!accepted && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: 'white',
                        background: 'var(--gradient)', padding: '2px 8px', borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(255,128,171,0.4)',
                      }}>NEW</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 기회 사용 확인 */}
      {showChanceModal && (
        <ChanceModal
          label="정말 오늘의 기회를 사용하시겠습니까?"
          onConfirm={confirmAccept}
          onCancel={() => setShowChanceModal(false)}
        />
      )}

      {/* 바텀시트 모달 */}
      {selected && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={closeCard}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '28px 28px 0 0',
              width: '100%', maxWidth: 520,
              maxHeight: '88vh',
              display: 'flex', flexDirection: 'column',
              animation: 'slideUpSheet 0.35s cubic-bezier(0.22,1,0.36,1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 드래그 핸들 */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 0' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
            </div>

            {/* 프로필 헤더 */}
            <div style={{ padding: '16px 20px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 68, height: 68, borderRadius: 20, flexShrink: 0,
                  background: isAccepted ? 'var(--bg-card2)' : 'var(--primary-bg)',
                  border: `2px solid ${isAccepted ? 'var(--border)' : 'var(--primary-border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34,
                }}>{selected.emoji}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{selected.name}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-bg)', padding: '3px 10px', borderRadius: 8, border: '1px solid var(--primary-border)' }}>{selected.mbti}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)', background: 'var(--bg-card2)', padding: '3px 10px', borderRadius: 8 }}>{selected.face}</span>
                  </div>
                </div>
                <button
                  style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--bg-card2)', color: 'var(--text-muted)',
                    fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--border)', alignSelf: 'flex-start',
                  }}
                  onClick={closeCard}
                >✕</button>
              </div>
            </div>

            {/* 스크롤 콘텐츠 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 8px', scrollbarWidth: 'none' }}>
              {selected.requestMsg && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>💌 보낸 메시지</p>
                  <div style={{
                    background: 'var(--primary-bg)', border: '1.5px solid var(--primary-border)',
                    borderRadius: 14, padding: '12px 14px',
                    fontSize: 14, fontWeight: 500, color: 'var(--text)', lineHeight: 1.6,
                  }}>{selected.requestMsg}</div>
                </div>
              )}

              {selected.charmPoints.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>✨ 매력포인트</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selected.charmPoints.map(c => (
                      <span key={c} style={{
                        fontSize: 13, fontWeight: 700, color: 'var(--primary)',
                        background: 'var(--primary-bg)', border: '1.5px solid var(--primary-border)',
                        padding: '5px 12px', borderRadius: 20,
                      }}>#{c}</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card2)' }}>
                {DETAIL_ROWS(selected).map((row, i) => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px',
                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div style={{ padding: '12px 20px 36px', borderTop: '1px solid var(--border)' }}>
              {isAccepted ? (
                <button style={{
                  width: '100%', padding: 14, borderRadius: 16,
                  fontSize: 15, fontWeight: 700,
                  color: 'var(--primary)', background: 'var(--primary-bg)',
                  border: '1.5px solid var(--primary-border)',
                }} disabled>💌 수락 완료</button>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button style={{
                      flex: 1, padding: 14, borderRadius: 16,
                      fontSize: 15, fontWeight: 700,
                      background: 'var(--bg-card2)', color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                    }} onClick={closeCard}>거절하기</button>
                    <button style={{
                      flex: 1, padding: 14, borderRadius: 16,
                      fontSize: 15, fontWeight: 700,
                      color: !hasChance ? 'var(--text-muted)' : 'white',
                      background: !hasChance ? 'var(--bg-card2)' : 'var(--gradient)',
                      border: '1.5px solid transparent',
                      cursor: !hasChance ? 'not-allowed' : 'pointer',
                      boxShadow: hasChance ? '0 4px 16px rgba(255,128,171,0.35)' : 'none',
                    }} disabled={!hasChance} onClick={() => hasChance && setShowChanceModal(true)}>
                      {!hasChance ? '기회 없음' : '수락하기'}
                    </button>
                  </div>
                  {hasChance && (
                    <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                      하루에 한 명에게만 수락할 수 있어요
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
