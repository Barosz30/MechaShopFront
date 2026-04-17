import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { TelemetryEventName, TelemetryEventPayload } from '../types';

interface TelemetryContextValue {
  track: (eventName: TelemetryEventName, payload?: TelemetryEventPayload) => void;
}

const fallbackContextValue: TelemetryContextValue = {
  track: () => undefined,
};

const TelemetryContext = createContext<TelemetryContextValue>(fallbackContextValue);

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const value = useMemo<TelemetryContextValue>(
    () => ({
      track: (eventName, payload = {}) => {
        if (typeof window === 'undefined') {
          return;
        }

        const normalizedPayload = {
          route: window.location.pathname,
          ...payload,
        };

        window.dispatchEvent(
          new CustomEvent('mechashop:telemetry', {
            detail: {
              eventName,
              payload: normalizedPayload,
              timestamp: Date.now(),
            },
          }),
        );
      },
    }),
    [],
  );

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
}

export function useTelemetry() {
  return useContext(TelemetryContext);
}
