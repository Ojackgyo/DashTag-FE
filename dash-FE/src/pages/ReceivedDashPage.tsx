import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChance } from '../hooks/useChance';
import ChanceModal from '../components/ChanceModal';
import { getDatingRequests, updateDatingRequest } from '../api/home';
import { getMe } from '../api/user';
import { faceTypeToEmoji } from '../api/user';
import type { DatingRequestResponse } from '../api/home';
import type { UserProfileResponse } from '../api/user';

function DetailRows({ p }: { p: UserProfileResponse }) {
  const rows = [
    p.age != null         ? { label: '🎂 나이',        value: `${p.age}세` }                          : null,
    p.major               ? { label: '🎓 학과',        value: p.major }                               : null,
    p.height != null && p.weight != null
                          ? { label: '📏 키 / 몸무게', value: `${p.height}cm / ${p.weight}kg` }       : null,
    p.skin_tone           ? { label: '🎨 피부톤',      value: p.skin_tone }                           : null,
    p.hair_style          ? { label: '💇 헤어스타일',  value: p.hair_style }                          : null,
    p.tattoo != null      ? { label: '🖊️ 타투',       value: p.tattoo ? '있어요' : '없어요' }         : null,
    p.smoking != null     ? { label: '🚬 흡연',        value: p.smoking ? '흡연' : '비흡연' }          : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card2)' }}>
      {rows.map((row, i) => (
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
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default function ReceivedDashPage() {
  const navigate = useNavigate();
  const { hasChance, spend } = useChance();
  const [requests, setRequests] = useState<DatingRequestResponse[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [selected, setSelected] = useState<DatingRequestResponse | null>(null);
  const [showChanceModal, setShowChanceModal] = useState(false);
  const [acceptedIds, setAcceptedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    getMe().then(u => {
      setUserId(u.id);
      return getDatingRequests();
    }).then(all => {
      // Show only pending requests received by current user
      setRequests(all.filter(r => r.status === 'pending'));
    }).catch(() => {});
  }, []);

  const received = userId != null
    ? requests.filter(r => r.to_user_id === userId)
    : requests;

  const isAccepted = (r: DatingRequestResponse) => acceptedIds.has(r.id);

  const closeCard = () => setSelected(null);

  const confirmAccept = async () => {
    if (!selected) return;
    try {
      await updateDatingRequest(selected.id, 'accepted');
      spend();
      setAcceptedIds(prev => new Set([...prev, selected.id]));
      setShowChanceModal(false);
      closeCard();
      navigate('/chat');
    } catch {
      setShowChanceModal(false);
    }
  };

  const handleReject = async (r: DatingRequestResponse) => {
    try {
      await updateDatingRequest(r.id, 'rejected');
      setRequests(prev => prev.filter(req => req.id !== r.id));
    } catch { /* ignore */ }
    closeCard();
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 40 }}>

      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
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
        }}>{received.length}개</span>
      </div>

      {/* 리스트 */}
      <div style={{ padding: '16px 20px' }}>
        {received.length === 0 ? (
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
            {received.map((r, i) => {
              const from = r.from_user;
              const emoji = faceTypeToEmoji(from?.face_type);
              const accepted = isAccepted(r);
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 13, padding: '16px', background: 'none',
                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
                    background: accepted ? 'var(--bg-card2)' : 'linear-gradient(135deg, rgba(255,128,171,0.22) 0%, rgba(255,179,204,0.12) 100%)',
                    border: `2px solid ${accepted ? 'var(--border)' : 'rgba(255,128,171,0.5)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                    boxShadow: accepted ? 'var(--shadow-sm)' : 'var(--shadow-avatar-pink)',
                  }}>{emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{from?.nickname ?? '알 수 없음'}</p>
                      {accepted && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: 'var(--primary)',
                          background: 'var(--primary-bg)', border: '1px solid var(--primary-border)',
                          padding: '1px 7px', borderRadius: 10,
                        }}>수락됨</span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {from?.face_type ?? ''} {from?.mbti ? `· ${from.mbti}` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{timeAgo(r.created_at)}</p>
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
      {selected && (() => {
        const from = selected.from_user;
        const emoji = faceTypeToEmoji(from?.face_type);
        const accepted = isAccepted(selected);
        return (
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
                background: 'var(--bg-card)', borderRadius: '28px 28px 0 0',
                width: '100%', maxWidth: 520, maxHeight: '88vh',
                display: 'flex', flexDirection: 'column',
                animation: 'slideUpSheet 0.35s cubic-bezier(0.22,1,0.36,1)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 0' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
              </div>

              {/* 프로필 헤더 */}
              <div style={{ padding: '16px 20px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 68, height: 68, borderRadius: 20, flexShrink: 0,
                    background: accepted ? 'var(--bg-card2)' : 'var(--primary-bg)',
                    border: `2px solid ${accepted ? 'var(--border)' : 'var(--primary-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34,
                  }}>{emoji}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{from?.nickname ?? '알 수 없음'}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {from?.mbti && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-bg)', padding: '3px 10px', borderRadius: 8, border: '1px solid var(--primary-border)' }}>{from.mbti}</span>
                      )}
                      {from?.face_type && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)', background: 'var(--bg-card2)', padding: '3px 10px', borderRadius: 8 }}>{from.face_type}</span>
                      )}
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
                {(from?.charm_points?.length ?? 0) > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>✨ 매력포인트</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {from!.charm_points!.map(c => (
                        <span key={c} style={{
                          fontSize: 13, fontWeight: 700, color: 'var(--primary)',
                          background: 'var(--primary-bg)', border: '1.5px solid var(--primary-border)',
                          padding: '5px 12px', borderRadius: 20,
                        }}>#{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {from && <DetailRows p={from} />}
              </div>

              {/* 액션 버튼 */}
              <div style={{ padding: '12px 20px 36px', borderTop: '1px solid var(--border)' }}>
                {accepted ? (
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
                      }} onClick={() => handleReject(selected)}>거절하기</button>
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
        );
      })()}
    </div>
  );
}
