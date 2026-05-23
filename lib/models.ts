import { ObjectId } from 'mongodb';

export type UserDoc = {
  _id?: ObjectId;
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

export type DogDoc = {
  _id?: ObjectId;
  id: string;
  userId: string;
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

export type SafeUser = { id: string; name: string; email: string };

export function toSafeUser(u: UserDoc): SafeUser {
  return { id: u.id, name: u.name, email: u.email };
}
