/**
 * PesaPal API v3 client.
 *
 * Consumer key/secret are read from the environment and never leave the server.
 * Docs: https://developer.pesapal.com/how-to-integrate/api-reference
 */

const SANDBOX_BASE = 'https://cybqa.pesapal.com/pesapalv3';
const LIVE_BASE = 'https://pay.pesapal.com/v3';

export interface PesaPalOrderRequest {
  merchantReference: string;
  amount: number;
  currency: 'KES' | 'USD';
  description: string;
  callbackUrl: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
}

export interface PesaPalSubmitOrderResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  error: unknown;
  status: string;
}

/** status_code: 0 INVALID, 1 COMPLETED, 2 FAILED, 3 REVERSED */
export interface PesaPalTransactionStatus {
  payment_method: string;
  amount: number;
  created_date: string;
  confirmation_code: string;
  order_tracking_id: string;
  payment_status_description: string;
  description: string;
  message: string;
  payment_account: string;
  call_back_url: string;
  status_code: 0 | 1 | 2 | 3;
  merchant_reference: string;
  currency: string;
  error: unknown;
  status: string;
}

export class PesaPalError extends Error {
  constructor(message: string, readonly detail?: unknown) {
    super(message);
    this.name = 'PesaPalError';
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new PesaPalError(
      `${name} is not set. PesaPal is not configured — refusing to process payments.`
    );
  }
  return value;
}

export function isPesaPalConfigured(): boolean {
  return Boolean(process.env.PESAPAL_CONSUMER_KEY && process.env.PESAPAL_CONSUMER_SECRET);
}

function baseUrl(): string {
  return process.env.PESAPAL_ENV === 'live' ? LIVE_BASE : SANDBOX_BASE;
}

/**
 * Normalises Kenyan mobile numbers to the 2547XXXXXXXX / 2541XXXXXXXX form
 * PesaPal expects. Non-Kenyan numbers are passed through with only the
 * formatting characters stripped.
 */
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/[\s\-()+]/g, '');
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;
  return digits;
}

// PesaPal tokens are valid for 5 minutes; cache with a safety margin.
let cachedToken: { token: string; expiresAt: number } | null = null;

async function requestToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const res = await fetch(`${baseUrl()}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      consumer_key: requireEnv('PESAPAL_CONSUMER_KEY'),
      consumer_secret: requireEnv('PESAPAL_CONSUMER_SECRET'),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.token) {
    throw new PesaPalError('Failed to obtain PesaPal auth token.', data);
  }

  cachedToken = { token: data.token, expiresAt: Date.now() + 4 * 60 * 1000 };
  return data.token;
}

async function authedFetch(path: string, init: RequestInit = {}) {
  const token = await requestToken();
  return fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
}

/**
 * Registers the IPN URL and returns its id. This only needs to run once per
 * URL — persist the result in PESAPAL_IPN_ID rather than calling on boot.
 */
export async function registerIpn(url: string): Promise<string> {
  const res = await authedFetch('/api/URLSetup/RegisterIPN', {
    method: 'POST',
    body: JSON.stringify({ url, ipn_notification_type: 'POST' }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ipn_id) {
    throw new PesaPalError('Failed to register PesaPal IPN URL.', data);
  }
  return data.ipn_id;
}

export async function submitOrder(
  order: PesaPalOrderRequest
): Promise<PesaPalSubmitOrderResponse> {
  const res = await authedFetch('/api/Transactions/SubmitOrderRequest', {
    method: 'POST',
    body: JSON.stringify({
      id: order.merchantReference,
      currency: order.currency,
      amount: order.amount,
      description: order.description,
      callback_url: order.callbackUrl,
      notification_id: requireEnv('PESAPAL_IPN_ID'),
      billing_address: {
        email_address: order.email,
        phone_number: order.phoneNumber,
        country_code: 'KE',
        first_name: order.firstName,
        last_name: order.lastName,
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.redirect_url || !data?.order_tracking_id) {
    throw new PesaPalError('PesaPal rejected the order request.', data);
  }
  return data as PesaPalSubmitOrderResponse;
}

export async function getTransactionStatus(
  orderTrackingId: string
): Promise<PesaPalTransactionStatus> {
  const res = await authedFetch(
    `/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
    { method: 'GET' }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.status_code === undefined) {
    throw new PesaPalError('Failed to fetch PesaPal transaction status.', data);
  }
  return data as PesaPalTransactionStatus;
}
