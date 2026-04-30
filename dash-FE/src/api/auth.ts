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
