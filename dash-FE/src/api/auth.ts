import { api, setToken, clearToken } from './client';

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  profileComplete: boolean;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

// POST /auth/login
// body: { email, password }
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/auth/login', { email, password });
  setToken(res.token);
  return res;
}

// POST /auth/login/kakao
// body: { code } — 카카오 OAuth authorization code
export async function loginKakao(code: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/auth/login/kakao', { code });
  setToken(res.token);
  return res;
}

// POST /auth/logout
export async function logout(): Promise<void> {
  await api.post('/auth/logout');
  clearToken();
}

// GET /auth/me
export function getMe(): Promise<AuthUser> {
  return api.get<AuthUser>('/auth/me');
}

export interface SignupBody {
  email: string;
  password: string;
}

// POST /auth/signup
export async function signup(body: SignupBody): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/auth/signup', body);
  setToken(res.token);
  return res;
}

// POST /auth/email/send
// 이메일 인증코드 발송 (60초 재전송 제한은 서버에서도 강제)
export function sendEmailCode(email: string): Promise<void> {
  return api.post<void>('/auth/email/send', { email });
}

// POST /auth/email/verify
// 인증코드 확인
export function verifyEmailCode(email: string, code: string): Promise<{ verified: boolean }> {
  return api.post<{ verified: boolean }>('/auth/email/verify', { email, code });
}
