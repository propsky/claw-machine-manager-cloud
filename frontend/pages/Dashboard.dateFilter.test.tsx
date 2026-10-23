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
import { HomeDateFilter } from '../utils/homeDateFilter';
import { RevenueRange } from '../utils/revenueRange';
import { TodayRevenueCard } from '../utils/todayRevenueCard';

vi.mock('../services/api', () => ({
  fetchMeterReadings: vi.fn(),
  fetchBalance: vi.fn(),
  fetchActivity: vi.fn(),
  fetchPayments: vi.fn(),
  fetchStores: vi.fn(),
}));

function payments(): PaymentsResponse {
  const summary = {
    total_revenue: 0,
    total_card_amount: 0,
    total_coin_amount: 0,
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

function filterButtons(): HTMLButtonElement[] {
  return Array.from(screen.getByTestId('home-date-filters').querySelectorAll('button'));
}

beforeEach(() => {
  localStorage.clear();
  vi.mocked(fetchPayments).mockResolvedValue(payments());
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
  vi.mocked(fetchStores).mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});

describe('首頁日期篩選按鈕', () => {
  it('兩列四顆，順序與文案固定，且不橫向捲動', () => {
    render(<Dashboard />);

    const row = screen.getByTestId('home-date-filters');
    expect(row.className).toContain('grid-cols-4');
    expect(row.className).not.toContain('overflow-x-auto');

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
  });

  it('點前日、大前日會各查一天', async () => {
    render(<Dashboard />);

    fireEvent.click(screen.getByRole('button', { name: '前日' }));
    const dayBefore = HomeDateFilter.range('day_before_yesterday');
    await waitFor(() => {
      expect(vi.mocked(fetchPayments)).toHaveBeenCalledWith(
        dayBefore.start,
        dayBefore.end,
        undefined,
      );
    });
    expect(dayBefore.start).toBe(dayBefore.end);
    expect(dayBefore.isSingleDay).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: '大前日' }));
    const threeDays = HomeDateFilter.range('three_days_ago');
    await waitFor(() => {
      expect(vi.mocked(fetchPayments)).toHaveBeenCalledWith(
        threeDays.start,
        threeDays.end,
        undefined,
      );
    });
    expect(threeDays.start).toBe(threeDays.end);
    expect(threeDays.start).not.toBe(dayBefore.start);
  });

  it('近七天只改標籤，查詢仍是七個日曆日', async () => {
    render(<Dashboard />);

    fireEvent.click(screen.getByRole('button', { name: '近七天' }));
    const range = HomeDateFilter.range('seven_days');
    await waitFor(() => {
      expect(vi.mocked(fetchPayments)).toHaveBeenCalledWith(range.start, range.end, undefined);
    });
    expect(range.isSingleDay).toBe(false);
    expect(RevenueRange.inclusiveDays(range.start, range.end)).toBe(7);
  });

  it('營收報表卡片仍是今日，Modal 區間文案不變', async () => {
    render(<Dashboard />);

    expect(screen.getByTestId('revenue-report-card').textContent).toContain(TodayRevenueCard.label);
    expect(TodayRevenueCard.label).toBe('今日');
    expect(RevenueRange.options.map((item) => item.label)).toEqual(['24小時內', '3天內', '7天內', '30天內']);

    fireEvent.click(screen.getByTestId('revenue-report-card'));
    expect(screen.getByRole('button', { name: '7天內' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '24小時內' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '30天內' })).toBeTruthy();
  });
});
