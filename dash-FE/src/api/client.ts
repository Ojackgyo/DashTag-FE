const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://dashtag-be-production.up.railway.app';

export function getToken() {
  return localStorage.getItem('dashtag_access_token');
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('dashtag_access_token', accessToken);
  localStorage.setItem('dashtag_refresh_token', refreshToken);
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

async function request<T>(path: string, init: RequestInit = {}, retry = false): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && !retry && path !== '/auth/refresh') {
    const refreshToken = localStorage.getItem('dashtag_refresh_token');
    if (refreshToken) {
      try {
        const rRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (rRes.ok) {
          const data = await rRes.json();
          setTokens(data.access_token, data.refresh_token ?? refreshToken);
          return request<T>(path, init, true);
        }
      } catch { /* ignore */ }
    }
    clearTokens();
    throw new Error('로그인이 만료됐어요. 다시 로그인해주세요.');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.detail ?? error.message ?? '서버 오류가 발생했어요');
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string)                    => request<T>(path),
  post:   <T>(path: string, body?: unknown)    => request<T>(path, { method: 'POST',  body: body !== undefined ? JSON.stringify(body) : undefined }),
  put:    <T>(path: string, body?: unknown)    => request<T>(path, { method: 'PUT',   body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch:  <T>(path: string, body?: unknown)    => request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string)                    => request<T>(path, { method: 'DELETE' }),
};
