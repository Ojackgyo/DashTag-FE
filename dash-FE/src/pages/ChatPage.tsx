import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getChatRooms, getChatMessages, sendMessage as apiSendMessage, createChatSocket, setSchedule, reportRoom } from '../api/chat';
import { getMe } from '../api/user';
import type { ChatRoomResponse, MessageResponse } from '../api/chat';

interface OpenRoomState {
  type: string;
  relatedId?: number;
}

type Category = '소개팅' | '미팅' | '소모임';

function roomCategory(type: string): Category {
  if (type === 'dating') return '소개팅';
  if (type === 'meeting') return '미팅';
  if (type === 'community') return '소모임';
  return '소개팅';
}

const DAYS_KR = ['일', '월', '화', '수', '목', '금', '토'];
const TIMES = ['오전 10시', '오전 11시', '오후 12시', '오후 1시', '오후 2시', '오후 3시', '오후 4시', '오후 5시', '오후 6시', '오후 7시', '오후 8시', '오후 9시'];

function parseTimeToHour(time: string): number {
  const isPM = time.startsWith('오후');
  const match = time.match(/(\d+)시/);
  if (!match) return 15;
  let h = parseInt(match[1]);
  if (isPM && h !== 12) h += 12;
  if (!isPM && h === 12) h = 0;
  return h;
}

function getSelectableDates() {
  const today = new Date();
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    const day = DAYS_KR[d.getDay()];
    return {
      key: `${mm}/${dd}`,
      label: i === 0 ? '오늘' : i === 1 ? '내일' : `${mm}/${dd}`,
      full: `${mm}월 ${dd}일 (${day})`,
      dateObj: d,
    };
  });
}

function toISOSchedule(dateOffset: number, time: string): string {
  const d = new Date();
  d.setDate(d.getDate() + dateOffset);
  d.setHours(parseTimeToHour(time), 0, 0, 0);
  return d.toISOString();
}

