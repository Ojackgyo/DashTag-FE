export const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://dashtag.duckdns.org';

type ApiResponse<T> = {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T | null;
};

async function readResponseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const body = data as Record<string, unknown>;
    if (typeof body.detail === 'string' && body.detail) return body.detail;
    if (typeof body.message === 'string' && body.message) return body.message;
  }
  return typeof data === 'string' && data ? data : fallback;
}

export function getToken() {
  return localStorage.getItem('dashtag_access_token');
}

export function setTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem('dashtag_access_token', accessToken);
  if (refreshToken) localStorage.setItem('dashtag_refresh_token', refreshToken);
  else localStorage.removeItem('dashtag_refresh_token');
  window.dispatchEvent(new Event('dashtag-auth'));
}

export function clearTokens() {
  localStorage.removeItem('dashtag_access_token');
  localStorage.removeItem('dashtag_refresh_token');
  window.dispatchEvent(new Event('dashtag-auth'));
}

export function isLoggedIn() {
  return !!getToken();
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = init.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && path !== '/api/auth/login') {
    clearTokens();
    throw Object.assign(new Error('auth_expired'), { isAuthExpired: true });
  }

  if (res.status === 204) return undefined as T;
  const data = await readResponseBody(res);

  if (!res.ok) {
    throw new Error(getErrorMessage(data, res.statusText || '서버 오류가 발생했어요'));
  }

  if (data && typeof data === 'object' && 'isSuccess' in data) {
    const envelope = data as ApiResponse<T>;
    if (!envelope.isSuccess) {
      throw new Error(envelope.message || '요청 처리에 실패했어요');
    }
    return envelope.result as T;
  }
  return data as T;
}

export const api = {
  get:    <T>(path: string)                    => request<T>(path),
  post:   <T>(path: string, body?: unknown)    => request<T>(path, { method: 'POST',  body: body !== undefined ? JSON.stringify(body) : undefined }),
  put:    <T>(path: string, body?: unknown)    => request<T>(path, { method: 'PUT',   body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch:  <T>(path: string, body?: unknown)    => request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string)                    => request<T>(path, { method: 'DELETE' }),
  postForm: <T>(path: string, body: FormData)   => request<T>(path, { method: 'POST', body }),
};
