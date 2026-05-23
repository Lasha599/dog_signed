import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { users } from '@/lib/db';
import {
  verifyPassword, signSession, setSessionCookie,
} from '@/lib/auth';
import { toSafeUser } from '@/lib/models';

const schema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
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
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await (await users()).findOne({ email: normalizedEmail });

  // Return identical error for "not found" vs "wrong password" to avoid email enumeration.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const token = await signSession({ uid: user.id, email: user.email });
  const res = NextResponse.json({ user: toSafeUser(user) });
  setSessionCookie(res, token);
  return res;
}
