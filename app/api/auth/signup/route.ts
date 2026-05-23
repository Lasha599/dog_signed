import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { users, ensureIndexes } from '@/lib/db';
import { hashPassword, signSession, setSessionCookie, genId } from '@/lib/auth';
import { toSafeUser } from '@/lib/models';

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  // Wrap the entire handler so ANY error returns JSON, never empty.
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
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

    // Database operations — these can fail if MongoDB isn't reachable
    try {
      await ensureIndexes();
    } catch (e) {
      console.error('ensureIndexes failed:', e);
      return NextResponse.json(
        { error: 'Database setup failed', detail: (e as Error).message },
        { status: 500 }
      );
    }

    let col;
    try {
      col = await users();
    } catch (e) {
      console.error('users() failed:', e);
      return NextResponse.json(
        { error: 'Cannot connect to database', detail: (e as Error).message },
        { status: 500 }
      );
    }

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

    const res = NextResponse.json({ user: toSafeUser(user) }, { status: 201 });
    setSessionCookie(res, token);
    return res;
  } catch (e) {
    console.error('Signup unhandled error:', e);
    return NextResponse.json(
      { error: 'Server error', detail: (e as Error).message || String(e) },
      { status: 500 }
    );
  }
}
