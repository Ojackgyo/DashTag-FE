import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type Category = '소개팅' | '미팅' | '소모임';

interface ChatRoom {
  id: string;
  category: Category;
  name: string;
  emoji: string;
  lastMsg: string;
  time: string;
  unread: number;
  members?: number;
}

interface Message {
  id: number;
  text: string;
  mine: boolean;
  time: string;
  type?: 'date-confirm';
  dateValue?: string;
}

const ROOMS: ChatRoom[] = [
  { id: 'd1', category: '소개팅', name: '여우상 매칭', emoji: '🦊', lastMsg: '안녕하세요 💘', time: '방금', unread: 2 },
  { id: 'd2', category: '소개팅', name: '고양이상 매칭', emoji: '🐱', lastMsg: '언제 만날까요?', time: '5분 전', unread: 0 },
  { id: 'm1', category: '미팅', name: '4/20 카페 미팅', emoji: '☕', lastMsg: '몇 시에 만나요?', time: '10분 전', unread: 3, members: 4 },
  { id: 'm2', category: '미팅', name: '랜덤 미팅방 #2', emoji: '🎲', lastMsg: '기대되네요!', time: '어제', unread: 0, members: 6 },
  { id: 'c1', category: '소모임', name: '공대생 독서 모임', emoji: '📚', lastMsg: '이번 달 책 정했어요', time: '30분 전', unread: 1, members: 4 },
  { id: 'c2', category: '소모임', name: '홍대 버스킹 감상단', emoji: '🎸', lastMsg: '금요일 7시!', time: '2시간 전', unread: 0, members: 5 },
];

const DUMMY_MESSAGES: Record<string, Message[]> = {
  d1: [
    { id: 1, text: '안녕하세요! 매칭됐네요 😊', mine: false, time: '오후 2:10' },
    { id: 2, text: '안녕하세요! 반가워요 💘', mine: true, time: '오후 2:11' },
    { id: 3, text: '프로필 보니까 경영학과 다니시나봐요', mine: false, time: '오후 2:12' },
    { id: 4, text: '네 맞아요~ 혹시 언제 한번 만날까요?', mine: true, time: '오후 2:14' },
  ],
  d2: [{ id: 1, text: '안녕하세요 :)', mine: false, time: '오후 1:00' }, { id: 2, text: '언제 만날까요?', mine: false, time: '오후 1:01' }],
  m1: [{ id: 1, text: '안녕하세요 다들~', mine: false, time: '오후 3:00' }, { id: 2, text: '반갑습니다!', mine: true, time: '오후 3:01' }, { id: 3, text: '몇 시에 만나요?', mine: false, time: '오후 3:02' }],
  m2: [{ id: 1, text: '기대되네요!', mine: false, time: '어제 오후 8:00' }],
  c1: [{ id: 1, text: '이번 달 책 정했어요 — 「채식주의자」', mine: false, time: '오후 4:20' }, { id: 2, text: '오! 좋은 선택이에요', mine: true, time: '오후 4:22' }],
  c2: [{ id: 1, text: '금요일 7시에 홍대입구 3번 출구에서 봬요!', mine: false, time: '오후 6:00' }],
};

const DAYS_KR = ['일', '월', '화', '수', '목', '금', '토'];
const TIMES = ['오전 10시', '오전 11시', '오후 12시', '오후 1시', '오후 2시', '오후 3시', '오후 4시', '오후 5시', '오후 6시', '오후 7시', '오후 8시', '오후 9시'];

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
    };
  });
}

/* ── 날짜 모달 ── */
function DateModal({ scheduledDate, onConfirm, onClose }: { scheduledDate: string | null; onConfirm: (d: string) => void; onClose: () => void }) {
  const dates = getSelectableDates();
  const [activeDateIdx, setActiveDateIdx] = useState(0);
  const [selectedTime, setSelectedTime] = useState('오후 3시');

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

        {/* 미리보기 */}
        <div className="flex items-center gap-2.5 rounded-[14px] px-4 py-[13px] mb-3.5" style={{ background: 'var(--bg-card2)' }}>
          <span className="text-[18px]">📍</span>
          <span className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>{dates[activeDateIdx].full} {selectedTime}</span>
        </div>

        <button
          className="w-full text-[15px] font-bold py-[15px] rounded-[16px] min-h-[52px] text-white active:opacity-80"
          style={{ background: 'var(--gradient)', boxShadow: '0 4px 16px rgba(255,128,171,0.35)' }}
          onClick={() => onConfirm(`${dates[activeDateIdx].full} ${selectedTime}`)}
        >
          약속 잡기
        </button>
      </div>
    </div>
  );
}

