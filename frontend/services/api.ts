import { getToken, logout } from './auth';
import type {
  ReadingsResponse,
  MachinesStatusResponse,
  BalanceResponse,
  ActivityResponse,
  PaymentsResponse,
  FavoriteBankAccount,
  FavoriteBankAccountListResponse,
  WithdrawalApplyResponse,
  StoreReadingsResponse,
} from '../types';

const isDev = import.meta.env.DEV;

async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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
    return path;
  }
  return path;
}

// 使用者資料
export interface UserProfile {
  id: number;
  username: string;
  nickname: string | null;
  real_name: string | null;
  email: string | null;
  phone: string;
  bank_account: string | null;
  id_card_number: string | null;
  is_verified: boolean;
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const url = getBaseUrl('/api/users/me');
  const response = await authFetch(url);
  return response.json();
}

export async function updateUserProfile(data: {
  real_name?: string;
  phone?: string;
  bank_account?: string;
  id_card_number?: string;
  nickname?: string;
}): Promise<UserProfile> {
  // 先取得 user_id
  const profile = await fetchUserProfile();
  const url = getBaseUrl(`/api/users/${profile.id}`);
  const response = await authFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
}

// ==================== 舊的 API 函數 ====================

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

// ==================== SmartPay 機台 API ====================

const SMARTPAY_API_KEY = import.meta.env.VITE_SMARTPAY_API_KEY || '';

export async function fetchStoreReadings(storeId: number): Promise<StoreReadingsResponse> {
  let response: Response;

  if (isDev) {
    response = await fetch(`/api/smartpay/external/store/${storeId}/readings`, {
      headers: { 'X-API-Key': SMARTPAY_API_KEY },
    });
  } else {
    response = await fetch(`/api/readings?storeId=${storeId}`);
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

// ==================== 銀行帳戶 API ====================

export async function fetchBankAccounts(): Promise<FavoriteBankAccountListResponse> {
  const url = getBaseUrl('/api/favorite-bank-accounts');
  const response = await authFetch(url);
  return response.json();
}

export async function createBankAccount(account: {
  bank_code: string;
  bank_name: string;
  branch_name?: string;
  account_number: string;
  account_holder_name: string;
  is_default?: boolean;
}): Promise<FavoriteBankAccount> {
  const url = getBaseUrl('/api/favorite-bank-accounts');
  const response = await authFetch(url, {
    method: 'POST',
    body: JSON.stringify(account),
  });
  return response.json();
}

export async function updateBankAccount(accountId: number, account: {
  bank_code?: string;
  bank_name?: string;
  branch_name?: string;
  account_number?: string;
  account_holder_name?: string;
  is_default?: boolean;
}): Promise<FavoriteBankAccount> {
  const url = getBaseUrl(`/api/favorite-bank-accounts/${accountId}`);
  const response = await authFetch(url, {
    method: 'PUT',
    body: JSON.stringify(account),
  });
  return response.json();
}

export async function deleteBankAccount(accountId: number): Promise<{ message: string }> {
  const url = getBaseUrl(`/api/favorite-bank-accounts/${accountId}`);
  const response = await authFetch(url, {
    method: 'DELETE',
  });
  return response.json();
}

export async function setDefaultBankAccount(accountId: number): Promise<FavoriteBankAccount> {
  const url = getBaseUrl(`/api/favorite-bank-accounts/${accountId}/set-default`);
  const response = await authFetch(url, {
    method: 'PATCH',
  });
  return response.json();
}

// ==================== 提領 API ====================

export async function applyWithdrawal(amount: number): Promise<WithdrawalApplyResponse> {
  const url = getBaseUrl('/api/withdrawal/apply');
  const response = await authFetch(url, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  return response.json();
}

export async function fetchWithdrawalRequests(params?: {
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<{ total_count: number; page: number; page_size: number; requests: any[] }> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.page_size) query.set('page_size', String(params.page_size));
  
  const queryString = query.toString();
  const url = getBaseUrl(`/api/withdrawal/my-requests${queryString ? '?' + queryString : ''}`);
  const response = await authFetch(url);
  return response.json();
}
