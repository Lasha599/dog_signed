import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { users, ensureIndexes } from '@/lib/db';
import {
  hashPassword, signSession, setSessionCookie, genId,
} from '@/lib/auth';
import { toSafeUser } from '@/lib/models';

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  await ensureIndexes();
  const col = await users();

  const existing = await col.findOne({ email: normalizedEmail });
  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email already exists.' },
      { status: 409 }
    );
  }

  const user = {
    id: genId('usr'),
    name,
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    createdAt: new Date(),
  };
  await col.insertOne(user);

  const token = await signSession({ uid: user.id, email: user.email });
  const res = NextResponse.json({ user: toSafeUser(user) }, { status: 201 });
  setSessionCookie(res, token);
  return res;
}
