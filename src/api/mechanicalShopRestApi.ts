function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

const restApiBaseUrl = stripTrailingSlash(
  import.meta.env.VITE_MECHANICAL_SHOP_REST_API_URL ??
    'https://mechanicalshopbackend.onrender.com',
);

interface AuthResponse {
  access_token: string;
}

interface ProfileResponse {
  sub: number;
  username: string;
  iat: number;
  exp: number;
}

interface CheckoutSessionResponse {
  url: string;
}

export interface OrderSummary {
  id: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

async function executeRest<TData>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
) {
  const response = await fetch(`${restApiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorPayload = (await response.json()) as { message?: string | string[] };
      if (typeof errorPayload.message === 'string') {
        message = errorPayload.message;
      } else if (Array.isArray(errorPayload.message) && errorPayload.message.length > 0) {
        message = errorPayload.message.join(', ');
      }
    } catch {
      // Keep generic status message.
    }
    throw new Error(message);
  }

  return (await response.json()) as TData;
}

export async function signIn(username: string, password: string) {
  return executeRest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function signUp(username: string, password: string) {
  return executeRest<void>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function signInWithGoogle(token: string) {
  return executeRest<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function fetchProfile(token: string) {
  return executeRest<ProfileResponse>('/auth/profile', { method: 'GET' }, token);
}

export async function createCheckoutSession(
  token: string,
  items: Array<{ itemId: number; quantity: number }>,
) {
  return executeRest<CheckoutSessionResponse>(
    '/api/payments/create-checkout-session',
    {
      method: 'POST',
      body: JSON.stringify({ items }),
    },
    token,
  );
}

export async function fetchMyOrders(token: string) {
  return executeRest<OrderSummary[]>('/api/orders', { method: 'GET' }, token);
}

export async function fetchOrderSummary(token: string, orderId: number) {
  return executeRest<OrderSummary>(`/api/orders/${orderId}`, { method: 'GET' }, token);
}