/* ── 날짜 모달 ── */
function DateModal({ roomId, onConfirm, onClose }: { roomId: number; onConfirm: (label: string) => void; onClose: () => void }) {
  const dates = getSelectableDates();
  const [activeDateIdx, setActiveDateIdx] = useState(0);
  const [selectedTime, setSelectedTime] = useState('오후 3시');

  const handleConfirm = async () => {
    const label = `${dates[activeDateIdx].full} ${selectedTime}`;
    try {
      await setSchedule(roomId, toISOSchedule(activeDateIdx, selectedTime));
    } catch { /* ignore */ }
    onConfirm(label);
  };

  return (
    <div className="fixed inset-0 bg-black/55 flex items-end justify-center z-[300]" onClick={onClose}>
      <div
        className="rounded-[28px_28px_0_0] px-5 pt-6 pb-9 w-full max-w-[390px] max-h-[80vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ background: 'var(--bg-card)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <span className="text-[17px] font-extrabold" style={{ color: 'var(--text)' }}>📅 만나는 날 정하기</span>
          <button className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px]" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }} onClick={onClose}>✕</button>
        </div>

        <p className="text-[13px] font-bold mb-2.5" style={{ color: 'var(--text-sub)' }}>날짜</p>
        <div className="flex gap-[7px] overflow-x-auto pb-1 mb-[18px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {dates.map((d, i) => (
            <button
              key={d.key}
              className="text-[13px] font-semibold px-3.5 py-[9px] rounded-[14px] whitespace-nowrap shrink-0 min-h-[38px] border"
              style={activeDateIdx === i
                ? { background: 'var(--gradient)', borderColor: 'transparent', color: 'white', fontWeight: 700 }
                : { background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text-sub)' }
              }
              onClick={() => setActiveDateIdx(i)}
            >
              {d.label}
            </button>
          ))}
        </div>

        <p className="text-[13px] font-bold mb-2.5" style={{ color: 'var(--text-sub)' }}>시간</p>
        <div className="grid grid-cols-4 gap-[7px] mb-5">
          {TIMES.map(t => (
            <button
              key={t}
              className="text-[11px] font-semibold py-[9px] px-1 rounded-[12px] text-center border"
              style={selectedTime === t
                ? { background: 'var(--primary-bg)', borderColor: 'var(--primary-border)', color: 'var(--primary)', fontWeight: 700 }
                : { background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text-sub)' }
              }
              onClick={() => setSelectedTime(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 rounded-[14px] px-4 py-[13px] mb-3.5" style={{ background: 'var(--bg-card2)' }}>
          <span className="text-[18px]">📍</span>
          <span className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>{dates[activeDateIdx].full} {selectedTime}</span>
        </div>

        <button
          className="w-full text-[15px] font-bold py-[15px] rounded-[16px] min-h-[52px] text-white active:opacity-80"
          style={{ background: 'var(--gradient)', boxShadow: '0 4px 16px rgba(255,128,171,0.35)' }}
          onClick={handleConfirm}
        >
          약속 잡기
        </button>
      </div>
    </div>
  );
}

/* ── 신고 모달 ── */
const REPORT_REASONS = ['욕설 / 비하', '부적절한 내용', '스팸 / 광고', '사기 의심', '기타'];

function ReportModal({ roomId, roomName, reportedUserId, onClose }: { roomId: number; roomName: string; reportedUserId: number; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    try {
      await reportRoom(roomId, reportedUserId, reason, detail || undefined);
    } catch { /* ignore */ }
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 flex items-end justify-center z-[300]"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-[28px_28px_0_0] px-5 pt-6 pb-9 w-full max-w-[390px] max-h-[88vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ background: 'var(--bg-card)' }}
        onClick={e => e.stopPropagation()}
      >
        {submitted ? (
          <div className="flex flex-col items-center py-10 gap-4">
            <span style={{ fontSize: 56 }}>✅</span>
            <p className="text-[18px] font-extrabold" style={{ color: 'var(--text)' }}>신고가 접수됐어요</p>
            <p className="text-[13px] text-center" style={{ color: 'var(--text-muted)' }}>
              검토 후 적절한 조치를 취하겠습니다.<br />불편을 드려서 죄송해요.
            </p>
            <button
              className="w-full py-[15px] rounded-[16px] font-bold text-[15px] text-white mt-2"
              style={{ background: 'var(--gradient)' }}
              onClick={onClose}
            >확인</button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[17px] font-extrabold" style={{ color: 'var(--text)' }}>🚨 신고하기</span>
              <button
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] border"
                style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}
                onClick={onClose}
              >✕</button>
            </div>
            <p className="text-[13px] mb-5" style={{ color: 'var(--text-muted)' }}>
              "{roomName}" 신고 이유를 선택해주세요.
            </p>
            <div className="flex flex-col gap-2 mb-4">
              {REPORT_REASONS.map(r => (
                <button
                  key={r}
                  className="flex items-center gap-3 p-[14px] rounded-[14px] border text-left active:opacity-75"
                  style={reason === r
                    ? { background: 'rgba(255,60,60,0.08)', borderColor: 'rgba(255,60,60,0.35)' }
                    : { background: 'var(--bg-card2)', borderColor: 'var(--border)' }
                  }
                  onClick={() => setReason(r)}
                >
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: reason === r ? '#FF3C3C' : 'var(--text-muted)' }}
                  >
                    {reason === r && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF3C3C' }} />}
                  </div>
                  <span
                    className="text-[14px]"
                    style={{ fontWeight: reason === r ? 700 : 500, color: reason === r ? '#FF3C3C' : 'var(--text)' }}
                  >{r}</span>
                </button>
              ))}
            </div>
            {reason && (
              <textarea
                className="w-full rounded-[14px] px-4 py-3 text-[13px] border mb-4 resize-none"
                rows={3}
                placeholder="자세한 내용을 입력해주세요 (선택)"
                value={detail}
                onChange={e => setDetail(e.target.value)}
                style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            )}
            <button
              className="w-full py-[15px] rounded-[16px] font-bold text-[15px] active:opacity-80"
              style={{
                background: reason ? '#FF3C3C' : 'var(--bg-card2)',
                color: reason ? 'white' : 'var(--text-muted)',
                boxShadow: reason ? '0 4px 14px rgba(255,60,60,0.3)' : 'none',
              }}
              disabled={!reason}
              onClick={handleSubmit}
            >신고 제출</button>
          </>
        )}
      </div>
    </div>
  );
}

const POLL_INTERVAL = 5000;

/* 날짜 설정 권한:
 * - 소개팅: 둘 다 가능
 * - 미팅/소모임: creator만 가능 (creator_id가 없으면 허용) */
