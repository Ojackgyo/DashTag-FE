import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useChance } from '../hooks/useChance';
import { useThrottle } from '../lib/hooks';
import ChanceModal from '../components/ChanceModal';
import { getDateProfiles, sendDateRequest } from '../api/date';
import { faceTypeToEmoji } from '../api/user';
import { isLoggedIn } from '../api/client';
import { queryKeys } from '../lib/queryKeys';
import type { UserProfileResponse } from '../api/user';

function detailRows(p: UserProfileResponse) {
  return [
    p.age != null         ? { label: '🎂 나이',        value: `${p.age}세` }                          : null,
    p.major               ? { label: '🎓 학과',        value: p.major }                               : null,
    p.height != null && p.weight != null
                          ? { label: '📏 키 / 몸무게', value: `${p.height}cm / ${p.weight}kg` }       : null,
    p.skin_tone           ? { label: '🎨 피부톤',      value: p.skin_tone }                           : null,
    p.hair_style          ? { label: '💇 헤어스타일',  value: p.hair_style }                          : null,
    p.tattoo != null      ? { label: '🖊️ 타투',       value: p.tattoo ? '있어요' : '없어요' }         : null,
    p.smoking != null     ? { label: '🚬 흡연',        value: p.smoking ? '흡연' : '비흡연' }          : null,
  ].filter(Boolean) as { label: string; value: string }[];
}

