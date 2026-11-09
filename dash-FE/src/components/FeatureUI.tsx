import type { ReactNode } from "react";
import QueryStatus from "./QueryStatus";
import { useEffect, useRef } from "react";
const dialogStack: HTMLElement[] = [];
let bodyOverflowBeforeSheets = "";

export function Action({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`action-button feature-action ${props.className ?? ""}`}
      style={{
        borderRadius: 14,
        padding: "12px 16px",
        fontWeight: 700,
        color: "white",
        background: "var(--gradient)",
        ...props.style,
      }}
    >
      {children}
    </button>
  );
}
export function Sheet({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  useEffect(() => {
    closeRef.current = onClose;
    busyRef.current = busy;
  }, [onClose, busy]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    if (dialogStack.length === 0)
      bodyOverflowBeforeSheets = document.body.style.overflow;
    if (dialog) dialogStack.push(dialog);
    document.body.style.overflow = "hidden";
    dialog?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (dialogStack[dialogStack.length - 1] !== dialog) return;
      if (event.key === "Escape" && !busyRef.current) {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== "Tab" || !dialog) return;
      const elements = [
        ...dialog.querySelectorAll<HTMLElement>(
          "button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]",
        ),
      ].filter((e) => e.offsetParent !== null);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) {
        event.preventDefault();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog)
      ) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      const index = dialogStack.indexOf(dialog!);
      if (index >= 0) dialogStack.splice(index, 1);
      if (dialogStack.length === 0)
        document.body.style.overflow = bodyOverflowBeforeSheets;
      document.removeEventListener("keydown", keydown);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <div className="feature-overlay" onClick={busy ? undefined : onClose}>
      <div
        ref={ref}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-label={title}
        className="mobile-sheet feature-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="feature-sheet-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            type="button"
            aria-label="닫기"
            disabled={busy}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function ConnectionNotice({ available }: { available: boolean }) {
  return available ? null : (
    <p role="status" className="feature-notice">
      서버 연결을 준비하고 있어요. 입력 내용을 확인할 수 있으며, 저장은 연결 후
      가능해요.
    </p>
  );
}
export function Confirm({
  title,
  description,
  onConfirm,
  onClose,
  busy,
  error,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
  busy: boolean;
  error?: Error | null;
}) {
  return (
    <Sheet title={title} onClose={onClose} busy={busy}>
      <p style={{ color: "var(--text-sub)", marginBottom: 20 }}>
        {description}
      </p>
      <QueryStatus error={error} />
      <div className="feature-row">
        <Action
          type="button"
          disabled={busy}
          onClick={onClose}
          style={{ background: "var(--bg-card2)", color: "var(--text)" }}
        >
          취소
        </Action>
        <Action type="button" disabled={busy} onClick={onConfirm}>
          {busy ? "처리 중…" : "확인"}
        </Action>
      </div>
    </Sheet>
  );
}
