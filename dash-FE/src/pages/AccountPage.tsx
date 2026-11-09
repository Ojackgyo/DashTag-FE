import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { capabilities } from "../api/capabilities";
import { clearTokens } from "../api/client";
import {
  requestPasswordReset,
  confirmPasswordReset,
  resetPassword,
  withdrawAccount,
} from "../api/account";
import { Action, ConnectionNotice, Confirm } from "../components/FeatureUI";
import { fieldStyle } from "../components/featureStyles";
import QueryStatus from "../components/QueryStatus";
export function PasswordResetPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [resendAt, setResendAt] = useState(0);
  const mutation = useMutation({
    mutationFn: async () => {
      if (step === 0) {
        await requestPasswordReset(email);
        setResendAt(Date.now() + 60000);
        setStep(1);
      } else if (step === 1) {
        const r = await confirmPasswordReset(email, code);
        setToken(r.resetToken);
        setStep(2);
      } else {
        if (password !== repeat) throw new Error("비밀번호가 일치하지 않아요");
        await resetPassword(token, password);
        setPassword("");
        setRepeat("");
        setToken("");
        setStep(3);
      }
    },
  });
  return (
    <div className="page-container px-[18px] pb-6">
      <h1 className="feature-title">비밀번호 재설정</h1>
      <ConnectionNotice available={capabilities.account} />
      {step === 3 ? (
        <>
          <p role="status" className="feature-notice">
            비밀번호가 변경됐어요. 다시 로그인해주세요.
          </p>
          <Action onClick={() => navigate("/login")}>로그인으로</Action>
        </>
      ) : (
        <form
          className="feature-form"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            if (!mutation.isPending) mutation.mutate();
          }}
        >
          {step === 0 ? (
            <label>
              인하대 이메일
              <input
                style={fieldStyle}
                type="email"
                required
                autoComplete="email"
                value={email}
                disabled={mutation.isPending}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          ) : step === 1 ? (
            <>
              <p style={{ color: "var(--text-sub)" }}>
                {email}로 보낸 인증번호를 입력해주세요.
              </p>
              <label>
                인증번호
                <input
                  style={fieldStyle}
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={code}
                  disabled={mutation.isPending}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </label>
              <Action
                type="button"
                disabled={mutation.isPending}
                onClick={async () => {
                  if (Date.now() < resendAt) {
                    setError(new Error("재전송은 60초 후 가능해요"));
                    return;
                  }
                  try {
                    await requestPasswordReset(email);
                    setResendAt(Date.now() + 60000);
                    setError(null);
                  } catch (e) {
                    setError(e as Error);
                  }
                }}
              >
                인증번호 재전송
              </Action>
            </>
          ) : (
            <>
              <label>
                새 비밀번호
                <input
                  style={fieldStyle}
                  type="password"
                  required
                  minLength={8}
                  maxLength={64}
                  autoComplete="new-password"
                  value={password}
                  disabled={mutation.isPending}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <label>
                새 비밀번호 확인
                <input
                  style={fieldStyle}
                  type="password"
                  required
                  minLength={8}
                  maxLength={64}
                  autoComplete="new-password"
                  value={repeat}
                  disabled={mutation.isPending}
                  onChange={(e) => setRepeat(e.target.value)}
                />
              </label>
            </>
          )}
          <QueryStatus error={error ?? mutation.error} />
          <Action disabled={!capabilities.account || mutation.isPending}>
            {mutation.isPending
              ? "처리 중…"
              : step === 0
                ? "인증번호 받기"
                : step === 1
                  ? "인증번호 확인"
                  : "비밀번호 변경"}
          </Action>
        </form>
      )}
      <button
        className="action-button"
        onClick={() => navigate("/login")}
        style={{ color: "var(--text-sub)", marginTop: 16 }}
      >
        로그인으로 돌아가기
      </button>
    </div>
  );
}
export default function AccountPage() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [confirm, setConfirm] = useState(false);
  const mutation = useMutation({
    mutationFn: () => withdrawAccount(password),
    onSuccess: () => {
      setPassword("");
      clearTokens();
      client.clear();
      navigate("/login", { replace: true });
    },
  });
  return (
    <div className="page-container px-[18px] pb-6">
      <h1 className="feature-title">계정 관리</h1>
      <ConnectionNotice available={capabilities.account} />
      <Action onClick={() => navigate("/password-reset")}>
        비밀번호 재설정
      </Action>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: "var(--text)",
          margin: "28px 0 12px",
        }}
      >
        회원 탈퇴
      </h2>
      <p className="feature-notice">
        탈퇴하면 다시 로그인할 수 없고, 참여 중인 모임과 채팅방에서도 나가게
        돼요. 법령과 운영 정책에 따른 보관 정보를 제외한 개인 정보는 삭제돼요.
      </p>
      <form
        className="feature-form"
        onSubmit={(e) => {
          e.preventDefault();
          setConfirm(true);
        }}
      >
        <label>
          현재 비밀번호
          <input
            style={fieldStyle}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            disabled={mutation.isPending}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label>
          확인을 위해 ‘탈퇴’를 입력해주세요
          <input
            style={fieldStyle}
            required
            value={confirmation}
            disabled={mutation.isPending}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </label>
        <QueryStatus error={mutation.error} />
        <Action
          disabled={
            !capabilities.account ||
            confirmation !== "탈퇴" ||
            !password ||
            mutation.isPending
          }
        >
          회원 탈퇴
        </Action>
      </form>
      {confirm && (
        <Confirm
          error={mutation.error}
          title="정말 탈퇴할까요?"
          description="탈퇴 후에는 계정과 참여 정보를 되돌릴 수 없어요."
          busy={mutation.isPending}
          onClose={() => setConfirm(false)}
          onConfirm={() => mutation.mutate()}
        />
      )}
    </div>
  );
}
