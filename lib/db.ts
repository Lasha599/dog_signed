// MongoDB connection helper.
// All errors are surfaced through getDb(), never at import time, so a missing env
// var in production becomes a JSON 500 response instead of crashing the route file.

import { MongoClient, Db } from 'mongodb';
import type { UserDoc, DogDoc, SubscriptionDoc, OrderDoc } from './models';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (!global._mongoClientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI env var is not set');
    global._mongoClientPromise = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
    }).connect();
  }
  return global._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DB || 'pawpantry');
}

export async function getClient(): Promise<MongoClient> {
  return await getClientPromise();
}

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

let indexesEnsured = false;
export async function ensureIndexes() {
  if (indexesEnsured) return;
  indexesEnsured = true;
  await (await users()).createIndex({ email: 1 }, { unique: true });
  await (await dogs()).createIndex({ userId: 1 });
  await (await subscriptions()).createIndex({ userId: 1 });
  await (await subscriptions()).createIndex({ dogId: 1 });
  await (await orders()).createIndex({ userId: 1 });
}
