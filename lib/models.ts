// MongoDB document shapes. Each collection has its own type.
// IDs are strings (we generate our own) for stable client-side keys.

import { ObjectId } from 'mongodb';

export type UserDoc = {
  _id?: ObjectId;
  id: string;              // public id, used in JWTs and URLs
  name: string;
  email: string;           // lowercase, indexed unique
  passwordHash: string;    // bcrypt
  createdAt: Date;
};

export type DogDoc = {
  _id?: ObjectId;
  id: string;
  userId: string;          // references UserDoc.id
  name: string;
  breed: string;
  ageYears: number;
  ageMonths: number;
  weightKg: number;
  activity: 'low' | 'medium' | 'high';
  allergies: string[];
  createdAt: Date;
};

export type SubscriptionDoc = {
  _id?: ObjectId;
  id: string;
  userId: string;
  dogId: string;
  productId: string;
  frequencyWeeks: number;
  nextDeliveryISO: string;
  status: 'active' | 'paused';
  createdAt: Date;
};

export type OrderDoc = {
  _id?: ObjectId;
  id: string;
  userId: string;
  dogId: string;
  productId: string;
  deliveredAt: string;
};

// What we send to the client — never includes passwordHash or _id.
export type SafeUser = {
  id: string;
  name: string;
  email: string;
};

export function toSafeUser(u: UserDoc): SafeUser {
  return { id: u.id, name: u.name, email: u.email };
}
