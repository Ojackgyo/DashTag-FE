import { api, setTokens, clearTokens } from './client';

export interface AccessTokenResponse {
  accessToken: string;
}

export interface SignupVerificationTokenResponse {
  verificationToken: string;
}

// POST /api/auth/email-verifications
export function requestEmailVerification(email: string): Promise<void> {
  return api.post<void>('/api/auth/email-verifications', { email: email.trim() });
}

// POST /api/auth/email-verifications/confirm
export function confirmEmailVerification(email: string, code: string): Promise<SignupVerificationTokenResponse> {
  return api.post<SignupVerificationTokenResponse>('/api/auth/email-verifications/confirm', {
    email: email.trim(),
    code: code.trim(),
  });
}

export function resendVerification(email: string): Promise<void> {
  return requestEmailVerification(email);
}

// POST /api/auth/signup
export async function signup(verificationToken: string, password: string): Promise<AccessTokenResponse> {
  const res = await api.post<AccessTokenResponse>('/api/auth/signup', { verificationToken, password });
  if (!res?.accessToken) throw new Error('회원가입 응답에 access token이 없습니다');
  setTokens(res.accessToken);
  return res;
}

// POST /api/auth/login
export async function login(email: string, password: string): Promise<AccessTokenResponse> {
  const res = await api.post<AccessTokenResponse>('/api/auth/login', { email: email.trim(), password });
  if (!res?.accessToken) throw new Error('로그인 응답에 access token이 없습니다');
  setTokens(res.accessToken);
  return res;
}

export function logout() {
  clearTokens();
}
