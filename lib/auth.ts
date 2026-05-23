// Auth and session utilities.
//
// Strategy: stateless JWT in an httpOnly cookie.
//  - Sign-up / sign-in writes a signed JWT to a cookie called `session`.
//  - Subsequent requests are authenticated by verifying the cookie's JWT.
//  - No server-side session store needed — the JWT IS the session.
//  - To "log out" we clear the cookie.
//
// Why jose and not jsonwebtoken: jose works in the Edge runtime (Next.js middleware).
// Why bcryptjs and not bcrypt: pure-JS, no native build step, deploys cleanly to Vercel.

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const SECRET_RAW = process.env.SESSION_SECRET;
if (!SECRET_RAW) {
  throw new Error(
    'SESSION_SECRET is not set. Copy .env.example to .env.local and set a random secret.'
  );
}
if (SECRET_RAW.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters.');
}
const SECRET = new TextEncoder().encode(SECRET_RAW);

const TTL_DAYS = parseInt(process.env.SESSION_TTL_DAYS || '30', 10);
const COOKIE_NAME = 'session';

export type SessionPayload = {
  uid: string;     // user id (matches UserDoc.id)
  email: string;
};

export async function signSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ uid: payload.uid, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TTL_DAYS}d`)
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (typeof payload.uid !== 'string' || typeof payload.email !== 'string') return null;
    return { uid: payload.uid, email: payload.email };
  } catch {
    return null;
  }
}

/** Read and verify the session cookie. Returns null if absent or invalid. */
export async function getSession(): Promise<SessionPayload | null> {
  const c = cookies().get(COOKIE_NAME);
  if (!c) return null;
  return await verifySession(c.value);
}

/** Set the session cookie on a NextResponse. */
export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TTL_DAYS * 24 * 60 * 60,
  });
}

/** Clear the session cookie on a NextResponse. */
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

/** Generate a short id for documents. Not cryptographic — just unique enough. */
export function genId(prefix: string = ''): string {
  const random = Math.random().toString(36).slice(2, 10);
  return prefix ? `${prefix}_${Date.now().toString(36)}_${random}` : `${Date.now().toString(36)}_${random}`;
}
