import type { RegionConfig } from '../types';

export const regionalConfigs = {
  us: {
    locale: 'en-US',
    currency: 'USD',
    name: 'United States',
  },
  eu: {
    locale: 'en-IE',
    currency: 'EUR',
    name: 'Europe',
  },
} as const satisfies Record<string, RegionConfig>;

export type RegionKey = keyof typeof regionalConfigs;

export const defaultRegionKey: RegionKey = 'us';
