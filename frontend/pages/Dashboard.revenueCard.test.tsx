// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PaymentsResponse, PaymentsSummary } from '../types';
import { Dashboard } from './Dashboard';
import {
  fetchActivity,
  fetchBalance,
  fetchMeterReadings,
  fetchPayments,
  fetchStores,
} from '../services/api';

vi.mock('../services/api', () => ({
  fetchMeterReadings: vi.fn(),
  fetchBalance: vi.fn(),
  fetchActivity: vi.fn(),
  fetchPayments: vi.fn(),
  fetchStores: vi.fn(),
}));

type PendingCall = {
  start: string;
  end: string;
  storeId: number | undefined;
  page: number | undefined;
  pageSize: number | undefined;
  settled: boolean;
  resolve: (value: PaymentsResponse) => void;
};

const pending: PendingCall[] = [];

function payments(coin: number, card = 0): PaymentsResponse {
  const summary = {
    total_revenue: coin + card,
    total_card_amount: card,
    total_coin_amount: coin,
    total_prize_count: 0,
    total_actual_income: 0,
    total_actual_transaction_fee: 0,
    total_actual_daily_rent: 0,
    total_card_play_count: 0,
    total_transaction_count: 0,
    total_cost: 0,
    total_gross_profit: 0,
  } satisfies PaymentsSummary;
  return {
    items: [],
    summary,
    total_count: 0,
    page: 1,
    page_size: 100,
    total_pages: 1,
  };
}

