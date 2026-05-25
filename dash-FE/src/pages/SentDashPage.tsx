import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMe } from '../hooks/useMe';
import { useDatingRequests } from '../hooks/useDatingRequests';
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

function statusLabel(status: string): string {
  if (status === 'accepted') return '수락됨';
  if (status === 'rejected') return '거절됨';
  return '대기 중';
}

export default function SentDashPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<DatingRequestResponse | null>(null);
  const [flipped, setFlipped] = useState(false);

  const { data: me } = useMe();
  const { data: allRequests = [] } = useDatingRequests();
  const sent = allRequests.filter(r => r.from_user_id === me?.id);

  const openCard = (r: DatingRequestResponse) => {
    setFlipped(false);
    setSelected(r);
    setTimeout(() => setFlipped(true), 60);
  };

  const closeCard = () => {
    setFlipped(false);
    setTimeout(() => setSelected(null), 650);
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
        <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>보낸 대쉬</p>
        <span style={{
          marginLeft: 'auto', fontSize: 12, fontWeight: 700,
          color: 'var(--text-sub)', background: 'var(--bg-card2)',
          border: '1px solid var(--border)', padding: '3px 10px', borderRadius: 20,
        }}>{sent.length}개</span>
      </div>

      {/* 리스트 */}
      <div style={{ padding: '16px 20px' }}>
        {sent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <span style={{ fontSize: 52 }}>📤</span>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-sub)', marginTop: 14 }}>아직 보낸 대쉬가 없어요</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>마음에 드는 사람에게 먼저 대쉬를 보내보세요</p>
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-card)',
          }}>
            {sent.map((r, i) => {
              const to = r.to_user;
              const emoji = faceTypeToEmoji(to?.face_type);
              const status = r.status;
              return (
                <button
                  key={r.id}
                  onClick={() => openCard(r)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 13, padding: '16px', background: 'none',
                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--bg-card2)', border: '2px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, boxShadow: 'var(--shadow-sm)',
                  }}>{emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{to?.nickname ?? '알 수 없음'}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: status === 'accepted' ? '#48c774' : status === 'rejected' ? '#FF6B6B' : '#F5A623',
                        flexShrink: 0,
                      }} />
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {status === 'pending' ? '대기 중 · 응답을 기다리고 있어요' : statusLabel(status)}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{timeAgo(r.created_at)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 플립 카드 모달 */}
      {selected && (() => {
        const to = selected.to_user;
        const emoji = faceTypeToEmoji(to?.face_type);
        return (
          <div
            className="fixed inset-0 flex items-center justify-center z-[200] px-5"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)' }}
            onClick={closeCard}
          >
            <div
              style={{ perspective: '1200px', width: '100%', maxWidth: '340px' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{
                position: 'relative', height: '520px',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.5))',
              }}>
                {/* 앞면 */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  borderRadius: 28, background: 'var(--bg-card2)',
                  border: '2px solid var(--border)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
                }}>
                  <span style={{ fontSize: 90, lineHeight: 1 }}>{emoji}</span>
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{to?.face_type ?? '미설정'}</p>
                    {to?.mbti && (
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-sub)', background: 'var(--bg-card)', padding: '4px 14px', borderRadius: 10 }}>
                        {to.mbti}
                      </span>
                    )}
                  </div>
                </div>

                {/* 뒷면 */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)', borderRadius: 28,
                  background: 'var(--bg-card)', border: '2px solid var(--border)',
                  display: 'flex', flexDirection: 'column', overflow: 'hidden',
                }}>
                  <button style={{
                    position: 'absolute', top: 14, right: 14,
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'var(--bg-card2)', color: 'var(--text-muted)',
                    fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--border)', zIndex: 1,
                  }} onClick={closeCard}>✕</button>

                  <div style={{ flex: 1, overflowY: 'auto', padding: '22px 20px 0', scrollbarWidth: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                      <div style={{
                        width: 60, height: 60, borderRadius: 18,
                        background: 'var(--bg-card2)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
                      }}>{emoji}</div>
                      <div>
                        <p style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)', marginBottom: 5 }}>{to?.nickname ?? '알 수 없음'}</p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {to?.mbti && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)', background: 'var(--bg-card2)', padding: '2px 9px', borderRadius: 7 }}>{to.mbti}</span>}
                          {to?.face_type && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-sub)', background: 'var(--bg-card2)', padding: '2px 9px', borderRadius: 7 }}>{to.face_type}</span>}
                        </div>
                      </div>
                    </div>

                    {/* 상태 배너 */}
                    <div style={{
                      background: selected.status === 'accepted' ? 'rgba(72,199,116,0.1)' : selected.status === 'rejected' ? 'rgba(255,107,107,0.1)' : 'rgba(245,166,35,0.1)',
                      border: `1.5px solid ${selected.status === 'accepted' ? 'rgba(72,199,116,0.3)' : selected.status === 'rejected' ? 'rgba(255,107,107,0.3)' : 'rgba(245,166,35,0.3)'}`,
                      borderRadius: 14, padding: '12px 14px', marginBottom: 14,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{ fontSize: 16 }}>{selected.status === 'accepted' ? '✅' : selected.status === 'rejected' ? '❌' : '⏳'}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: selected.status === 'accepted' ? '#48c774' : selected.status === 'rejected' ? '#FF6B6B' : '#F5A623' }}>
                          {selected.status === 'accepted' ? '수락됨' : selected.status === 'rejected' ? '거절됨' : '응답 대기 중'}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                          {selected.status === 'pending' ? '상대방이 아직 확인하지 않았어요' : ''}
                        </p>
                      </div>
                    </div>

                    {(to?.charm_points?.length ?? 0) > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>✨ 매력포인트</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {to!.charm_points!.map(c => (
                            <span key={c} style={{
                              fontSize: 13, fontWeight: 700, color: 'var(--text-sub)',
                              background: 'var(--bg-card2)', border: '1.5px solid var(--border)',
                              padding: '5px 12px', borderRadius: 20,
                            }}>#{c}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {to && <DetailRows p={to} />}
                  </div>

                  <div style={{ padding: '14px 20px 20px', background: 'var(--bg-card)' }}>
                    <button style={{
                      width: '100%', padding: 14, borderRadius: 16,
                      fontSize: 15, fontWeight: 700,
                      background: 'var(--bg-card2)', color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                    }} onClick={closeCard}>닫기</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
