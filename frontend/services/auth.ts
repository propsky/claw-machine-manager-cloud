const TOKEN_KEY = 'smartpay_token';

export async function login(username: string, password: string): Promise<void> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || '登入失敗，請確認帳號密碼');
  }

  const data = await response.json();
  localStorage.setItem(TOKEN_KEY, data.access_token);
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  window.location.hash = '#/login';
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    if (Date.now() >= exp) {
      localStorage.removeItem(TOKEN_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
