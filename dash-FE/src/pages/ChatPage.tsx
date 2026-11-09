import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import {
  getChatMessagePage,
  getNewChatMessages,
  updateReadPosition,
  toMessage,
  getChatRoomDetail,
  leaveChatRoom,
  closeChatRoom,
} from "../api/chat";
import type { ChatRoomResponse, MessageResponse } from "../api/chat";
import { useMe } from "../hooks/useMe";
import { useChatRooms } from "../hooks/useChatRooms";
import QueryStatus from "../components/QueryStatus";
import { capabilities, previewMode } from "../api/capabilities";
import { useChatStore } from "../store/chatStore";
import {
  connectChat,
  type ChatConnection,
  type ConnectionState,
} from "../api/chatSocket";
import { ScheduleSheet, ReportSheet } from "../features/ChatActions";
import { displaySchedule, getSchedule } from "../api/schedule";
import { Action, Sheet, Confirm } from "../components/FeatureUI";
import { cardStyle } from "../components/featureStyles";

interface OpenRoomState {
  type: string;
  relatedId?: number;
  roomId?: number;
}

type Category = "소개팅" | "미팅" | "소모임";

function roomCategory(type: string): Category {
  if (type === "dating") return "소개팅";
  if (type === "meeting") return "미팅";
  if (type === "community") return "소모임";
  return "소개팅";
}

const POLL_INTERVAL = 5000;

