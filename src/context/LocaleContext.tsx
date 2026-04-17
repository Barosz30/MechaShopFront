import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  defaultRegionKey,
  regionalConfigs,
  type RegionKey,
} from '../config/regions';
import type { RegionConfig } from '../types';

interface LocaleContextValue {
  region: RegionConfig;
  regionKey: RegionKey;
  setRegionKey: (nextRegionKey: RegionKey) => void;
  formatCurrency: (value: number) => string;
}

const fallbackRegion = regionalConfigs[defaultRegionKey];

const fallbackContextValue: LocaleContextValue = {
  region: fallbackRegion,
  regionKey: defaultRegionKey,
  setRegionKey: () => undefined,
  formatCurrency: (value: number) =>
    new Intl.NumberFormat(fallbackRegion.locale, {
      style: 'currency',
      currency: fallbackRegion.currency,
      maximumFractionDigits: 0,
    }).format(value),
};

const LocaleContext = createContext<LocaleContextValue>(fallbackContextValue);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [regionKey, setRegionKey] = useState<RegionKey>(defaultRegionKey);

  const value = useMemo<LocaleContextValue>(() => {
    const region = regionalConfigs[regionKey];

    return {
      region,
      regionKey,
      setRegionKey,
      formatCurrency: (value: number) =>
        new Intl.NumberFormat(region.locale, {
          style: 'currency',
          currency: region.currency,
          maximumFractionDigits: 0,
        }).format(value),
    };
  }, [regionKey]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