export default function DatePage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [chatSentId, setChatSentId] = useState<number | null>(null);
  const [showMsgSheet, setShowMsgSheet] = useState(false);
  const [showChanceModal, setShowChanceModal] = useState(false);
  const [introMsg, setIntroMsg] = useState('');
  const { hasChance, spend } = useChance();

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: queryKeys.dateProfiles,
    queryFn: getDateProfiles,
    enabled: isLoggedIn(),
    staleTime: 2 * 60 * 1000,
  });

  const { mutateAsync: doSendRequest } = useMutation({ mutationFn: (id: number) => sendDateRequest(id) });

  const selectedProfile = profiles.find(p => p.id === selectedId) ?? null;

  const handleCardClick = (id: number) => {
    setFlipped(false);
    setSelectedId(id);
    setTimeout(() => setFlipped(true), 60);
  };

  const handleClose = () => {
    setFlipped(false);
    setTimeout(() => setSelectedId(null), 650);
  };

  const handleChatRequest = () => {
    if (chatSentId !== null || !hasChance) return;
    setShowMsgSheet(true);
  };

  const confirmChat = useThrottle(async () => {
    if (!selectedId) return;
    try { await doSendRequest(selectedId); } catch { /* ignore */ }
    spend();
    setChatSentId(selectedId);
    setShowChanceModal(false);
    setShowMsgSheet(false);
    setIntroMsg('');
  }, 2000);

  const isChatSent = selectedId !== null && chatSentId === selectedId;
  const chatDisabled = (chatSentId !== null && chatSentId !== selectedId) || (!hasChance && chatSentId === null);

  return (
    <div className="px-[18px] pb-6">
      <div className="pt-6 pb-[18px]">
        <h1 className="text-[clamp(20px,6vw,24px)] font-extrabold tracking-tight mb-1" style={{ color: 'var(--text)' }}>
          1대1 소개팅 💘
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-sub)' }}>나랑 꼭 맞는 한 사람을 만나보세요</p>
      </div>

      {profilesLoading ? (
        <div className="flex flex-col items-center py-16 gap-2.5">
          <span className="text-[52px]">💘</span>
          <p className="text-[16px] font-bold" style={{ color: 'var(--text-sub)' }}>불러오는 중이에요...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2.5">
          <span className="text-[52px]" style={{ animation: 'float 2.8s ease-in-out infinite' }}>💘</span>
          <p className="text-[16px] font-bold" style={{ color: 'var(--text-sub)' }}>아직 소개팅 프로필이 없어요</p>
          <p className="text-[13px] text-center" style={{ color: 'var(--text-muted)' }}>프로필을 완성하면 여기에 상대방이 표시돼요</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {profiles.map((p, idx) => {
            const emoji = faceTypeToEmoji(p.face_type);
            const col = idx % 2;
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
                <span style={{ fontSize: '48px', lineHeight: 1 }}>{emoji}</span>
                <p className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{p.nickname}</p>
                {p.mbti && (
                  <span
                    className="text-[11px] font-bold px-2 py-[2px] rounded-[7px]"
                    style={{ color: 'var(--primary)', background: 'rgba(255,128,171,0.18)' }}
                  >
                    {p.mbti}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 한 줄 메시지 바텀시트 */}
      {showMsgSheet && selectedProfile && (
        <div
          className="fixed inset-0 z-[250] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowMsgSheet(false)}
        >
          <div
            className="w-full max-w-[390px] rounded-[28px_28px_0_0] px-5 pt-5 pb-10"
            style={{ background: 'var(--bg-card)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--border)' }} />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-[44px] h-[44px] rounded-[14px] flex items-center justify-center text-[22px]" style={{ background: 'var(--primary-bg)' }}>
                {faceTypeToEmoji(selectedProfile.face_type)}
              </div>
              <div>
                <p className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>{selectedProfile.nickname}에게 첫 인사를</p>
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>한 줄로 남겨보세요</p>
              </div>
            </div>
            <input
              className="w-full rounded-[14px] px-4 py-3.5 text-[14px] border mb-3"
              style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              placeholder="ex. 안녕하세요! 프로필 보고 연락했어요 😊"
              maxLength={50}
              value={introMsg}
              onChange={e => setIntroMsg(e.target.value)}
              autoFocus
            />
            <p className="text-right text-[11px] mb-4" style={{ color: 'var(--text-muted)' }}>{introMsg.length}/50</p>
            <button
              className="w-full py-[14px] rounded-[16px] text-[15px] font-bold text-white active:opacity-80"
              style={introMsg.trim()
                ? { background: 'var(--gradient)', boxShadow: '0 4px 14px rgba(255,128,171,0.35)' }
                : { background: 'var(--bg-card2)', color: 'var(--text-muted)' }
              }
              disabled={!introMsg.trim()}
              onClick={() => { setShowMsgSheet(false); setShowChanceModal(true); }}
            >
              보내기 💌
            </button>
          </div>
        </div>
      )}

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
        <div className="fixed inset-0 z-[200]" onClick={handleClose}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(8px)' }} />

          <div
            className="absolute inset-0 flex items-center justify-center px-5"
            onClick={e => e.stopPropagation()}
          >
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px', height: '520px' }}>

              {/* 앞면 */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  borderRadius: '28px',
                  background: 'var(--bg-card)',
                  border: '2px solid var(--primary-border)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
                  transition: flipped ? 'transform 0.3s ease-in' : 'transform 0.3s ease-out 0.3s',
                  transform: flipped ? 'perspective(1200px) rotateY(90deg)' : 'perspective(1200px) rotateY(0deg)',
                  pointerEvents: flipped ? 'none' : 'auto',
                }}
              >
                <span style={{ fontSize: '90px', lineHeight: 1 }}>{faceTypeToEmoji(selectedProfile.face_type)}</span>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>{selectedProfile.face_type ?? '미설정'}</p>
                  {selectedProfile.mbti && (
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', background: 'rgba(255,128,171,0.2)', padding: '4px 14px', borderRadius: '10px' }}>
                      {selectedProfile.mbti}
                    </span>
                  )}
                </div>
              </div>

              {/* 뒷면 */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  borderRadius: '28px',
                  background: 'var(--bg-card)',
                  border: '2px solid var(--primary-border)',
                  display: 'flex', flexDirection: 'column', overflow: 'hidden',
                  transition: flipped ? 'transform 0.3s ease-out 0.3s' : 'transform 0.3s ease-in',
                  transform: flipped ? 'perspective(1200px) rotateY(0deg)' : 'perspective(1200px) rotateY(-90deg)',
                  pointerEvents: flipped ? 'auto' : 'none',
                }}
              >
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

                <div style={{ flex: 1, overflowY: 'auto', padding: '22px 20px 0', scrollbarWidth: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '18px',
                      background: 'var(--primary-bg)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px',
                    }}>
                      {faceTypeToEmoji(selectedProfile.face_type)}
                    </div>
                    <div>
                      <p style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text)', marginBottom: '5px' }}>
                        {selectedProfile.nickname}
                      </p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {selectedProfile.mbti && (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-bg)', padding: '2px 9px', borderRadius: '7px' }}>
                            {selectedProfile.mbti}
                          </span>
                        )}
                        {selectedProfile.face_type && (
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-sub)', background: 'var(--bg-card2)', padding: '2px 9px', borderRadius: '7px' }}>
                            {selectedProfile.face_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {(selectedProfile.charm_points?.length ?? 0) > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>✨ 매력포인트</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {selectedProfile.charm_points!.map(c => (
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

                  {detailRows(selectedProfile).map(row => (
                    <div
                      key={row.label}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 0', borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{row.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '14px 20px 20px', background: 'var(--bg-card)' }}>
                  <button
                    style={{
                      width: '100%', padding: '14px', borderRadius: '16px',
                      fontSize: '15px', fontWeight: 700,
                      color: isChatSent ? 'var(--primary)' : chatDisabled ? 'var(--text-muted)' : 'white',
                      background: isChatSent
                        ? 'var(--primary-bg)'
                        : chatDisabled ? 'var(--bg-card2)' : 'var(--gradient)',
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
                          : '💬 대화 신청하기'}
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
