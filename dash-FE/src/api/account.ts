import { api, clearTokens } from "./client";
import { requireCapability } from "./capabilities";
export function requestPasswordReset(email: string) {
  requireCapability("account");
  if (!/^[^@\s]+@inha\.edu$/.test(email.trim()))
    throw new Error("인하대 이메일을 입력해주세요");
  return api.post<void>("/api/auth/password-resets", { email: email.trim() });
}
export function confirmPasswordReset(email: string, code: string) {
  requireCapability("account");
  if (!/^\d{6}$/.test(code)) throw new Error("인증번호 6자리를 입력해주세요");
  return api.post<{ resetToken: string; expiresAt: string }>(
    "/api/auth/password-resets/confirm",
    { email: email.trim(), code },
  );
}
export async function resetPassword(resetToken: string, password: string) {
  requireCapability("account");
  if (password.length < 8 || password.length > 64)
    throw new Error("비밀번호는 8~64자예요");
  await api.put<void>("/api/auth/password-resets", { resetToken, password });
  clearTokens();
}
export function withdrawAccount(password: string) {
  requireCapability("account");
  if (!password) throw new Error("현재 비밀번호를 입력해주세요");
  return api.post<void>("/api/members/me/withdrawal", {
    password,
    confirmation: "WITHDRAW",
  });
}
