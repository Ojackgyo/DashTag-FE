import { api, setTokens, clearTokens } from './client';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

interface AuthMsg { message: string; }

// POST /auth/signup
// 계정 생성 + 인증 메일 발송
export function signup(email: string, password: string, nickname: string, gender: string): Promise<AuthMsg> {
  return api.post<AuthMsg>('/auth/signup', { email, password, nickname, gender });
}

// POST /auth/verify-email
// 인증코드 확인 → 토큰 발급
export async function verifyEmail(email: string, code: string): Promise<TokenResponse> {
  const res = await api.post<TokenResponse>('/auth/verify-email', { email, code });
  setTokens(res.access_token, res.refresh_token);
  return res;
}

// POST /auth/resend-verification
// 인증코드 재발송
export function resendVerification(email: string): Promise<AuthMsg> {
  return api.post<AuthMsg>('/auth/resend-verification', { email });
}

// POST /auth/login
export async function login(email: string, password: string): Promise<TokenResponse> {
  const res = await api.post<TokenResponse>('/auth/login', { email, password });
  setTokens(res.access_token, res.refresh_token);
  return res;
}

// POST /auth/refresh
export async function refreshToken(refresh_token: string): Promise<TokenResponse> {
  const res = await api.post<TokenResponse>('/auth/refresh', { refresh_token });
  setTokens(res.access_token, res.refresh_token);
  return res;
}

export function logout() {
  clearTokens();
}
