import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import type { DealCycleState } from '../types';
import { useCountdown } from '../hooks/useCountdown';

const dealCountdownConfig = {
  activeDurationMs: 1000 * 60 * 60 * 24 * 5 + 1000 * 60 * 60 * 7,
  cycleDurationMs: 1000 * 60 * 60 * 24 * 7,
  anchorTimeMs: Date.UTC(2026, 3, 15, 7, 0, 0),
  storageKey: 'mechashop-weekly-spotlight-cycle-v3',
} as const;

const DealCycleContext = createContext<DealCycleState | undefined>(undefined);

export function DealCycleProvider({ children }: { children: ReactNode }) {
  const dealState = useCountdown(dealCountdownConfig);
  const value = useMemo(() => dealState, [dealState]);

  return <DealCycleContext.Provider value={value}>{children}</DealCycleContext.Provider>;
}

export function useDealCycleContext() {
  return useContext(DealCycleContext);
}