function money(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

function revenueCard(): HTMLElement {
  const el = document.querySelector('[data-testid="revenue-report-card"]');
  if (!(el instanceof HTMLElement)) throw new Error('找不到營收報表卡片');
  return el;
}

function topRevenue(): HTMLElement {
  const el = document.querySelector('h1.text-primary');
  if (!(el instanceof HTMLElement)) throw new Error('找不到頂部營收');
  return el;
}

async function waitPending(pred: (call: PendingCall) => boolean): Promise<PendingCall> {
  let found: PendingCall | undefined;
  await waitFor(() => {
    found = pending.find(call => !call.settled && pred(call));
    expect(found).toBeTruthy();
  });
  return found!;
}

function settle(call: PendingCall, value: PaymentsResponse) {
  call.settled = true;
  call.resolve(value);
}

const isTodayPage = (call: PendingCall) => call.page === 1 && call.start === call.end;
const isSummary = (call: PendingCall) => call.page === undefined && call.start === call.end;
const isModalRange = (call: PendingCall) => call.page === 1 && call.start !== call.end;

beforeEach(() => {
  pending.length = 0;
  localStorage.clear();
  vi.mocked(fetchPayments).mockImplementation((start, end, storeId, page, pageSize) => {
    return new Promise<PaymentsResponse>((resolve) => {
      pending.push({
        start,
        end,
        storeId,
        page,
        pageSize,
        settled: false,
        resolve,
      });
    });
  });
  vi.mocked(fetchMeterReadings).mockResolvedValue({
    total_machines: 0,
    machines_with_data: 0,
    items: [],
  });
  vi.mocked(fetchBalance).mockResolvedValue({
    balance: {
      total_amount: 0,
      frozen_amount: 0,
      available_amount: 0,
      currency: 'TWD',
    },
    fee_summary: null,
  });
  vi.mocked(fetchActivity).mockResolvedValue({ items: [], total_count: 0 });
  vi.mocked(fetchStores).mockResolvedValue([
    { id: 1, name: '大安店' },
    { id: 2, name: '信義店' },
  ]);
});

afterEach(() => {
  cleanup();
  for (const call of pending) {
    if (!call.settled) settle(call, payments(0, 0));
  }
  vi.clearAllMocks();
  localStorage.clear();
});

describe('首頁營收報表卡片', () => {
  it('資料還沒到時顯示 --，而不是 $0', async () => {
    render(<Dashboard />);

    expect(revenueCard().textContent).toContain('今日');
    expect(revenueCard().textContent).toContain('--');
    expect(revenueCard().textContent).not.toContain('$');
    expect(screen.queryByText(/營收報告/)).toBeNull();

    const today = await waitPending(isTodayPage);
    expect(today.pageSize).toBe(100);
    expect(revenueCard().textContent).toContain('--');
    expect(revenueCard().textContent).not.toContain('$0');
    expect(screen.queryByText(/營收報告/)).toBeNull();
  });

  it('不打開 Modal 也會顯示今天的實際金額', async () => {
    render(<Dashboard />);

    const today = await waitPending(isTodayPage);
    settle(today, payments(1000, 280));

    await waitFor(() => {
      expect(revenueCard().textContent).toContain(money(1280));
    });
    expect(revenueCard().textContent).toContain('今日');
    expect(revenueCard().textContent).not.toContain('--');
    expect(screen.queryByText(/營收報告/)).toBeNull();
  });

  it('載入完成且合計為 0 時顯示 $0', async () => {
    render(<Dashboard />);

    const today = await waitPending(isTodayPage);
    settle(today, payments(0, 0));

    await waitFor(() => {
      expect(revenueCard().textContent).toContain('$0');
    });
    expect(revenueCard().textContent).not.toContain('--');
  });

  it('Modal 改區間不會改掉卡片的今日金額，頂部數字也不會閃成 --', async () => {
    render(<Dashboard />);

    const summary = await waitPending(isSummary);
    settle(summary, payments(8000, 0));
    await waitFor(() => {
      expect(topRevenue().textContent).toContain(money(8000));
    });
    expect(revenueCard().textContent).toContain('--');

    const today = await waitPending(call => isTodayPage(call) && call.storeId === undefined);
    settle(today, payments(1000, 280));
    await waitFor(() => {
      expect(revenueCard().textContent).toContain(money(1280));
    });
    expect(screen.queryByText(/營收報告/)).toBeNull();

    fireEvent.click(revenueCard());
    expect(screen.getByText(/營收報告/)).toBeTruthy();

    const day7 = await waitPending(isModalRange);
    expect(topRevenue().textContent).toContain(money(8000));
    expect(topRevenue().textContent).not.toContain('--');
    expect(revenueCard().textContent).toContain(money(1280));

    settle(day7, payments(99999, 0));
    await waitFor(() => {
      expect(screen.getByText('總營收').parentElement?.textContent).toContain(money(99999));
    });
    expect(revenueCard().textContent).toContain(money(1280));
    expect(revenueCard().textContent).not.toContain(money(99999));
    expect(topRevenue().textContent).toContain(money(8000));

    fireEvent.click(screen.getByRole('button', { name: '30天內' }));
    const day30 = await waitPending(isModalRange);
    expect(topRevenue().textContent).not.toContain('--');
    expect(revenueCard().textContent).toContain(money(1280));

    settle(day30, payments(11111, 0));
    await waitFor(() => {
      expect(screen.getByText('總營收').parentElement?.textContent).toContain(money(11111));
    });
    expect(revenueCard().textContent).toContain(money(1280));
    expect(revenueCard().textContent).not.toContain(money(11111));
    expect(revenueCard().textContent).not.toContain(money(99999));
    expect(topRevenue().textContent).toContain(money(8000));
  });

  it('切換場地會改抓該場地的今日營收，在新資料來到前顯示 --', async () => {
    render(<Dashboard />);

    const today = await waitPending(call => isTodayPage(call) && call.storeId === undefined);
    settle(today, payments(1000, 280));
    await waitFor(() => {
      expect(revenueCard().textContent).toContain(money(1280));
    });

    fireEvent.click(screen.getByText('全部場地'));
    await screen.findByText('大安店');
    fireEvent.click(screen.getByText('大安店'));

    expect(revenueCard().textContent).toContain('--');
    expect(revenueCard().textContent).not.toContain(money(1280));

    const storeToday = await waitPending(call => isTodayPage(call) && call.storeId === 1);
    settle(storeToday, payments(70, 0));
    await waitFor(() => {
      expect(revenueCard().textContent).toContain(money(70));
    });
    expect(screen.queryByText(/營收報告/)).toBeNull();
  });

  it('Modal 的 24 小時與再次開啟沿用 30 分鐘 cache，不重打同一筆', async () => {
    render(<Dashboard />);

    const today = await waitPending(isTodayPage);
    settle(today, payments(1000, 280));
    await waitFor(() => {
      expect(revenueCard().textContent).toContain(money(1280));
    });

    fireEvent.click(revenueCard());
    const day7 = await waitPending(isModalRange);
    settle(day7, payments(99999, 0));
    await waitFor(() => {
      expect(screen.getByText('總營收').parentElement?.textContent).toContain(money(99999));
    });

    const rangeCalls = pending.filter(isModalRange).length;
    fireEvent.click(screen.getByRole('button', { name: '關閉' }));
    fireEvent.click(revenueCard());
    await waitFor(() => {
      expect(screen.getByText('總營收').parentElement?.textContent).toContain(money(99999));
    });
    expect(pending.filter(isModalRange).length).toBe(rangeCalls);
    expect(revenueCard().textContent).toContain(money(1280));

    const todayPageCalls = pending.filter(isTodayPage).length;
    fireEvent.click(screen.getByRole('button', { name: '24小時內' }));
    await waitFor(() => {
      expect(screen.getByText('總營收').parentElement?.textContent).toContain(money(1280));
    });
    expect(pending.filter(isTodayPage).length).toBe(todayPageCalls);
    expect(pending.filter(isModalRange).length).toBe(rangeCalls);
    expect(revenueCard().textContent).toContain(money(1280));
  });
});
