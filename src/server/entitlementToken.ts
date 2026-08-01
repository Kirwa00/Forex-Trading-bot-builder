/**
 * Signed entitlement cookie.
 *
 * The app has no user accounts, so a verified payment issues an HMAC-signed
 * token naming the payer's email and tier. It proves "this browser completed
 * payment X" — it is not authentication, and anyone who copies the cookie
 * inherits the entitlement. Swap this for real sessions when accounts land.
 */

import crypto from 'crypto';

const COOKIE_NAME = 'stratobot_entitlement';
const ADMIN_COOKIE_NAME = 'stratobot_admin';
const MAX_AGE_DAYS = 365;
const ADMIN_MAX_AGE_HOURS = 12;

interface TokenPayload {
  email: string;
  tier: 'Free' | 'Pro';
  merchantReference: string;
  exp: number;
}

function secret(): string {
  const value = process.env.APP_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      'APP_SECRET must be set to a random string of at least 32 characters to sign entitlement tokens.'
    );
  }
  return value;
}

function sign(data: string): string {
  return crypto.createHmac('sha256', secret()).update(data).digest('base64url');
}

export function issueToken(payload: Omit<TokenPayload, 'exp'>): string {
  const full: TokenPayload = {
    ...payload,
    exp: Date.now() + MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  };
  const body = Buffer.from(JSON.stringify(full)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function verifyToken(token: string | undefined): TokenPayload | null {
  if (!token) return null;

  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as TokenPayload;
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function readCookie(cookieHeader: string | undefined, wanted: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === wanted) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

export function readTokenFromCookies(cookieHeader: string | undefined): string | undefined {
  return readCookie(cookieHeader, COOKIE_NAME);
}

function serialiseCookie(name: string, token: string, maxAgeSeconds: number): string {
  const attrs = [
    `${name}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (process.env.NODE_ENV === 'production') attrs.push('Secure');
  return attrs.join('; ');
}

export function buildSetCookie(token: string): string {
  return serialiseCookie(COOKIE_NAME, token, MAX_AGE_DAYS * 24 * 60 * 60);
}

/* -------------------------------------------------------------------------- */
/* Admin session                                                              */
/* -------------------------------------------------------------------------- */

interface AdminPayload {
  role: 'admin';
  exp: number;
}

export function issueAdminToken(): string {
  const payload: AdminPayload = {
    role: 'admin',
    exp: Date.now() + ADMIN_MAX_AGE_HOURS * 60 * 60 * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function buildAdminSetCookie(token: string): string {
  return serialiseCookie(ADMIN_COOKIE_NAME, token, ADMIN_MAX_AGE_HOURS * 60 * 60);
}

export function clearAdminCookie(): string {
  return serialiseCookie(ADMIN_COOKIE_NAME, '', 0);
}

export function isAdminRequest(cookieHeader: string | undefined): boolean {
  const token = readCookie(cookieHeader, ADMIN_COOKIE_NAME);
  if (!token) return false;

  const [body, signature] = token.split('.');
  if (!body || !signature) return false;

  const a = Buffer.from(signature);
  const b = Buffer.from(sign(body));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as AdminPayload;
    return payload.role === 'admin' && Date.now() < payload.exp;
  } catch {
    return false;
  }
}
