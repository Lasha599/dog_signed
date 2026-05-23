import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { users, dogs, subscriptions, orders } from '@/lib/db';
import { toSafeUser } from '@/lib/models';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null, dogs: [], subscriptions: [], history: [] });
  }

  const user = await (await users()).findOne({ id: session.uid });
  if (!user) {
    // Session pointed to a deleted user; return signed-out state.
    return NextResponse.json({ user: null, dogs: [], subscriptions: [], history: [] });
  }

  const [userDogs, userSubs, userOrders] = await Promise.all([
    (await dogs()).find({ userId: user.id }).sort({ createdAt: 1 }).toArray(),
    (await subscriptions()).find({ userId: user.id }).toArray(),
    (await orders()).find({ userId: user.id }).sort({ deliveredAt: -1 }).limit(20).toArray(),
  ]);

  return NextResponse.json({
    user: toSafeUser(user),
    dogs: userDogs.map(stripMongoId),
    subscriptions: userSubs.map(stripMongoId),
    history: userOrders.map(stripMongoId),
  });
}

function stripMongoId<T extends { _id?: unknown }>(doc: T): Omit<T, '_id'> {
  const { _id, ...rest } = doc;
  return rest;
}