/* ── 채팅방 뷰 ── */
function ChatRoomView({
  room,
  onBack,
}: {
  room: ChatRoomResponse;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: user } = useMe();
  const detail = useQuery({
    queryKey: [...queryKeys.chatRooms, "detail", room.id],
    queryFn: () => getChatRoomDetail(room.id),
    enabled: capabilities.chatDetails,
  });
  const schedule = useQuery({
    queryKey: ["schedules", "room", room.id],
    queryFn: () => getSchedule(room.id),
    enabled: capabilities.chatSchedule,
  });
  const [people, setPeople] = useState(false);
  const [exitAction, setExitAction] = useState<"leave" | "close" | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const socketRef = useRef<ChatConnection | null>(null);
  const connected = useRef(false);
  const [readPositions, setReadPositions] = useState<Record<number, number>>(
    {},
  );
  const exit = useMutation({
    mutationFn: () =>
      exitAction === "close" ? closeChatRoom(room.id) : leaveChatRoom(room.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRooms });
      void queryClient.invalidateQueries({ queryKey: queryKeys.communities });
      onBack();
    },
  });
  const userId = user?.id ?? 0;
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [input, setInput] = useState("");
  const [showDateModal, setShowDateModal] = useState(false);
  const scheduledDate = schedule.data
    ? displaySchedule(schedule.data.scheduledAt)
    : null;
  const [showReport, setShowReport] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [sendError, setSendError] = useState<Error | null>(null);
  const [readError, setReadError] = useState<Error | null>(null);
  const acknowledgedId = useRef(0);
  const initiallyScrolled = useRef(false);
  const readLock = useRef(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [olderLoading, setOlderLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const latestId = useRef(0);
  const sendLock = useRef(false);
  const olderLock = useRef(false);
  const pendingSend = useRef<{ content: string; id: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);

  const mergeMessages = (incoming: MessageResponse[]) => {
    if (!mounted.current) return;
    setMessages((prev) =>
      [...new Map([...prev, ...incoming].map((m) => [m.id, m])).values()].sort(
        (a, b) => a.id - b.id,
      ),
    );
  };

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let initialized = false;
    mounted.current = true;
    const poll = async () => {
      try {
        if (initialized && connected.current) return;
        if (!initialized) {
          const page = await getChatMessagePage(room.id);
          if (!active) return;
          mergeMessages(page.messages);
          latestId.current = Math.max(0, ...page.messages.map((m) => m.id));
          setNextCursor(page.hasNext ? (page.nextCursor ?? null) : null);
          initialized = true;
        } else {
          const incoming = await getNewChatMessages(room.id, latestId.current);
          if (!active) return;
          mergeMessages(incoming);
          latestId.current = Math.max(
            latestId.current,
            ...incoming.map((m) => m.id),
          );
        }
        setLoadError(null);
      } catch (e) {
        if (active)
          setLoadError(
            e instanceof Error ? e : new Error("메시지를 불러오지 못했어요"),
          );
      } finally {
        if (active) {
          setLoading(false);
          timer = setTimeout(poll, POLL_INTERVAL);
        }
      }
    };
    void poll();
    return () => {
      active = false;
      mounted.current = false;
      clearTimeout(timer);
    };
  }, [room.id]);

  useEffect(() => {
    let active = true;
    const connection = connectChat(
      room.id,
      () => latestId.current,
      (event) => {
        if (!active) return;
        if (event.type === "MESSAGE_CREATED") {
          const message = toMessage(
            event.payload as unknown as Parameters<typeof toMessage>[0],
            room.id,
          );
          mergeMessages([message]);
          // REST recovery uses its own watermark; a live event cannot skip an in-flight catch-up.
          void queryClient.invalidateQueries({ queryKey: queryKeys.chatRooms });
        } else if (event.type === "READ_POSITION_UPDATED") {
          const { memberId, lastReadMessageId } = event.payload;
          if (
            typeof memberId === "number" &&
            typeof lastReadMessageId === "number"
          )
            setReadPositions((prev) => ({
              ...prev,
              [memberId]: Math.max(prev[memberId] ?? 0, lastReadMessageId),
            }));
        } else if (
          event.type === "SCHEDULE_UPDATED" ||
          event.type === "SCHEDULE_DELETED"
        ) {
          void queryClient.invalidateQueries({ queryKey: ["schedules"] });
          void queryClient.invalidateQueries({ queryKey: queryKeys.chatRooms });
        } else if (
          event.type === "ROOM_CLOSED" ||
          (event.type === "MEMBER_REMOVED" && event.payload.memberId === userId)
        ) {
          setUnavailable(true);
          void queryClient.invalidateQueries({ queryKey: queryKeys.chatRooms });
        } else {
          void queryClient.invalidateQueries({
            queryKey: [...queryKeys.chatRooms, "detail", room.id],
          });
        }
      },
      (state) => {
        if (!active) return;
        setConnectionState(state);
        connected.current = state === "connected";
        if (state === "connected") {
          void getNewChatMessages(room.id, latestId.current)
            .then((messages) => {
              if (active) {
                mergeMessages(messages);
                latestId.current = Math.max(
                  latestId.current,
                  ...messages.map((m) => m.id),
                );
              }
            })
            .catch((e) => {
              if (active) setLoadError(e as Error);
            });
        }
      },
    );
    socketRef.current = connection;
    return () => {
      active = false;
      connected.current = false;
      socketRef.current = null;
      connection.close();
    };
  }, [room.id, queryClient, userId]);

  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    const container = scrollRef.current;
    if (
      !container ||
      container.scrollHeight - container.scrollTop - container.clientHeight <
        180 ||
      !initiallyScrolled.current
    ) {
      bottomRef.current?.scrollIntoView({
        behavior: initiallyScrolled.current ? "smooth" : "instant",
      });
      if (lastMessageId != null) initiallyScrolled.current = true;
    }
  }, [lastMessageId]);

  // A room is read only while its latest message is visible in the foreground.
  useEffect(() => {
    const bottom = bottomRef.current;
    if (!bottom || lastMessageId == null) return;
    let active = true;
    let visible = false;
    const acknowledge = async () => {
      if (
        !active ||
        !visible ||
        document.visibilityState !== "visible" ||
        readLock.current ||
        acknowledgedId.current >= lastMessageId
      )
        return;
      readLock.current = true;
      try {
        const result = await updateReadPosition(room.id, lastMessageId);
        acknowledgedId.current = Math.max(
          acknowledgedId.current,
          result.lastReadMessageId,
        );
        void queryClient.invalidateQueries({ queryKey: queryKeys.chatRooms });
        if (active) setReadError(null);
      } catch (e) {
        if (active)
          setReadError(
            e instanceof Error ? e : new Error("읽음 상태를 갱신하지 못했어요"),
          );
      } finally {
        readLock.current = false;
      }
    };
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        void acknowledge();
      },
      { root: scrollRef.current },
    );
    observer.observe(bottom);
    const onVisible = () => {
      void acknowledge();
    };
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(onVisible, POLL_INTERVAL);
    return () => {
      active = false;
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [lastMessageId, room.id, queryClient]);

  const loadOlder = async () => {
    if (nextCursor == null || olderLock.current) return;
    olderLock.current = true;
    setOlderLoading(true);
    const container = scrollRef.current;
    const oldHeight = container?.scrollHeight ?? 0;
    try {
      const page = await getChatMessagePage(room.id, nextCursor);
      if (!mounted.current) return;
      mergeMessages(page.messages);
      setNextCursor(page.hasNext ? (page.nextCursor ?? null) : null);
      setLoadError(null);
      requestAnimationFrame(() => {
        if (container)
          container.scrollTop += container.scrollHeight - oldHeight;
      });
    } catch (e) {
      if (mounted.current)
        setLoadError(
          e instanceof Error ? e : new Error("이전 메시지를 불러오지 못했어요"),
        );
    } finally {
      olderLock.current = false;
      if (mounted.current) setOlderLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sendLock.current || unavailable || !socketRef.current) return;
    sendLock.current = true;
    setSending(true);
    setSendError(null);
    if (!pendingSend.current || pendingSend.current.content !== text)
      pendingSend.current = { content: text, id: crypto.randomUUID() };
    try {
      const sent = await socketRef.current!.send(text, pendingSend.current.id);
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRooms });
      if (!mounted.current) return;
      mergeMessages([sent]);
      setInput("");
      pendingSend.current = null;
    } catch (e) {
      if (mounted.current)
        setSendError(
          e instanceof Error
            ? e
            : new Error("전송하지 못했어요. 다시 시도해주세요"),
        );
    } finally {
      sendLock.current = false;
      if (mounted.current) setSending(false);
    }
  };

  const permissions = detail.data?.room ?? room;
  const allowSetDate =
    capabilities.chatSchedule && permissions.can_set_schedule === true;
  const isGroup =
    room.room_type === "meeting" || room.room_type === "community";

  // sender_id → 닉네임 캐시 (sender_nickname 필드 있으면 그걸로, 없으면 ID 축약)
  const nicknameOf = (msg: MessageResponse): string => {
    if (msg.sender_nickname) return msg.sender_nickname;
    return `#${msg.sender_id}`;
  };

  const formatMsgTime = (iso: string) => {
    const d = new Date(iso);
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h >= 12 ? "오후" : "오전"} ${h > 12 ? h - 12 : h || 12}:${m}`;
  };

  return (
    <div
      className="chat-room flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 54px - 50px)", position: "relative" }}
    >
      {/* 로고 워터마크 */}
      <img
        src="/logo.svg"
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 180,
          opacity: 0.08,
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 0,
        }}
      />

      {/* 헤더 */}
      <div
        className="flex items-center gap-2.5 px-[18px] py-3 shrink-0 border-b"
        style={{
          background: "var(--header-bg)",
          backdropFilter: "blur(16px)",
          borderColor: "var(--border)",
        }}
      >
        <button
          className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[16px] font-semibold shrink-0 border"
          style={{
            background: "var(--bg-card2)",
            borderColor: "var(--border)",
            color: "var(--text-sub)",
          }}
          onClick={onBack}
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <p
            className="text-[15px] font-bold truncate"
            style={{ color: "var(--text)" }}
          >
            {room.emoji ? `${room.emoji} ` : ""}
            {room.name || `${roomCategory(room.room_type)} #${room.id}`}
          </p>
        </div>
        {(!capabilities.chatSchedule || allowSetDate) && (
          <button
            className="text-[11px] font-bold px-2.5 py-1.5 rounded-[10px] border shrink-0 whitespace-nowrap active:opacity-75"
            style={{
              background: "var(--primary-bg)",
              borderColor: "var(--primary-border)",
              color: "var(--primary)",
            }}
            onClick={() => setShowDateModal(true)}
          >
            📅 날짜 정하기
          </button>
        )}
        <button
          className="icon-button"
          aria-label="참여자 및 채팅방 관리"
          onClick={() => setPeople(true)}
          style={{ color: "var(--text-sub)" }}
        >
          👥
        </button>
        <button
          className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[15px] border shrink-0 active:opacity-75"
          style={{
            background: "var(--bg-card2)",
            borderColor: "var(--border)",
            color: "var(--text-muted)",
          }}
          onClick={() => setShowReport(true)}
          title={capabilities.chatReports ? "신고하기" : "신고 기능 준비 중"}
          aria-label={
            capabilities.chatReports ? "신고하기" : "신고 기능 준비 중"
          }
        >
          🚨
        </button>
      </div>

      <p
        role="status"
        style={{
          fontSize: 11,
          padding: "6px 18px",
          color: "var(--text-muted)",
        }}
      >
        {unavailable
          ? "종료되었거나 참여 권한이 없는 채팅방이에요"
          : {
              connecting: "실시간 연결 중…",
              connected: "실시간 연결됨",
              reconnecting: "실시간 재연결 중 · 메시지 복구 중",
              unconfigured: "실시간 연결 대기 · REST로 새 메시지 확인 중",
              closed: "연결 종료",
              unauthorized: "인증 확인이 필요해요. 다시 로그인해주세요.",
            }[connectionState]}
      </p>
      <QueryStatus
        loading={loading}
        error={loadError ?? sendError ?? readError ?? schedule.error}
      />
      {nextCursor != null && (
        <button onClick={loadOlder} disabled={olderLoading}>
          {olderLoading ? "불러오는 중…" : "이전 메시지 더 보기"}
        </button>
      )}
      {/* 약속 배너 */}
      {scheduledDate && (
        <button
          className="flex items-center gap-2.5 px-[18px] py-2.5 border-b w-full text-left shrink-0 active:opacity-75"
          style={{
            background: "var(--primary-bg)",
            borderColor: "var(--primary-border)",
          }}
          onClick={allowSetDate ? () => setShowDateModal(true) : undefined}
        >
          <span className="text-[18px]">📍</span>
          <div className="flex-1">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.3px]"
              style={{ color: "var(--primary)" }}
            >
              약속 날짜
            </p>
            <p
              className="text-[13px] font-bold"
              style={{ color: "var(--text)" }}
            >
              {scheduledDate}
            </p>
          </div>
          {allowSetDate && (
            <span
              className="text-[11px] font-semibold"
              style={{ color: "var(--primary)" }}
            >
              수정
            </span>
          )}
        </button>
      )}

      {previewMode && (
        <div
          className="feature-row"
          style={{
            padding: "4px 18px",
            fontSize: 11,
            color: "var(--text-sub)",
          }}
        >
          <span>예시 이벤트</span>
          <button
            className="action-button"
            disabled={
              unavailable ||
              !detail.data?.participants.some(
                (p) => p.active && p.memberId !== userId,
              )
            }
            onClick={() => {
              void import("../preview/server")
                .then((m) => m.simulateIncoming(room.id))
                .catch((e) => setSendError(e as Error));
            }}
          >
            상대 답장
          </button>
          <button
            className="action-button"
            disabled={
              unavailable ||
              !detail.data?.participants.some(
                (p) => p.active && p.memberId !== userId,
              )
            }
            onClick={() => {
              void import("../preview/server")
                .then((m) => m.simulateRead(room.id))
                .catch((e) => setSendError(e as Error));
            }}
          >
            상대 읽음
          </button>
        </div>
      )}
      {/* 메시지 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-[18px] py-4 flex flex-col gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ position: "relative", zIndex: 1 }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <span className="text-[40px]">💬</span>
            <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
              첫 메시지를 보내보세요!
            </p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const mine = msg.sender_id === userId;
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const showSender =
            !mine &&
            (isGroup || room.room_type === "dating") &&
            (!prevMsg || prevMsg.sender_id !== msg.sender_id);
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[78%] gap-[3px] ${mine ? "self-end items-end" : "self-start items-start"}`}
            >
              {showSender && (
                <span
                  className="text-[11px] font-semibold px-1"
                  style={{ color: "var(--text-sub)" }}
                >
                  {nicknameOf(msg)}
                </span>
              )}
              <div
                className="px-[14px] py-2.5 text-[14px] leading-relaxed break-words"
                style={{
                  borderRadius: mine
                    ? "18px 18px 4px 18px"
                    : "18px 18px 18px 4px",
                  ...(mine
                    ? { background: "var(--gradient)", color: "white" }
                    : {
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                      }),
                }}
              >
                {msg.content}
              </div>
              <span
                className="text-[10px] px-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {formatMsgTime(msg.created_at)}
                {mine &&
                  detail.data &&
                  (() => {
                    const others = detail.data.participants.filter(
                      (p) => p.memberId !== userId && p.active,
                    );
                    const unread = others.filter(
                      (p) =>
                        Math.max(
                          p.lastReadMessageId ?? 0,
                          readPositions[p.memberId] ?? 0,
                        ) < msg.id,
                    ).length;
                    return others.length
                      ? unread
                        ? ` · 안 읽음 ${unread}`
                        : " · 읽음"
                      : "";
                  })()}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div
        className="chat-composer flex items-center gap-2 px-[18px] py-2.5 pb-3.5 border-t shrink-0"
        style={{ background: "var(--gnb-bg)", borderColor: "var(--border)" }}
      >
        {allowSetDate && (
          <button
            className="w-10 h-10 rounded-[12px] flex items-center justify-center text-[18px] border shrink-0 active:opacity-70"
            style={{
              background: "var(--bg-card2)",
              borderColor: "var(--border)",
            }}
            onClick={() => setShowDateModal(true)}
            title="날짜 정하기"
          >
            📅
          </button>
        )}
        <input
          className="flex-1 rounded-[20px] px-4 py-2.5 text-[14px] border min-w-0"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
          placeholder="메시지 입력..."
          disabled={sending || unavailable}
          maxLength={2000}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSend();
          }}
        />
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center text-[18px] font-bold shrink-0"
          style={
            input.trim()
              ? { background: "var(--gradient)", color: "white" }
              : { background: "var(--bg-card2)", color: "var(--text-muted)" }
          }
          onClick={handleSend}
          disabled={!input.trim() || sending || unavailable}
        >
          ↑
        </button>
      </div>

      {showDateModal && (
        <ScheduleSheet
          roomId={room.id}
          canEdit={allowSetDate || !capabilities.chatSchedule}
          onClose={() => setShowDateModal(false)}
        />
      )}
      {showReport && (
        <ReportSheet roomId={room.id} onClose={() => setShowReport(false)} />
      )}
      {people && (
        <Sheet title="참여자 및 채팅방 관리" onClose={() => setPeople(false)}>
          <QueryStatus
            loading={detail.isLoading}
            error={detail.error}
            retry={() => {
              void detail.refetch();
            }}
          />
          {!capabilities.chatDetails && (
            <p className="feature-notice">참여자 정보를 연결하고 있어요.</p>
          )}
          {detail.data?.participants.map((p) => (
            <div key={p.memberId} style={cardStyle}>
              <strong>
                {p.nickname}
                {p.memberId === userId ? " (나)" : ""}
              </strong>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {p.role === "OWNER" ? "개설자" : "참여자"}
                {p.active ? "" : " · 나간 회원"}
              </p>
            </div>
          ))}
          <div className="feature-form">
            {room.room_type === "dating" && (
              <Action onClick={() => navigate("/reviews?tab=eligible")}>
                리뷰 작성하기
              </Action>
            )}
            {permissions.can_leave && (
              <Action onClick={() => setExitAction("leave")}>
                채팅방 나가기
              </Action>
            )}
            {permissions.can_close && (
              <Action onClick={() => setExitAction("close")}>
                채팅방 종료
              </Action>
            )}
          </div>
          <QueryStatus error={exit.error} />
        </Sheet>
      )}
      {exitAction && (
        <Confirm
          error={exit.error}
          title={
            exitAction === "close"
              ? "채팅방을 종료할까요?"
              : "채팅방에서 나갈까요?"
          }
          description={
            exitAction === "close"
              ? "참여자 모두 새 메시지를 보낼 수 없게 돼요."
              : "연결된 모임에서도 나가고 채팅방에 접근할 수 없게 돼요."
          }
          busy={exit.isPending}
          onClose={() => setExitAction(null)}
          onConfirm={() => exit.mutate()}
        />
      )}
    </div>
  );
}

/* ── 채팅 목록 ── */
const CATEGORIES: Category[] = ["소개팅", "미팅", "소모임"];
const CATEGORY_EMOJI: Record<Category, string> = {
  소개팅: "💘",
  미팅: "🎉",
  소모임: "🌟",
};
const CATEGORY_EMPTY: Record<Category, string> = {
  소개팅: "소개팅 매칭이 되면 채팅이 열려요",
  미팅: "미팅에 참여하면 채팅이 열려요",
  소모임: "소모임에 가입하면 채팅이 열려요",
};

function formatRoomTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const openRoomState = (location.state as { openRoom?: OpenRoomState } | null)
    ?.openRoom;

  const { data: rooms = [], isLoading, error, refetch } = useChatRooms();
  const { activeRoom, category, setActiveRoom, setCategory } = useChatStore();

  // openRoomState는 최초 1회만 처리 (rooms가 로드된 후)
  const openRoomHandled = useRef(false);
  useEffect(() => {
    if (!openRoomState || rooms.length === 0 || openRoomHandled.current) return;
    openRoomHandled.current = true;

    const match =
      rooms.find((r) => {
        if (openRoomState.roomId != null) return r.id === openRoomState.roomId;
        if (r.room_type !== openRoomState.type) return false;
        if (openRoomState.relatedId != null)
          return r.related_id === openRoomState.relatedId;
        return true;
      }) ??
      (openRoomState.roomId == null
        ? rooms
            .filter((r) => r.room_type === openRoomState.type)
            .sort(
              (a, b) =>
                new Date(b.last_message_at ?? b.created_at).getTime() -
                new Date(a.last_message_at ?? a.created_at).getTime(),
            )[0]
        : undefined);

    if (match) {
      setActiveRoom(match);
      setCategory(roomCategory(match.room_type));
    } else {
      const typeMap: Record<string, Category> = {
        dating: "소개팅",
        meeting: "미팅",
        community: "소모임",
      };
      const cat = typeMap[openRoomState.type];
      if (cat) setCategory(cat);
    }
  }, [rooms, openRoomState, setActiveRoom, setCategory]);

  if (activeRoom)
    return (
      <ChatRoomView
        key={activeRoom.id}
        room={activeRoom}
        onBack={() => setActiveRoom(null)}
      />
    );

  const filtered = rooms.filter((r) => roomCategory(r.room_type) === category);

  return (
    <div className="page-container px-[18px] pb-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2.5 pt-[22px] pb-4">
        <button
          className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[16px] font-semibold border"
          style={{
            background: "var(--bg-card2)",
            borderColor: "var(--border)",
            color: "var(--text-sub)",
          }}
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <h1
          className="text-[22px] font-extrabold"
          style={{ color: "var(--text)" }}
        >
          채팅
        </h1>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 mb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className="flex-1 flex flex-col items-center gap-1 py-3 rounded-[16px] text-[12px] font-semibold border-[1.5px]"
            style={
              category === c
                ? {
                    background: "var(--primary-bg)",
                    borderColor: "var(--primary-border)",
                    color: "var(--primary)",
                    fontWeight: 700,
                  }
                : {
                    background: "var(--bg-card)",
                    borderColor: "var(--border)",
                    color: "var(--text-sub)",
                  }
            }
            onClick={() => setCategory(c)}
          >
            <span className="text-[22px]">{CATEGORY_EMOJI[c]}</span>
            <span>{c}</span>
          </button>
        ))}
      </div>

      <QueryStatus
        loading={isLoading}
        error={error}
        retry={() => {
          void refetch();
        }}
      />
      {/* 목록 */}
      {isLoading || error ? null : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2.5">
          <span
            className="text-[52px]"
            style={{ animation: "float 2.8s ease-in-out infinite" }}
          >
            {CATEGORY_EMOJI[category]}
          </span>
          <p
            className="text-[16px] font-bold"
            style={{ color: "var(--text-sub)" }}
          >
            아직 채팅방이 없어요
          </p>
          <p
            className="text-[13px] text-center"
            style={{ color: "var(--text-muted)" }}
          >
            {CATEGORY_EMPTY[category]}
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {filtered.map((room) => (
            <button
              key={room.id}
              className="flex items-center gap-[13px] py-3.5 border-b w-full text-left active:opacity-75"
              style={{ borderColor: "var(--border)" }}
              onClick={() => setActiveRoom(room)}
            >
              <div
                className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center text-[24px] shrink-0"
                style={{ background: "var(--bg-card2)" }}
              >
                {room.emoji ?? CATEGORY_EMOJI[roomCategory(room.room_type)]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <span
                    className="text-[15px] font-bold"
                    style={{ color: "var(--text)" }}
                  >
                    {room.name || `${roomCategory(room.room_type)} #${room.id}`}
                  </span>
                  <span
                    className="text-[11px] shrink-0 whitespace-nowrap"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {formatRoomTime(room.last_message_at ?? room.created_at)}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span
                    className="text-[13px] truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {room.last_message ?? "새 채팅방"}
                  </span>
                  {(room.unread_count ?? 0) > 0 && (
                    <span
                      className="text-[10px] font-bold min-w-5 h-5 rounded-full flex items-center justify-center px-1.5 text-white shrink-0"
                      style={{ background: "var(--primary)" }}
                    >
                      {room.unread_count}
                    </span>
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
