import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession, genId } from '@/lib/auth';
import { subscriptions, dogs, orders } from '@/lib/db';

const schema = z.object({
  dogId: z.string().min(1),
  productId: z.string().min(1),
  frequencyWeeks: z.number().int().min(1).max(52),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: unknown;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const dog = await (await dogs()).findOne({ id: parsed.data.dogId, userId: session.uid });
    if (!dog) return NextResponse.json({ error: 'Dog not found' }, { status: 404 });

    const next = new Date();
    next.setDate(next.getDate() + parsed.data.frequencyWeeks * 7);

    const sub = {
      id: genId('sub'),
      userId: session.uid,
      dogId: parsed.data.dogId,
      productId: parsed.data.productId,
      frequencyWeeks: parsed.data.frequencyWeeks,
      nextDeliveryISO: next.toISOString(),
      status: 'active' as const,
      createdAt: new Date(),
    };
    await (await subscriptions()).insertOne(sub);
    await (await orders()).insertOne({
      id: genId('ord'),
      userId: session.uid,
      dogId: parsed.data.dogId,
      productId: parsed.data.productId,
      deliveredAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    });

    const { _id, ...safe } = sub as typeof sub & { _id?: unknown };
    return NextResponse.json({ subscription: safe }, { status: 201 });
  } catch (e) {
    console.error('/api/subscriptions failed:', e);
    return NextResponse.json({ error: 'Server error', detail: (e as Error).message }, { status: 500 });
  }
}
