import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { subscriptions, dogs } from '@/lib/db';

const patchSchema = z.object({
  action: z.enum(['skip', 'sooner', 'pause', 'resume']),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const col = await subscriptions();
  const sub = await col.findOne({ id: params.id, userId: session.uid });
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updates: Partial<typeof sub> = {};
  switch (parsed.data.action) {
    case 'skip': {
      const next = new Date(sub.nextDeliveryISO);
      next.setDate(next.getDate() + sub.frequencyWeeks * 7);
      updates.nextDeliveryISO = next.toISOString();
      break;
    }
    case 'sooner': {
      const soon = new Date(Date.now() + 86400000 * 3);
      updates.nextDeliveryISO = soon.toISOString();
      break;
    }
    case 'pause':
      updates.status = 'paused';
      break;
    case 'resume':
      updates.status = 'active';
      break;
  }

  await col.updateOne({ id: params.id, userId: session.uid }, { $set: updates });
  const updated = await col.findOne({ id: params.id, userId: session.uid });
  const { _id, ...safe } = (updated || {}) as any;
  return NextResponse.json({ subscription: safe });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const col = await subscriptions();
  const sub = await col.findOne({ id: params.id, userId: session.uid });
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Cancelling a subscription also removes the dog (matches existing UI behavior).
  await col.deleteOne({ id: params.id, userId: session.uid });
  await (await dogs()).deleteOne({ id: sub.dogId, userId: session.uid });

  return NextResponse.json({ ok: true });
}
