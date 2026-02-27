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

export async function fetchReadings(date: string, storeId?: number): Promise<ReadingsResponse> {
  const params = new URLSearchParams({ date });
  if (storeId) params.set('store_id', String(storeId));
  const url = getBaseUrl(`/api/store-app/readings?${params.toString()}`);
  const response = await authFetch(url);
  return response.json();
}

export async function fetchMachinesStatus(storeId?: number): Promise<MachinesStatusResponse> {
  const params = new URLSearchParams();
  if (storeId) params.set('store_id', String(storeId));
  const url = getBaseUrl(`/api/store-app/machines/status?${params.toString()}`);
  const response = await authFetch(url);
  return response.json();
}

export async function fetchBalance(storeId?: number): Promise<BalanceResponse> {
  const params = new URLSearchParams();
  if (storeId) params.set('store_id', String(storeId));
  const url = getBaseUrl(`/api/store-app/balance?${params.toString()}`);
  const response = await authFetch(url);
  return response.json();
}

export async function fetchActivity(storeId?: number): Promise<ActivityResponse> {
  const params = new URLSearchParams();
  if (storeId) params.set('store_id', String(storeId));
  const url = getBaseUrl(`/api/store-app/activity?${params.toString()}`);
  const response = await authFetch(url);
  return response.json();
}

export async function fetchPayments(startDate: string, endDate: string, storeId?: number, page?: number, pageSize?: number): Promise<PaymentsResponse> {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
  if (storeId) params.set('store_id', String(storeId));
  if (page !== undefined) params.set('page', String(page));
  if (pageSize !== undefined) params.set('page_size', String(pageSize));
  const url = getBaseUrl(`/api/store-app/payments?${params.toString()}`);
  const response = await authFetch(url);
  return response.json();
}

// ==================== SmartPay 機台 API ====================

// 場地選單
export interface StoreOption {
  id: number;
  name: string;
}

export async function fetchStores(): Promise<StoreOption[]> {
  const url = getBaseUrl('/api/stores/options');
  const response = await authFetch(url);
  return response.json();
}

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

export async function applyWithdrawal(amount: number, bankAccount?: {
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
}): Promise<WithdrawalApplyResponse> {
  const url = getBaseUrl('/api/withdrawal/apply');
  const body: any = { amount };
  
  // 如果有銀行帳戶資料，一併傳送
  if (bankAccount) {
    body.bank_code = bankAccount.bank_code;
    body.bank_name = bankAccount.bank_name;
    body.account_number = bankAccount.account_number;
    body.account_holder_name = bankAccount.account_holder_name;
  }
  
  const response = await authFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
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
