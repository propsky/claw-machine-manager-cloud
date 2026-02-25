export enum MachineStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR'
}

export interface Machine {
  id: string;
  name: string;
  status: MachineStatus;
  statusDetail?: string; // e.g. "馬達異常"
  lastUpdated: string;
  revenue: number;
  accumulated: number;
  grossMargin: string;
  payoutCount: number;
  avgPayout: number;
}

export interface Transaction {
  id: string;
  type: 'income' | 'withdraw';
  title: string;
  date: string;
  amount: number;
}

// API Response Types
export interface ApiMachine {
  machine_code: string;
  machine_name: string | null;
  location_machine_number: string;
  cpu_id: string;
  reading_machine_id: string | null;
  reading_shop_name: string;
  reading_shop_address: string;
  reading_machine_name: string;
  epay_play_times: number;
  coin_play_times: number;
  gift_play_times: number;
  gift_out_times: number;
  free_play_times: number;
  total_play_times: number;
  last_reading_time: string;
}

export interface StoreReadingsResponse {
  store_id: number;
  store_name: string;
  total_machines: number;
  machines_with_data: number;
  query_time: string;
  machines: ApiMachine[];
}

// 銀行帳戶相關類型
export interface FavoriteBankAccount {
  id: number;
  user_id: number;
  bank_code: string;
  bank_name: string;
  branch_name: string | null;
  account_number: string;
  account_holder_name: string;
  memo: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface FavoriteBankAccountListResponse {
  total_count: number;
  accounts: FavoriteBankAccount[];
}

// 提領相關類型
export interface WithdrawalApplyResponse {
  message: string;
  request_id: number;
  request_no: string;
}
