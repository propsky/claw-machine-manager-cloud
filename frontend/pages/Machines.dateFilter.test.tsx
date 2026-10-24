// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PaymentItem, PaymentsResponse, ReadingsResponse } from '../types';
import { Machines, MachinesTodayCache } from './Machines';
import { fetchPayments, fetchReadings, fetchStores } from '../services/api';
import { HomeDateFilter } from '../utils/homeDateFilter';
import { RevenueRange } from '../utils/revenueRange';
import { taipeiToday } from '../utils/time';

vi.mock('../services/api', () => ({
  fetchReadings: vi.fn(),
  fetchPayments: vi.fn(),
  fetchStores: vi.fn(),
  restartMachine: vi.fn(),
  startMachine: vi.fn(),
}));

type PendingPayment = {
  start: string;
  end: string;
  page: number | undefined;
  settled: boolean;
  resolve: (value: PaymentsResponse) => void;
};

const pendingPayments: PendingPayment[] = [];

function paymentItem(name: string): PaymentItem {
  return {
    machine_name: name,
    product_name: '',
    coin_amount: 100,
    card_amount: 50,
    total_revenue: 150,
    prize_count: 1,
    cost: 10,
    unit_cost: 10,
    gross_profit: 140,
    average_prize_rate: 0,
    gift_play_count: 0,
    free_play_count: 0,
    card_play_count: 1,
    transaction_count: 1,
    machine_id: name,
    card_machine_number: '1',
    store_name: '大安店',
    machine_display_name: name,
    actual_income: 150,
    settlement_date: '2026-10-22',
    is_settled: true,
    actual_transaction_fee: 0,
    actual_daily_rent: 0,
    happy_cpu_id: `CPU-${name}`,
    data_date: '2026-10-22',
  };
}

function paymentsResponse(items: PaymentItem[]): PaymentsResponse {
  return {
    items,
    summary: undefined,
    total_count: items.length,
    page: 1,
    page_size: 100,
    total_pages: 1,
  };
}

function readingsResponse(date = '2026-10-22', name = '即時機台'): ReadingsResponse {
  return {
    date,
    total_machines: 1,
    items: [{
      store_name: '大安店',
      store_id: 1,
      machine_name: name,
      cpu_id: 'CPU-LIVE',
      clawmachine_id: 1,
      epay_play_count: 1,
      coin_play_count: 2,
      gift_play_count: 0,
      gift_out_count: 0,
      free_play_count: 0,
      total_play_count: 3,
      first_reading_time: `${date}T12:00:00`,
      last_reading_time: `${date}T12:00:00`,
      product_name: null,
      unit_cost: null,
      cost: null,
    }],
  };
}

function filterButtons(): HTMLButtonElement[] {
  return Array.from(screen.getByTestId('machines-date-filters').querySelectorAll('button'));
}

function deferPayments() {
  pendingPayments.length = 0;
  vi.mocked(fetchPayments).mockImplementation((start, end, _storeId, page) => {
    return new Promise<PaymentsResponse>((resolve) => {
      pendingPayments.push({ start, end, page, settled: false, resolve });
    });
  });
}

async function waitPending(pred: (call: PendingPayment) => boolean): Promise<PendingPayment> {
  let found: PendingPayment | undefined;
  await waitFor(() => {
    found = pendingPayments.find((call) => !call.settled && pred(call));
    expect(found).toBeTruthy();
  });
  return found!;
}

function settle(call: PendingPayment, value: PaymentsResponse) {
  call.settled = true;
  call.resolve(value);
}

async function settleInitialLoad() {
  await waitFor(() => {
    expect(document.querySelector('.animate-spin')).toBeNull();
  });
}

beforeEach(() => {
  localStorage.clear();
  MachinesTodayCache.clear();
  pendingPayments.length = 0;
  vi.mocked(fetchReadings).mockResolvedValue(readingsResponse(taipeiToday()));
  vi.mocked(fetchPayments).mockResolvedValue(paymentsResponse([]));
  vi.mocked(fetchStores).mockResolvedValue([{ id: 1, name: '大安店' }]);
});

afterEach(() => {
  cleanup();
  for (const call of pendingPayments) {
    if (!call.settled) settle(call, paymentsResponse([]));
  }
  vi.useRealTimers();
  vi.clearAllMocks();
  localStorage.clear();
  MachinesTodayCache.clear();
});

