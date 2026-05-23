import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession, genId } from '@/lib/auth';
import { dogs } from '@/lib/db';

const schema = z.object({
  name: z.string().min(1).max(60),
  breed: z.string().min(1).max(60),
  ageYears: z.number().int().min(0).max(30),
  ageMonths: z.number().int().min(0).max(11),
  weightKg: z.number().min(0.5).max(100),
  activity: z.enum(['low', 'medium', 'high']),
  allergies: z.array(z.string().max(40)).max(20),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const dog = {
    id: genId('dog'),
    userId: session.uid,
    ...parsed.data,
    createdAt: new Date(),
  };
  await (await dogs()).insertOne(dog);

  const { _id, ...safe } = dog as typeof dog & { _id?: unknown };
  return NextResponse.json({ dog: safe }, { status: 201 });
}