/* ── 채팅방 뷰 ── */
function ChatRoomView({ room, onBack }: { room: ChatRoom; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>(DUMMY_MESSAGES[room.id] || []);
  const [input, setInput] = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const now = () => {
    const d = new Date();
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h >= 12 ? '오후' : '오전'} ${h > 12 ? h - 12 : h || 12}:${m}`;
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { id: Date.now(), text, mine: true, time: now() }]);
    setInput('');
  };

  const handleConfirmDate = (date: string) => {
    setScheduledDate(date);
    setShowDateModal(false);
    setMessages(prev => [...prev, { id: Date.now(), text: '', mine: false, time: now(), type: 'date-confirm', dateValue: date }]);
  };

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 54px - 50px)' }}>
      {/* 헤더 */}
      <div className="flex items-center gap-2.5 px-[18px] py-3 shrink-0 border-b" style={{ background: 'var(--header-bg)', backdropFilter: 'blur(16px)', borderColor: 'var(--border)' }}>
        <button className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[16px] font-semibold shrink-0 border" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text-sub)' }} onClick={onBack}>←</button>
        <span className="text-[22px] shrink-0">{room.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold truncate" style={{ color: 'var(--text)' }}>{room.name}</p>
          {room.members && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{room.members}명</p>}
        </div>
        <button
          className="text-[11px] font-bold px-2.5 py-1.5 rounded-[10px] border shrink-0 whitespace-nowrap active:opacity-75"
          style={{ background: 'var(--primary-bg)', borderColor: 'var(--primary-border)', color: 'var(--primary)' }}
          onClick={() => setShowDateModal(true)}
        >
          📅 날짜 정하기
        </button>
      </div>

      {/* 약속 배너 */}
      {scheduledDate && (
        <button
          className="flex items-center gap-2.5 px-[18px] py-2.5 border-b w-full text-left shrink-0 active:opacity-75"
          style={{ background: 'var(--primary-bg)', borderColor: 'var(--primary-border)' }}
          onClick={() => setShowDateModal(true)}
        >
          <span className="text-[18px]">📍</span>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.3px]" style={{ color: 'var(--primary)' }}>약속 날짜</p>
            <p className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>{scheduledDate}</p>
          </div>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--primary)' }}>수정</span>
        </button>
      )}

      {/* 메시지 */}
      <div className="flex-1 overflow-y-auto px-[18px] py-4 flex flex-col gap-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {messages.map(msg =>
          msg.type === 'date-confirm' ? (
            <div key={msg.id} className="self-center flex items-center gap-2.5 rounded-[16px] px-4 py-3 my-1.5 border" style={{ background: 'var(--primary-bg)', borderColor: 'var(--primary-border)' }}>
              <span className="text-[24px]">📅</span>
              <div>
                <p className="text-[12px] font-bold" style={{ color: 'var(--primary)' }}>약속 날짜가 정해졌어요!</p>
                <p className="text-[14px] font-extrabold" style={{ color: 'var(--text)' }}>{msg.dateValue}</p>
              </div>
            </div>
          ) : (
            <div key={msg.id} className={`flex flex-col max-w-[78%] gap-[3px] ${msg.mine ? 'self-end items-end' : 'self-start items-start'}`}>
              <div
                className="px-[14px] py-2.5 text-[14px] leading-relaxed break-words"
                style={{
                  borderRadius: msg.mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  ...(msg.mine
                    ? { background: 'var(--gradient)', color: 'white' }
                    : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }
                  ),
                }}
              >
                {msg.text}
              </div>
              <span className="text-[10px] px-0.5" style={{ color: 'var(--text-muted)' }}>{msg.time}</span>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="flex items-center gap-2 px-[18px] py-2.5 pb-3.5 border-t shrink-0" style={{ background: 'var(--gnb-bg)', borderColor: 'var(--border)' }}>
        <button className="w-10 h-10 rounded-[12px] flex items-center justify-center text-[18px] border shrink-0 active:opacity-70" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)' }} onClick={() => setShowDateModal(true)} title="날짜 정하기">📅</button>
        <input
          className="flex-1 rounded-[20px] px-4 py-2.5 text-[14px] border min-w-0"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}
          placeholder="메시지 입력..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center text-[18px] font-bold shrink-0"
          style={input.trim() ? { background: 'var(--gradient)', color: 'white' } : { background: 'var(--bg-card2)', color: 'var(--text-muted)' }}
          onClick={sendMessage}
          disabled={!input.trim()}
        >
          ↑
        </button>
      </div>

      {showDateModal && <DateModal scheduledDate={scheduledDate} onConfirm={handleConfirmDate} onClose={() => setShowDateModal(false)} />}
    </div>
  );
}

/* ── 채팅 목록 ── */
const CATEGORIES: Category[] = ['소개팅', '미팅', '소모임'];
const CATEGORY_EMOJI: Record<Category, string> = { 소개팅: '💘', 미팅: '🎉', 소모임: '🌟' };
const CATEGORY_EMPTY: Record<Category, string> = { 소개팅: '소개팅 매칭이 되면 채팅이 열려요', 미팅: '미팅에 참여하면 채팅이 열려요', 소모임: '소모임에 가입하면 채팅이 열려요' };

export default function ChatPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>('소개팅');
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);

  if (activeRoom) return <ChatRoomView room={activeRoom} onBack={() => setActiveRoom(null)} />;

  const rooms = ROOMS.filter(r => r.category === category);

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
      {rooms.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2.5">
          <span className="text-[52px]" style={{ animation: 'float 2.8s ease-in-out infinite' }}>{CATEGORY_EMOJI[category]}</span>
          <p className="text-[16px] font-bold" style={{ color: 'var(--text-sub)' }}>아직 채팅방이 없어요</p>
          <p className="text-[13px] text-center" style={{ color: 'var(--text-muted)' }}>{CATEGORY_EMPTY[category]}</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {rooms.map(room => (
            <button key={room.id} className="flex items-center gap-[13px] py-3.5 border-b w-full text-left active:opacity-75" style={{ borderColor: 'var(--border)' }} onClick={() => setActiveRoom(room)}>
              <div className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center text-[24px] shrink-0" style={{ background: 'var(--bg-card2)' }}>{room.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <span className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>{room.name}</span>
                  <span className="text-[11px] shrink-0 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{room.time}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[13px] truncate" style={{ color: 'var(--text-muted)' }}>{room.lastMsg}</span>
                  {room.unread > 0 && (
                    <span className="text-[10px] font-bold min-w-5 h-5 rounded-full flex items-center justify-center px-1.5 text-white shrink-0" style={{ background: 'var(--primary)' }}>{room.unread}</span>
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