function canSetDate(room: ChatRoomResponse, userId: number): boolean {
  if (room.room_type === 'dating') return true;
  if (room.creator_id == null) return true; // 백엔드 미지원 시 허용
  return room.creator_id === userId;
}

/* ── 채팅방 뷰 ── */
function ChatRoomView({ room, userId, onBack }: { room: ChatRoomResponse; userId: number; onBack: () => void }) {
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [input, setInput] = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string | null>(() => {
    if (!room.scheduled_at) return null;
    const d = new Date(room.scheduled_at);
    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    const dayStr = DAYS_KR[d.getDay()];
    const h = d.getHours();
    const isPM = h >= 12;
    const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${mm}월 ${dd}일 (${dayStr}) ${isPM ? '오후' : '오전'} ${displayH}시`;
  });
  const [showReport, setShowReport] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const wsLiveRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const mergeMessages = (incoming: MessageResponse[]) => {
    setMessages(prev => {
      const ids = new Set(prev.map(m => m.id));
      const fresh = incoming.filter(m => !ids.has(m.id));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
  };

  useEffect(() => {
    // 초기 메시지 로드
    getChatMessages(room.id).then(setMessages).catch(() => {});

    // 폴링 즉시 시작 (WS 연결 여부와 무관하게 백그라운드 갱신 보장)
    pollRef.current = setInterval(() => {
      getChatMessages(room.id).then(mergeMessages).catch(() => {});
    }, POLL_INTERVAL);

    // WebSocket 추가 시도 — 연결되면 폴링 중단, 끊기면 폴링 재시작
    const ws = createChatSocket(room.id);
    wsRef.current = ws;

    ws.onopen = () => {
      wsLiveRef.current = true;
      clearInterval(pollRef.current);
      pollRef.current = undefined;
    };

    ws.onmessage = (event) => {
      try {
        const msg: MessageResponse = JSON.parse(event.data);
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      } catch { /* ignore */ }
    };

    ws.onerror = () => { wsLiveRef.current = false; };
    ws.onclose = () => {
      wsLiveRef.current = false;
      if (!pollRef.current) {
        pollRef.current = setInterval(() => {
          getChatMessages(room.id).then(mergeMessages).catch(() => {});
        }, POLL_INTERVAL);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      clearInterval(pollRef.current);
      pollRef.current = undefined;
    };
  }, [room.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ content: text }));
      const optimistic: MessageResponse = {
        id: Date.now(),
        room_id: room.id,
        sender_id: userId,
        content: text,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimistic]);
    } else {
      // REST fallback
      const optimistic: MessageResponse = {
        id: Date.now(),
        room_id: room.id,
        sender_id: userId,
        content: text,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimistic]);
      try {
        const sent = await apiSendMessage(room.id, text);
        setMessages(prev => prev.map(m => m.id === optimistic.id ? sent : m));
      } catch { /* keep optimistic */ }
    }
  };

  const handleConfirmDate = (label: string) => {
    setScheduledDate(label);
    setShowDateModal(false);
  };

  const reportedUserId = messages.find(m => m.sender_id !== userId)?.sender_id ?? 0;
  const allowSetDate = canSetDate(room, userId);
  const isGroup = room.room_type === 'meeting' || room.room_type === 'community';

  // sender_id → 닉네임 캐시 (sender_nickname 필드 있으면 그걸로, 없으면 ID 축약)
  const nicknameOf = (msg: MessageResponse): string => {
    if (msg.sender_nickname) return msg.sender_nickname;
    return `#${msg.sender_id}`;
  };

  const formatMsgTime = (iso: string) => {
    const d = new Date(iso);
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h >= 12 ? '오후' : '오전'} ${h > 12 ? h - 12 : h || 12}:${m}`;
  };

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 54px - 50px)', position: 'relative' }}>
      {/* 로고 워터마크 */}
      <img src="/logo.svg" alt="" aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 180, opacity: 0.08, pointerEvents: 'none', userSelect: 'none', zIndex: 0 }} />

      {/* 헤더 */}
      <div className="flex items-center gap-2.5 px-[18px] py-3 shrink-0 border-b" style={{ background: 'var(--header-bg)', backdropFilter: 'blur(16px)', borderColor: 'var(--border)' }}>
        <button className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[16px] font-semibold shrink-0 border" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text-sub)' }} onClick={onBack}>←</button>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold truncate" style={{ color: 'var(--text)' }}>
            {room.emoji ? `${room.emoji} ` : ''}{room.name ?? `${roomCategory(room.room_type)} #${room.id}`}
          </p>
        </div>
        {allowSetDate && (
          <button
            className="text-[11px] font-bold px-2.5 py-1.5 rounded-[10px] border shrink-0 whitespace-nowrap active:opacity-75"
            style={{ background: 'var(--primary-bg)', borderColor: 'var(--primary-border)', color: 'var(--primary)' }}
            onClick={() => setShowDateModal(true)}
          >
            📅 날짜 정하기
          </button>
        )}
        <button
          className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[15px] border shrink-0 active:opacity-75"
          style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          onClick={() => setShowReport(true)}
          title="신고하기"
        >🚨</button>
      </div>

      {/* 약속 배너 */}
      {scheduledDate && (
        <button
          className="flex items-center gap-2.5 px-[18px] py-2.5 border-b w-full text-left shrink-0 active:opacity-75"
          style={{ background: 'var(--primary-bg)', borderColor: 'var(--primary-border)' }}
          onClick={allowSetDate ? () => setShowDateModal(true) : undefined}
        >
          <span className="text-[18px]">📍</span>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.3px]" style={{ color: 'var(--primary)' }}>약속 날짜</p>
            <p className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>{scheduledDate}</p>
          </div>
          {allowSetDate && <span className="text-[11px] font-semibold" style={{ color: 'var(--primary)' }}>수정</span>}
        </button>
      )}

      {/* 메시지 */}
      <div className="flex-1 overflow-y-auto px-[18px] py-4 flex flex-col gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ position: 'relative', zIndex: 1 }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <span className="text-[40px]">💬</span>
            <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>첫 메시지를 보내보세요!</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const mine = msg.sender_id === userId;
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const showSender = !mine && (isGroup || room.room_type === 'dating') && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
          return (
            <div key={msg.id} className={`flex flex-col max-w-[78%] gap-[3px] ${mine ? 'self-end items-end' : 'self-start items-start'}`}>
              {showSender && (
                <span className="text-[11px] font-semibold px-1" style={{ color: 'var(--text-sub)' }}>
                  {nicknameOf(msg)}
                </span>
              )}
              <div
                className="px-[14px] py-2.5 text-[14px] leading-relaxed break-words"
                style={{
                  borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  ...(mine
                    ? { background: 'var(--gradient)', color: 'white' }
                    : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }
                  ),
                }}
              >
                {msg.content}
              </div>
              <span className="text-[10px] px-0.5" style={{ color: 'var(--text-muted)' }}>{formatMsgTime(msg.created_at)}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="flex items-center gap-2 px-[18px] py-2.5 pb-3.5 border-t shrink-0" style={{ background: 'var(--gnb-bg)', borderColor: 'var(--border)' }}>
        {allowSetDate && (
          <button className="w-10 h-10 rounded-[12px] flex items-center justify-center text-[18px] border shrink-0 active:opacity-70" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)' }} onClick={() => setShowDateModal(true)} title="날짜 정하기">📅</button>
        )}
        <input
          className="flex-1 rounded-[20px] px-4 py-2.5 text-[14px] border min-w-0"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}
          placeholder="메시지 입력..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSend(); }}
        />
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center text-[18px] font-bold shrink-0"
          style={input.trim() ? { background: 'var(--gradient)', color: 'white' } : { background: 'var(--bg-card2)', color: 'var(--text-muted)' }}
          onClick={handleSend}
          disabled={!input.trim()}
        >↑</button>
      </div>

      {showDateModal && allowSetDate && <DateModal roomId={room.id} onConfirm={handleConfirmDate} onClose={() => setShowDateModal(false)} />}
      {showReport && <ReportModal roomId={room.id} roomName={`${roomCategory(room.room_type)} #${room.id}`} reportedUserId={reportedUserId} onClose={() => setShowReport(false)} />}
    </div>
  );
}

