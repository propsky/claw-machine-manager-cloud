export enum MachineStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR'
}

export interface Machine {
  id: string;
  name: string;
  status: MachineStatus;
  statusDetail?: string;
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

// ===== Store-App API Response Types =====

// GET /api/store-app/readings
export interface ReadingItem {
  store_name: string;
  store_id: number;
  machine_name: string;
  cpu_id: string;
  epay_play_count: number;
  coin_play_count: number;
  gift_play_count: number;
  gift_out_count: number;
  free_play_count: number;
  total_play_count: number;
  first_reading_time: string;
  last_reading_time: string;
}

export interface ReadingsResponse {
  date: string;
  total_machines: number;
  items: ReadingItem[];
  summary?: {
    total_epay: number;
    total_coin: number;
    total_gift_out: number;
    total_play: number;
  };
}

// GET /api/store-app/machines/status
export interface MachineStatusItem {
  id: number;
  machine_code: string;
  name: string | null;
  store_name: string;
  store_id: number;
  connection_status: 'online' | 'offline' | 'unstable' | 'unknown';
  last_online_time: string | null;
  status: 'active' | 'maintenance' | 'offline' | 'inactive';
}

export interface MachinesStatusResponse {
  total: number;
  online: number;
  offline: number;
  unstable: number;
  machines: MachineStatusItem[];
}

// GET /api/store-app/balance
export interface BalanceResponse {
  balance: {
    total_amount: number;
    frozen_amount: number;
    available_amount: number;
    currency: string;
  };
  fee_summary: unknown;
}

// GET /api/store-app/activity
export interface ActivityItem {
  type: 'income' | 'withdrawal';
  date: string;
  amount: number;
  description: string;
  details: {
    order_no: string;
    before_amount: number;
    after_amount: number;
  };
}

export interface ActivityResponse {
  items: ActivityItem[];
  total_count: number;
}

// GET /api/store-app/payments
export interface PaymentItem {
  machine_name: string;
  product_name: string;
  coin_amount: number;
  card_amount: number;
  total_revenue: number;
  prize_count: number;
  cost: number;
  average_prize_rate: number;
  gift_play_count: number;
  free_play_count: number;
  card_play_count: number;
  transaction_count: number;
  machine_id: string;
  card_machine_number: string;
  store_name: string;
  machine_display_name: string;
  actual_income: number;
  settlement_date: string;
  is_settled: boolean;
  actual_transaction_fee: number;
  actual_daily_rent: number;
  happy_cpu_id: string;
  data_date: string;
}

export interface PaymentsSummary {
  total_revenue: number;
  total_card_amount: number;
  total_coin_amount: number;
  total_prize_count: number;
  total_actual_income: number;
  total_actual_transaction_fee: number;
  total_actual_daily_rent: number;
  total_card_play_count: number;
  total_transaction_count: number;
}

export interface PaymentsResponse {
  items: PaymentItem[];
  summary?: PaymentsSummary;
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Legacy API types (kept for reference)
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