describe('機台日期篩選按鈕', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    // 2026-10-22 12:00 Asia/Taipei
    vi.setSystemTime(new Date('2026-10-22T04:00:00Z'));
    vi.mocked(fetchReadings).mockResolvedValue(readingsResponse('2026-10-22'));
  });

  it('兩列四顆，順序與首頁相同，即時抄表獨立一列', () => {
    render(<Machines />);

    const grid = screen.getByTestId('machines-date-filters');
    expect(grid.className).toContain('grid-cols-4');
    expect(grid.className).not.toContain('overflow-x-auto');
    expect(filterButtons().map((button) => button.textContent)).toEqual([
      '今日',
      '昨日',
      '前日',
      '大前日',
      '近七天',
      '本週',
      '本月',
      '自訂日期',
    ]);

    const realtime = screen.getByTestId('machines-realtime-tab');
    expect(realtime.textContent).toBe('即時抄表');
    expect(realtime.className).toContain('w-full');
    expect(grid.contains(realtime)).toBe(false);
  });

  it('八個區間的查詢日期與首頁相同，統計仍走 payments', async () => {
    render(<Machines />);

    const expected: Record<Exclude<typeof HomeDateFilter.labels[number]['key'], 'custom'>, { start: string; end: string }> = {
      today: { start: '2026-10-22', end: '2026-10-22' },
      yesterday: { start: '2026-10-21', end: '2026-10-21' },
      day_before_yesterday: { start: '2026-10-20', end: '2026-10-20' },
      three_days_ago: { start: '2026-10-19', end: '2026-10-19' },
      seven_days: { start: '2026-10-16', end: '2026-10-22' },
      week: { start: '2026-10-19', end: '2026-10-22' },
      month: { start: '2026-10-01', end: '2026-10-22' },
    };

    await waitFor(() => {
      expect(vi.mocked(fetchPayments)).toHaveBeenCalledWith('2026-10-22', '2026-10-22', undefined, 1, 100);
    });
    expect(vi.mocked(fetchReadings)).toHaveBeenCalledWith('2026-10-22');

    for (const item of HomeDateFilter.labels) {
      if (item.key === 'today' || item.key === 'custom') continue;
      fireEvent.click(screen.getByRole('button', { name: item.label }));
      const range = expected[item.key];
      await waitFor(() => {
        expect(vi.mocked(fetchPayments)).toHaveBeenCalledWith(range.start, range.end, undefined, 1, 100);
      });
      expect(HomeDateFilter.range(item.key)).toMatchObject(range);
    }

    expect(HomeDateFilter.range('day_before_yesterday').isSingleDay).toBe(true);
    expect(HomeDateFilter.range('three_days_ago').isSingleDay).toBe(true);
    expect(RevenueRange.inclusiveDays(expected.seven_days.start, expected.seven_days.end)).toBe(7);
  });

  it('自訂日期沿用 DateRangeSheet，不合法區間不會送出', async () => {
    render(<Machines />);
    await waitFor(() => {
      expect(vi.mocked(fetchPayments)).toHaveBeenCalledWith('2026-10-22', '2026-10-22', undefined, 1, 100);
    });
    const callsBefore = vi.mocked(fetchPayments).mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: '自訂日期' }));
    expect(screen.getByText('自訂日期範圍')).toBeTruthy();

    const inputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(inputs[0], { target: { value: '2026-10-23' } });
    fireEvent.change(inputs[1], { target: { value: '2026-10-01' } });
    const confirm = screen.getByRole('button', { name: /確認篩選/ });
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(confirm);
    expect(vi.mocked(fetchPayments)).toHaveBeenCalledTimes(callsBefore);
    expect(screen.getByRole('alert').textContent).toBe('開始日期不能晚於結束日期');

    fireEvent.change(inputs[0], { target: { value: '2026-10-01' } });
    fireEvent.change(inputs[1], { target: { value: '2026-10-03' } });
    fireEvent.click(screen.getByRole('button', { name: /確認篩選/ }));

    await waitFor(() => {
      expect(vi.mocked(fetchPayments)).toHaveBeenCalledWith('2026-10-01', '2026-10-03', undefined, 1, 100);
    });
  });

  it('即時抄表仍走 readings，不會改打 payments', async () => {
    render(<Machines />);
    await waitFor(() => {
      expect(vi.mocked(fetchReadings)).toHaveBeenCalledTimes(1);
    });
    const paymentsBefore = vi.mocked(fetchPayments).mock.calls.length;

    fireEvent.click(screen.getByTestId('machines-realtime-tab'));

    await waitFor(() => {
      expect(vi.mocked(fetchReadings)).toHaveBeenCalledTimes(2);
    });
    expect(vi.mocked(fetchReadings)).toHaveBeenLastCalledWith('2026-10-22');
    expect(vi.mocked(fetchPayments)).toHaveBeenCalledTimes(paymentsBefore);
    expect(screen.getByText('即時機台')).toBeTruthy();
  });
});

