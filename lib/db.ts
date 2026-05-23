// MongoDB connection helper.
//
// The standard Next.js pattern: cache the MongoClient on globalThis so HMR doesn't
// create a new connection on every code change in dev. In prod the module is loaded
// once anyway.
//
// Usage:
//   import { getDb } from '@/lib/db';
//   const db = await getDb();
//   await db.collection('users').findOne({ email });

import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'pawpantry';

if (!uri) {
  throw new Error(
    'MONGODB_URI is not set. Copy .env.example to .env.local and fill in your Atlas connection string.'
  );
}

// Cache across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri!).connect();
  }
  return global._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}

export async function getClient(): Promise<MongoClient> {
  return await getClientPromise();
}

// Collection helpers — typed access to each collection.
import type { UserDoc, DogDoc, SubscriptionDoc, OrderDoc } from './models';

export async function users() {
  return (await getDb()).collection<UserDoc>('users');
}
export async function dogs() {
  return (await getDb()).collection<DogDoc>('dogs');
}
export async function subscriptions() {
  return (await getDb()).collection<SubscriptionDoc>('subscriptions');
}
export async function orders() {
  return (await getDb()).collection<OrderDoc>('orders');
}

// Create indexes once at startup. Safe to call repeatedly.
let indexesEnsured = false;
export async function ensureIndexes() {
  if (indexesEnsured) return;
  indexesEnsured = true;
  const u = await users();
  await u.createIndex({ email: 1 }, { unique: true });
  const d = await dogs();
  await d.createIndex({ userId: 1 });
  const s = await subscriptions();
  await s.createIndex({ userId: 1 });
  await s.createIndex({ dogId: 1 });
  const o = await orders();
  await o.createIndex({ userId: 1 });
  await o.createIndex({ dogId: 1 });
}
