import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { users } from '@/lib/db';
import { verifyPassword, signSession, setSessionCookie } from '@/lib/auth';
import { toSafeUser } from '@/lib/models';

const schema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    let user;
    try {
      user = await (await users()).findOne({ email: normalizedEmail });
    } catch (e) {
      console.error('Sign-in DB lookup failed:', e);
      return NextResponse.json(
        { error: 'Cannot connect to database', detail: (e as Error).message },
        { status: 500 }
      );
    }

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    let token: string;
    try {
      token = await signSession({ uid: user.id, email: user.email });
    } catch (e) {
      console.error('signSession failed:', e);
      return NextResponse.json(
        { error: 'Session config error', detail: (e as Error).message },
        { status: 500 }
      );
    }

    const res = NextResponse.json({ user: toSafeUser(user) });
    setSessionCookie(res, token);
    return res;
  } catch (e) {
    console.error('Sign-in unhandled error:', e);
    return NextResponse.json(
      { error: 'Server error', detail: (e as Error).message || String(e) },
      { status: 500 }
    );
  }
}