describe('過期的區間回應', () => {
  it('晚到的舊區間不會蓋掉目前區間', async () => {
    deferPayments();
    render(<Machines />);

    const today = HomeDateFilter.range('today');
    const yesterday = HomeDateFilter.range('yesterday');
    const todayCall = await waitPending((call) => call.start === today.start && call.page === 1);

    fireEvent.click(screen.getByRole('button', { name: '昨日' }));
    const yesterdayCall = await waitPending((call) => call.start === yesterday.start && call.page === 1);
    settle(yesterdayCall, paymentsResponse([paymentItem('昨日機台')]));

    await waitFor(() => {
      expect(screen.getByText('昨日機台')).toBeTruthy();
    });

    settle(todayCall, paymentsResponse([paymentItem('今日機台')]));
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByText('今日機台')).toBeNull();
    expect(screen.getByText('昨日機台')).toBeTruthy();
  });

  it('翻頁途中切換區間，舊的下一頁不會寫進目前列表', async () => {
    deferPayments();
    render(<Machines />);

    const today = HomeDateFilter.range('today');
    const yesterday = HomeDateFilter.range('yesterday');
    const page1 = await waitPending((call) => call.start === today.start && call.page === 1);
    settle(page1, paymentsResponse(Array.from({ length: 100 }, (_, index) => paymentItem(`填充${index}`))));

    const page2 = await waitPending((call) => call.start === today.start && call.page === 2);
    fireEvent.click(screen.getByRole('button', { name: '昨日' }));
    const yesterdayCall = await waitPending((call) => call.start === yesterday.start && call.page === 1);
    settle(yesterdayCall, paymentsResponse([paymentItem('昨日機台')]));

    await waitFor(() => {
      expect(screen.getByText('昨日機台')).toBeTruthy();
    });

    settle(page2, paymentsResponse([paymentItem('舊分頁機台')]));
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByText('舊分頁機台')).toBeNull();
    expect(screen.queryByText('填充0')).toBeNull();
    expect(screen.getByText('昨日機台')).toBeTruthy();
  });
});

describe('今日抄表快取', () => {
  it('以台北日期當 key，換日或超過 5 分鐘就失效', () => {
    const data = readingsResponse('2026-10-23');
    MachinesTodayCache.write('2026-10-23', data, 1_000);

    expect(MachinesTodayCache.read('2026-10-23', 1_000 + MachinesTodayCache.ttlMs - 1)).toBe(data);
    expect(MachinesTodayCache.read('2026-10-24', 1_000)).toBeNull();
    expect(MachinesTodayCache.read('2026-10-23', 1_000 + MachinesTodayCache.ttlMs)).toBeNull();
  });
});

describe('抄表輪詢', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(new Date('2026-10-23T04:00:00Z'));
    vi.mocked(fetchReadings).mockResolvedValue(readingsResponse('2026-10-23'));
  });

  it('不在即時抄表時，30 秒輪詢沿用同一天快取', async () => {
    render(<Machines />);
    await settleInitialLoad();
    expect(vi.mocked(fetchReadings)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetchReadings)).toHaveBeenCalledWith('2026-10-23');

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    expect(vi.mocked(fetchReadings)).toHaveBeenCalledTimes(1);
  });

  it('即時抄表每 30 秒會重新抓抄表，而且不把列表閃成載入中', async () => {
    render(<Machines />);
    await settleInitialLoad();

    fireEvent.click(screen.getByTestId('machines-realtime-tab'));
    await waitFor(() => {
      expect(vi.mocked(fetchReadings)).toHaveBeenCalledTimes(2);
      expect(screen.getByText('即時機台')).toBeTruthy();
    });
    await settleInitialLoad();

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    expect(vi.mocked(fetchReadings)).toHaveBeenCalledTimes(3);
    expect(vi.mocked(fetchReadings)).toHaveBeenLastCalledWith('2026-10-23');
    expect(document.querySelector('.animate-spin')).toBeNull();
    expect(screen.getByText('即時機台')).toBeTruthy();
  });

  it('台北換日後快取失效，下一輪輪詢改抓新的一天', async () => {
    vi.setSystemTime(new Date('2026-10-23T15:59:50Z'));
    vi.mocked(fetchReadings).mockImplementation(async (date: string) => readingsResponse(date));

    render(<Machines />);
    await settleInitialLoad();
    expect(vi.mocked(fetchReadings)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetchReadings)).toHaveBeenCalledWith('2026-10-23');

    vi.setSystemTime(new Date('2026-10-23T16:00:05Z'));
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    expect(vi.mocked(fetchReadings)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetchReadings)).toHaveBeenLastCalledWith('2026-10-24');
  });
});
