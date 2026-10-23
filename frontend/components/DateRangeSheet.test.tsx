// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DateRangeSheet } from './DateRangeSheet';

function renderSheet(onConfirm = vi.fn()) {
  render(
    <DateRangeSheet
      isOpen
      onClose={vi.fn()}
      onConfirm={onConfirm}
    />,
  );
  return onConfirm;
}

function setRange(start: string, end: string) {
  const inputs = document.querySelectorAll('input[type="date"]');
  fireEvent.change(inputs[0], { target: { value: start } });
  fireEvent.change(inputs[1], { target: { value: end } });
}

function confirmButton(): HTMLButtonElement {
  const button = screen.getByRole('button', { name: /確認篩選/ });
  if (!(button instanceof HTMLButtonElement)) throw new Error('找不到確認按鈕');
  return button;
}

afterEach(() => {
  cleanup();
});

describe('DateRangeSheet 自訂日期驗證', () => {
  it('開始晚於結束時顯示錯誤並停用確認', () => {
    const onConfirm = renderSheet();
    setRange('2026-10-23', '2026-10-01');

    expect(screen.getByRole('alert').textContent).toBe('開始日期不能晚於結束日期');
    expect(confirmButton().disabled).toBe(true);

    fireEvent.click(confirmButton());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('超過 90 天時顯示錯誤並停用確認', () => {
    const onConfirm = renderSheet();
    setRange('2026-01-01', '2026-04-01');

    expect(screen.getByRole('alert').textContent).toBe('日期區間不能超過 90 天');
    expect(confirmButton().disabled).toBe(true);

    fireEvent.click(confirmButton());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('剛好 90 天可以確認', () => {
    const onConfirm = renderSheet();
    setRange('2026-01-01', '2026-03-31');

    expect(screen.queryByRole('alert')).toBeNull();
    expect(confirmButton().disabled).toBe(false);

    fireEvent.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledWith('2026-01-01', '2026-03-31');
  });

  it('只填一邊時不顯示錯誤，確認維持停用', () => {
    renderSheet();
    const inputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(inputs[0], { target: { value: '2026-10-01' } });

    expect(screen.queryByRole('alert')).toBeNull();
    expect(confirmButton().disabled).toBe(true);
  });
});