/* ── 채팅 목록 ── */
const CATEGORIES: Category[] = ['소개팅', '미팅', '소모임'];
const CATEGORY_EMOJI: Record<Category, string> = { 소개팅: '💘', 미팅: '🎉', 소모임: '🌟' };
const CATEGORY_EMPTY: Record<Category, string> = { 소개팅: '소개팅 매칭이 되면 채팅이 열려요', 미팅: '미팅에 참여하면 채팅이 열려요', 소모임: '소모임에 가입하면 채팅이 열려요' };

function formatRoomTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const openRoomState = (location.state as { openRoom?: OpenRoomState } | null)?.openRoom;

  const [rooms, setRooms] = useState<ChatRoomResponse[]>([]);
  const [userId, setUserId] = useState<number>(0);
  const [category, setCategory] = useState<Category>('소개팅');
  const [activeRoom, setActiveRoom] = useState<ChatRoomResponse | null>(null);

  useEffect(() => {
    getMe().then(u => setUserId(u.id)).catch(() => {});
    getChatRooms().then(loaded => {
      setRooms(loaded);
      if (openRoomState) {
        const match = loaded.find(r => {
          if (r.room_type !== openRoomState.type) return false;
          if (openRoomState.relatedId != null) return r.related_id === openRoomState.relatedId;
          return true;
        }) ?? loaded.filter(r => r.room_type === openRoomState.type).sort((a, b) =>
          new Date(b.last_message_at ?? b.created_at).getTime() - new Date(a.last_message_at ?? a.created_at).getTime()
        )[0];
        if (match) {
          setActiveRoom(match);
          setCategory(roomCategory(match.room_type));
        } else {
          const typeMap: Record<string, Category> = { dating: '소개팅', meeting: '미팅', community: '소모임' };
          const cat = typeMap[openRoomState.type];
          if (cat) setCategory(cat);
        }
      }
    }).catch(() => {});
  }, []);

  if (activeRoom) return <ChatRoomView room={activeRoom} userId={userId} onBack={() => setActiveRoom(null)} />;

  const filtered = rooms.filter(r => roomCategory(r.room_type) === category);

  return (
    <div className="px-[18px] pb-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2.5 pt-[22px] pb-4">
        <button className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[16px] font-semibold border" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text-sub)' }} onClick={() => navigate(-1)}>←</button>
        <h1 className="text-[22px] font-extrabold" style={{ color: 'var(--text)' }}>채팅</h1>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 mb-4">
        {CATEGORIES.map(c => (
          <button
            key={c}
            className="flex-1 flex flex-col items-center gap-1 py-3 rounded-[16px] text-[12px] font-semibold border-[1.5px]"
            style={category === c
              ? { background: 'var(--primary-bg)', borderColor: 'var(--primary-border)', color: 'var(--primary)', fontWeight: 700 }
              : { background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-sub)' }
            }
            onClick={() => setCategory(c)}
          >
            <span className="text-[22px]">{CATEGORY_EMOJI[c]}</span>
            <span>{c}</span>
          </button>
        ))}
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2.5">
          <span className="text-[52px]" style={{ animation: 'float 2.8s ease-in-out infinite' }}>{CATEGORY_EMOJI[category]}</span>
          <p className="text-[16px] font-bold" style={{ color: 'var(--text-sub)' }}>아직 채팅방이 없어요</p>
          <p className="text-[13px] text-center" style={{ color: 'var(--text-muted)' }}>{CATEGORY_EMPTY[category]}</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {filtered.map(room => (
            <button key={room.id} className="flex items-center gap-[13px] py-3.5 border-b w-full text-left active:opacity-75" style={{ borderColor: 'var(--border)' }} onClick={() => setActiveRoom(room)}>
              <div
                className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center text-[24px] shrink-0"
                style={{ background: 'var(--bg-card2)' }}
              >{room.emoji ?? CATEGORY_EMOJI[roomCategory(room.room_type)]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <span className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>{room.name ?? `${roomCategory(room.room_type)} #${room.id}`}</span>
                  <span className="text-[11px] shrink-0 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{formatRoomTime(room.last_message_at ?? room.created_at)}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[13px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {room.last_message ?? '새 채팅방'}
                  </span>
                  {(room.unread_count ?? 0) > 0 && (
                    <span className="text-[10px] font-bold min-w-5 h-5 rounded-full flex items-center justify-center px-1.5 text-white shrink-0" style={{ background: 'var(--primary)' }}>{room.unread_count}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
