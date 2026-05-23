// Auth and session utilities.
// Strategy: bcrypt-hashed passwords + JWT in an httpOnly cookie.

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

// Validate env vars lazily so the file can be imported without crashing.
function getSecret(): Uint8Array {
  const raw = process.env.SESSION_SECRET;
  if (!raw) throw new Error('SESSION_SECRET env var is not set');
  if (raw.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
  return new TextEncoder().encode(raw);
}

function getTtlDays(): number {
  return parseInt(process.env.SESSION_TTL_DAYS || '30', 10);
}

const COOKIE_NAME = 'session';

export type SessionPayload = { uid: string; email: string };

export async function signSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ uid: payload.uid, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${getTtlDays()}d`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.uid !== 'string' || typeof payload.email !== 'string') return null;
    return { uid: payload.uid, email: payload.email };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const c = cookies().get(COOKIE_NAME);
  if (!c) return null;
  return await verifySession(c.value);
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: getTtlDays() * 24 * 60 * 60,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function hashPassword(plain: string): Promise<string> {
  return await bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plain, hash);
}

export function genId(prefix: string = ''): string {
  const random = Math.random().toString(36).slice(2, 10);
  return prefix
    ? `${prefix}_${Date.now().toString(36)}_${random}`
    : `${Date.now().toString(36)}_${random}`;
}
