import { getToken, logout } from './auth';
import type {
  ReadingsResponse,
  MachinesStatusResponse,
  BalanceResponse,
  ActivityResponse,
  PaymentsResponse,
} from '../types';

const isDev = import.meta.env.DEV;

async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...((options?.headers as Record<string, string>) || {}),
    'Authorization': `Bearer ${token}`,
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    logout();
    throw new Error('登入已過期，請重新登入');
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response;
}

function getBaseUrl(path: string): string {
  if (isDev) {
    // 開發環境直接走 Vite proxy
    return path;
  }
  // 生產環境走 CF Functions
  return path;
}

export async function fetchReadings(date: string): Promise<ReadingsResponse> {
  const url = getBaseUrl(`/api/store-app/readings?date=${date}`);
  const response = await authFetch(url);
  return response.json();
}

export async function fetchMachinesStatus(): Promise<MachinesStatusResponse> {
  const url = getBaseUrl('/api/store-app/machines/status');
  const response = await authFetch(url);
  return response.json();
}

export async function fetchBalance(): Promise<BalanceResponse> {
  const url = getBaseUrl('/api/store-app/balance');
  const response = await authFetch(url);
  return response.json();
}

export async function fetchActivity(): Promise<ActivityResponse> {
  const url = getBaseUrl('/api/store-app/activity');
  const response = await authFetch(url);
  return response.json();
}

export async function fetchPayments(startDate: string, endDate: string): Promise<PaymentsResponse> {
  const url = getBaseUrl(`/api/store-app/payments?start_date=${startDate}&end_date=${endDate}`);
  const response = await authFetch(url);
  return response.json();
}
