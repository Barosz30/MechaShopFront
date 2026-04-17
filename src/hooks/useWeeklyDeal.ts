import { useDealCycleContext } from '../context/DealCycleContext';
import { useCountdown } from './useCountdown';

export function useWeeklyDeal() {
  const contextValue = useDealCycleContext();

  if (contextValue) {
    return contextValue;
  }

  return useCountdown({
    activeDurationMs: 1000 * 60 * 60 * 24 * 5 + 1000 * 60 * 60 * 7,
    cycleDurationMs: 1000 * 60 * 60 * 24 * 7,
    anchorTimeMs: Date.UTC(2026, 3, 15, 7, 0, 0),
    storageKey: 'mechashop-weekly-spotlight-cycle-v3',
  });
}
