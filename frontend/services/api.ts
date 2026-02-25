import { StoreReadingsResponse, FavoriteBankAccount, FavoriteBankAccountListResponse, WithdrawalApplyResponse } from '../types';

const SMARTPAY_API_KEY = import.meta.env.VITE_SMARTPAY_API_KEY || '';
const isDev = import.meta.env.DEV;

// 通用 API 請求函數
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const baseUrl = isDev ? '/api' : '';
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }

  return response.json();
}

// 讀取用戶的銀行帳戶列表
export async function fetchBankAccounts(): Promise<FavoriteBankAccountListResponse> {
  return apiRequest<FavoriteBankAccountListResponse>('/favorite-bank-accounts');
}

// 新增銀行帳戶
export async function createBankAccount(account: {
  bank_code: string;
  bank_name: string;
  branch_name?: string;
  account_number: string;
  account_holder_name: string;
  is_default?: boolean;
}): Promise<FavoriteBankAccount> {
  return apiRequest<FavoriteBankAccount>('/favorite-bank-accounts', {
    method: 'POST',
    body: JSON.stringify(account),
  });
}

// 更新銀行帳戶
export async function updateBankAccount(accountId: number, account: {
  bank_code?: string;
  bank_name?: string;
  branch_name?: string;
  account_number?: string;
  account_holder_name?: string;
  is_default?: boolean;
}): Promise<FavoriteBankAccount> {
  return apiRequest<FavoriteBankAccount>(`/favorite-bank-accounts/${accountId}`, {
    method: 'PUT',
    body: JSON.stringify(account),
  });
}

// 刪除銀行帳戶
export async function deleteBankAccount(accountId: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/favorite-bank-accounts/${accountId}`, {
    method: 'DELETE',
  });
}

// 設定預設帳戶
export async function setDefaultBankAccount(accountId: number): Promise<FavoriteBankAccount> {
  return apiRequest<FavoriteBankAccount>(`/favorite-bank-accounts/${accountId}/set-default`, {
    method: 'PATCH',
  });
}

// 申請提領
export async function applyWithdrawal(amount: number): Promise<WithdrawalApplyResponse> {
  return apiRequest<WithdrawalApplyResponse>('/withdrawal/apply', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

// 查詢提領紀錄
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
  return apiRequest<{ total_count: number; page: number; page_size: number; requests: any[] }>(
    `/withdrawal/my-requests${queryString ? '?' + queryString : ''}`
  );
}

// ==================== 以下的代碼是原本的 ====================

export async function fetchStoreReadings(storeId: number): Promise<StoreReadingsResponse> {
  let response: Response;

  if (isDev) {
    // 開發環境：透過 Vite proxy
    response = await fetch(`/api/smartpay/external/store/${storeId}/readings`, {
      headers: { 'X-API-Key': SMARTPAY_API_KEY },
    });
  } else {
    // 生產環境：透過 Vercel Serverless Function
    response = await fetch(`/api/readings?storeId=${storeId}`);
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
