import { getToken, renewSession } from "./client";
import { sanitizePlainText } from "../lib/security";
import { previewMode } from "./capabilities";
import { sendMessage, toMessage, type MessageResponse } from "./chat";
export type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "unconfigured"
  | "closed"
  | "unauthorized";
export interface ChatEvent {
  type: string;
  roomId: number;
  payload: Record<string, unknown>;
}
export interface ChatConnection {
  send: (content: string, id: string) => Promise<MessageResponse>;
  close: () => void;
}
// Raw JSON WebSocket adapter. URL and this proposed protocol must be confirmed by backend.
export function connectChat(
  roomId: number,
  latestId: () => number,
  onEvent: (event: ChatEvent) => void,
  onState: (state: ConnectionState) => void,
): ChatConnection {
  let socket: WebSocket | null = null;
  let stopped = false;
  let attempt = 0;
  let authenticated = false;
  let renewed = false;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let lastActivity = Date.now();
  const pending = new Map<
    string,
    {
      resolve: (value: MessageResponse) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  const failPending = () => {
    for (const p of pending.values()) {
      clearTimeout(p.timer);
      p.reject(
        new Error("전송을 확인하지 못했어요. 같은 메시지로 다시 시도해주세요."),
      );
    }
    pending.clear();
  };
  const emit = (event: ChatEvent) => {
    if (event.roomId !== roomId) return;
    if (event.type === "MESSAGE_CREATED") {
      const payload = event.payload;
      if (
        typeof payload.id !== "number" ||
        typeof payload.content !== "string" ||
        typeof payload.clientMessageId !== "string"
      )
        return;
      const waiting = pending.get(payload.clientMessageId);
      if (waiting) {
        clearTimeout(waiting.timer);
        waiting.resolve(
          toMessage(
            payload as unknown as Parameters<typeof toMessage>[0],
            roomId,
          ),
        );
        pending.delete(payload.clientMessageId);
      }
    }
    onEvent(event);
  };
  let previewCleanup: (() => void) | undefined;
  if (previewMode) {
    onState("connecting");
    void import("../preview/server").then((module) => {
      if (stopped) return;
      previewCleanup = module.subscribePreview((event) => emit(event));
      onState("connected");
    });
    return {
      send: async (content, id) => sendMessage(roomId, content, id),
      close: () => {
        stopped = true;
        previewCleanup?.();
      },
    };
  }
  const url = import.meta.env.VITE_CHAT_WS_URL?.trim();
  const open = () => {
    if (stopped) return;
    if (!url) {
      onState("unconfigured");
      return;
    }
    let target: URL;
    try {
      target = new URL(url);
      if (
        !["ws:", "wss:"].includes(target.protocol) ||
        (!import.meta.env.DEV && target.protocol !== "wss:")
      )
        throw Error();
    } catch {
      onState("unconfigured");
      return;
    }
    if (!getToken()) {
      onState("unauthorized");
      return;
    }
    onState(attempt ? "reconnecting" : "connecting");
    authenticated = false;
    lastActivity = Date.now();
    socket = new WebSocket(target.toString());
    socket.onopen = () => {
      lastActivity = Date.now();
      socket?.send(
        JSON.stringify({ type: "AUTH", payload: { accessToken: getToken() } }),
      );
    };
    socket.onmessage = (message) => {
      if (stopped) return;
      lastActivity = Date.now();
      let event: ChatEvent;
      try {
        const parsed = JSON.parse(String(message.data));
        if (
          !parsed ||
          typeof parsed !== "object" ||
          typeof parsed.type !== "string"
        )
          return;
        event = {
          ...parsed,
          payload:
            parsed.payload && typeof parsed.payload === "object"
              ? parsed.payload
              : {},
        };
        if (event.roomId != null && event.roomId !== roomId) return;
      } catch {
        return;
      }
      if (event.type === "AUTHENTICATED") {
        socket?.send(
          JSON.stringify({
            type: "SUBSCRIBE",
            roomId,
            payload: { afterMessageId: latestId() || null },
          }),
        );
        return;
      }
      if (event.type === "SUBSCRIBED" && event.roomId === roomId) {
        authenticated = true;
        attempt = 0;
        renewed = false;
        onState("connected");
        return;
      }
      if (event.type === "PING") {
        socket?.send(JSON.stringify({ type: "PONG" }));
        return;
      }
      if (event.type === "PONG") return;
      if (event.type === "ERROR") {
        const code = event.payload?.code;
        if (code === "AUTH_EXPIRED" && !renewed) {
          renewed = true;
          void renewSession()
            .then(() => socket?.close())
            .catch(() => {
              stopped = true;
              onState("unauthorized");
              socket?.close();
            });
        } else if (code === "AUTH_INVALID" || code === "AUTH_EXPIRED") {
          stopped = true;
          onState("unauthorized");
          socket?.close();
        } else if (code === "ROOM_ACCESS_DENIED" || code === "ROOM_CLOSED") {
          stopped = true;
          onState("closed");
          emit({ type: "ROOM_CLOSED", roomId, payload: event.payload });
          socket?.close();
        }
        const id = event.payload?.clientMessageId;
        if (typeof id === "string") {
          const request = pending.get(id);
          if (request) {
            clearTimeout(request.timer);
            request.reject(
              new Error(
                typeof event.payload.message === "string"
                  ? event.payload.message
                  : "메시지를 전송하지 못했어요",
              ),
            );
            pending.delete(id);
          }
        }
        return;
      }
      if (event.type === "ROOM_CLOSED" || event.type === "MEMBER_REMOVED")
        emit(event);
      else emit(event);
    };
    socket.onclose = () => {
      authenticated = false;
      failPending();
      clearInterval(heartbeat);
      if (!stopped) {
        onState("reconnecting");
        retry = setTimeout(
          open,
          Math.min(30000, 1000 * 2 ** Math.min(attempt++, 5)) +
            Math.random() * 300,
        );
      }
    };
    socket.onerror = () => socket?.close();
    heartbeat = setInterval(() => {
      if (!socket) return;
      if (Date.now() - lastActivity > 45000) {
        socket.close();
        return;
      }
      if (socket.readyState === WebSocket.OPEN && authenticated)
        socket.send(JSON.stringify({ type: "PING" }));
    }, 15000);
  };
  open();
  const reconnect = () => {
    if (!stopped && (!socket || socket.readyState === WebSocket.CLOSED)) {
      clearTimeout(retry);
      open();
    }
  };
  window.addEventListener("online", reconnect);
  return {
    send: (content, id) => {
      content = sanitizePlainText(content, 2000);
      if (!content.trim())
        return Promise.reject(new Error("메시지를 입력해주세요"));
      if (!authenticated || socket?.readyState !== WebSocket.OPEN)
        return sendMessage(roomId, content, id);
      return new Promise<MessageResponse>((resolve, reject) => {
        if (pending.has(id)) {
          reject(new Error("메시지를 확인하고 있어요"));
          return;
        }
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error("전송 확인 시간이 지났어요. 다시 시도해주세요."));
        }, 15000);
        pending.set(id, { resolve, reject, timer });
        try {
          socket!.send(
            JSON.stringify({
              type: "SEND_MESSAGE",
              roomId,
              payload: { content, clientMessageId: id },
            }),
          );
        } catch {
          clearTimeout(timer);
          pending.delete(id);
          reject(new Error("연결이 끊겼어요. 다시 시도해주세요."));
        }
      });
    },
    close: () => {
      stopped = true;
      clearTimeout(retry);
      clearInterval(heartbeat);
      window.removeEventListener("online", reconnect);
      failPending();
      socket?.close();
    },
  };
}
