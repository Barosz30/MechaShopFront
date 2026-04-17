import { useEffect, useState } from 'react';
import type { DealCycleState } from '../types';

interface CountdownConfig {
  activeDurationMs: number;
  cycleDurationMs: number;
  anchorTimeMs: number;
  storageKey?: string;
}

interface StoredCountdownState {
  version: 1;
  phase: DealCycleState['phase'];
  countdownTargetDate: number;
  activeUntil: number;
  nextCycleStart: number;
}

function getTimeLeft(targetDate: number) {
  const difference = Math.max(0, targetDate - Date.now());

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStoredState(storageKey?: string) {
  if (!storageKey || !canUseLocalStorage()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<StoredCountdownState>;

    if (
      parsedValue.version !== 1 ||
      (parsedValue.phase !== 'active' && parsedValue.phase !== 'cooldown') ||
      !Number.isFinite(parsedValue.countdownTargetDate) ||
      !Number.isFinite(parsedValue.activeUntil) ||
      !Number.isFinite(parsedValue.nextCycleStart)
    ) {
      return null;
    }

    return parsedValue as StoredCountdownState;
  } catch {
    return null;
  }
}

function persistState(storageKey: string | undefined, state: DealCycleState) {
  if (!storageKey || !canUseLocalStorage()) {
    return;
  }

  try {
    const storedState: StoredCountdownState = {
      version: 1,
      phase: state.phase,
      countdownTargetDate: state.countdownTargetDate,
      activeUntil: state.activeUntil,
      nextCycleStart: state.nextCycleStart,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(storedState));
  } catch {
    // Ignore storage failures and continue with in-memory countdown state.
  }
}

function resolveCountdownState(config: CountdownConfig) {
  const { activeDurationMs, cycleDurationMs, anchorTimeMs, storageKey } = config;
  const now = Date.now();
  const elapsedMs = now - anchorTimeMs;
  const cycleIndex = elapsedMs >= 0 ? Math.floor(elapsedMs / cycleDurationMs) : -1;
  const cycleStart =
    cycleIndex >= 0 ? anchorTimeMs + cycleIndex * cycleDurationMs : anchorTimeMs;
  const activeUntil = cycleStart + activeDurationMs;
  const nextCycleStart =
    cycleIndex >= 0 ? cycleStart + cycleDurationMs : anchorTimeMs;
  const phase: DealCycleState['phase'] =
    now >= cycleStart && now < activeUntil ? 'active' : 'cooldown';
  const countdownTargetDate = phase === 'active' ? activeUntil : nextCycleStart;
  const storedState = readStoredState(storageKey);

  const resolvedState: DealCycleState = {
    phase,
    countdownTargetDate,
    activeUntil,
    nextCycleStart,
    ...getTimeLeft(countdownTargetDate),
  };

  const shouldPersist =
    !storedState ||
    storedState.phase !== resolvedState.phase ||
    storedState.countdownTargetDate !== resolvedState.countdownTargetDate ||
    storedState.activeUntil !== resolvedState.activeUntil ||
    storedState.nextCycleStart !== resolvedState.nextCycleStart;

  if (shouldPersist) {
    persistState(storageKey, resolvedState);
  }

  return resolvedState;
}

export function useCountdown(config: CountdownConfig) {
  const [countdownState, setCountdownState] = useState(() => resolveCountdownState(config));

  useEffect(() => {
    setCountdownState(resolveCountdownState(config));

    const intervalId = window.setInterval(() => {
      setCountdownState(resolveCountdownState(config));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [config.activeDurationMs, config.anchorTimeMs, config.cycleDurationMs, config.storageKey]);

  return countdownState;
}
