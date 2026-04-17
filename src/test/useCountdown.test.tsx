import { act, renderHook } from '@testing-library/react';
import { beforeEach, afterEach, vi } from 'vitest';
import { useCountdown } from '../hooks/useCountdown';

const storageKey = 'mechashop-countdown-test';

describe('useCountdown persistence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-15T09:00:00.000Z'));
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('persists deterministic deal cycle state in localStorage', () => {
    const { result } = renderHook(() =>
      useCountdown({
        activeDurationMs: 1000 * 60 * 60 * 2,
        cycleDurationMs: 1000 * 60 * 60 * 6,
        anchorTimeMs: new Date('2026-04-15T08:00:00.000Z').getTime(),
        storageKey,
      }),
    );

    const storedState = window.localStorage.getItem(storageKey);
    expect(storedState).not.toBeNull();
    expect(result.current.phase).toBe('active');
    expect(result.current.hours).toBe(1);
    expect(result.current.minutes).toBe(0);
  });

  it('transitions from active to cooldown and keeps storage in sync', () => {
    const { result } = renderHook(() =>
      useCountdown({
        activeDurationMs: 1000 * 60 * 60 * 2,
        cycleDurationMs: 1000 * 60 * 60 * 6,
        anchorTimeMs: new Date('2026-04-15T08:00:00.000Z').getTime(),
        storageKey,
      }),
    );

    act(() => {
      vi.setSystemTime(new Date('2026-04-15T10:30:00.000Z'));
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.phase).toBe('cooldown');
    expect(result.current.hours).toBe(3);

    const storedState = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as {
      phase?: string;
      countdownTargetDate?: number;
    };

    expect(storedState.phase).toBe('cooldown');
    expect(typeof storedState.countdownTargetDate).toBe('number');
  });
});
