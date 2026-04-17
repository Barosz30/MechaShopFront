import { useEffect, useMemo, useState } from 'react';

type HealthState = 'checking' | 'ok' | 'degraded';

interface EndpointHealth {
  label: 'REST' | 'GraphQL';
  ok: boolean;
  detail: string;
}

const restApiBaseUrl =
  (import.meta.env.VITE_MECHANICAL_SHOP_REST_API_URL as string | undefined) ??
  'https://mechanicalshopbackend.onrender.com';
const graphQlApiUrl =
  (import.meta.env.VITE_MECHANICAL_SHOP_API_URL as string | undefined) ??
  'https://mechanicalshopbackend.onrender.com/graphql';

function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 4500) {
  let timeoutId: number | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  });
}

async function checkRestEndpoint(): Promise<EndpointHealth> {
  try {
    const response = await withTimeout(
      fetch(stripTrailingSlash(restApiBaseUrl), {
        method: 'HEAD',
      }),
    );
    const ok = response.status < 500;
    return {
      label: 'REST',
      ok,
      detail: `status ${response.status}`,
    };
  } catch (error) {
    return {
      label: 'REST',
      ok: false,
      detail: error instanceof Error ? error.message : 'network error',
    };
  }
}

async function checkGraphQlEndpoint(): Promise<EndpointHealth> {
  try {
    const response = await withTimeout(
      fetch(stripTrailingSlash(graphQlApiUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query HealthProbe {
              __typename
            }
          `,
        }),
      }),
    );

    const ok = response.ok;
    return {
      label: 'GraphQL',
      ok,
      detail: `status ${response.status}`,
    };
  } catch (error) {
    return {
      label: 'GraphQL',
      ok: false,
      detail: error instanceof Error ? error.message : 'network error',
    };
  }
}

function ApiHealthBanner() {
  const [healthState, setHealthState] = useState<HealthState>('checking');
  const [results, setResults] = useState<EndpointHealth[]>([]);

  useEffect(() => {
    let isMounted = true;

    const runHealthChecks = async () => {
      setHealthState('checking');
      const [restResult, graphQlResult] = await Promise.all([
        checkRestEndpoint(),
        checkGraphQlEndpoint(),
      ]);

      if (!isMounted) {
        return;
      }

      const nextResults = [restResult, graphQlResult];
      setResults(nextResults);
      setHealthState(nextResults.every((entry) => entry.ok) ? 'ok' : 'degraded');
    };

    void runHealthChecks();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    if (healthState === 'checking') {
      return 'Checking API connectivity...';
    }
    if (healthState === 'ok') {
      return 'API connectivity OK';
    }
    return 'API connectivity issues detected';
  }, [healthState]);

  return (
    <div className="mx-auto mt-3 w-[min(100%-1rem,80rem)]">
      <div
        className={`rounded-2xl border px-4 py-2 text-xs sm:text-sm ${
          healthState === 'ok'
            ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
            : healthState === 'checking'
              ? 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100'
              : 'border-amber-300/30 bg-amber-400/10 text-amber-100'
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold">{summary}</span>
          {results.map((entry) => (
            <span key={entry.label} className="opacity-90">
              {entry.label}: {entry.ok ? 'OK' : 'Error'} ({entry.detail})
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ApiHealthBanner;
