'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Dog } from './recommend';

export type User = { id: string; name: string; email: string };

export type Subscription = {
  id: string;
  dogId: string;
  productId: string;
  frequencyWeeks: number;
  nextDeliveryISO: string;
  status: 'active' | 'paused';
  createdAt: string;
};

export type OrderHistoryItem = {
  id: string;
  dogId: string;
  productId: string;
  deliveredAt: string;
};

export type State = {
  user: User | null;
  dogs: Dog[];
  subscriptions: Subscription[];
  history: OrderHistoryItem[];
};

const OLD_KEY = 'pawpantry:state:v1';
const initial: State = { user: null, dogs: [], subscriptions: [], history: [] };

// Safe JSON parser - returns null if response can't be parsed as JSON.
async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); }
  catch { return { error: text.slice(0, 200) }; }
}

async function fetchMe(): Promise<State> {
  try {
    const res = await fetch('/api/me', { cache: 'no-store' });
    if (!res.ok) return initial;
    const data = await safeJson(res);
    return data || initial;
  } catch {
    return initial;
  }
}

export function useStore() {
  const [state, setState] = useState<State>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(OLD_KEY); } catch {}
    }
    fetchMe().then(s => {
      setState(s);
      setHydrated(true);
    });
  }, []);

  const refresh = useCallback(async () => {
    setState(await fetchMe());
  }, []);

  const callAuth = async (path: string, body: any) => {
    setBusy(true); setError(null);
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        const msg = data?.error || `Server error (${res.status})`;
        const detail = data?.detail ? ` — ${data.detail}` : '';
        throw new Error(msg + detail);
      }
      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message || 'Network error');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const signUp = useCallback(
    (name: string, email: string, password: string) =>
      callAuth('/api/auth/signup', { name, email, password }),
    [refresh]
  );

  const signIn = useCallback(
    (email: string, password: string) => callAuth('/api/auth/signin', { email, password }),
    [refresh]
  );

  const signOut = useCallback(async () => {
    try { await fetch('/api/auth/signout', { method: 'POST' }); } catch {}
    setState(initial);
  }, []);

  const addDogAndSubscribe = useCallback(async (
    dogData: Omit<Dog, 'id'>,
    productId: string,
    frequencyWeeks: number
  ) => {
    setBusy(true); setError(null);
    try {
      const dogRes = await fetch('/api/dogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dogData),
      });
      const dogData2 = await safeJson(dogRes);
      if (!dogRes.ok) throw new Error(dogData2?.error || 'Failed to add dog');

      const subRes = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dogId: dogData2.dog.id, productId, frequencyWeeks }),
      });
      const subData = await safeJson(subRes);
      if (!subRes.ok) throw new Error(subData?.error || 'Failed to create subscription');

      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const subscriptionAction = useCallback(async (
    id: string,
    action: 'skip' | 'sooner' | 'pause' | 'resume'
  ) => {
    try {
      await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [refresh]);

  const cancelSubscription = useCallback(async (id: string) => {
    try {
      await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [refresh]);

  return {
    state, hydrated, busy, error,
    signUp, signIn, signOut,
    addDogAndSubscribe, subscriptionAction, cancelSubscription,
    refresh,
  };
}

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function addWeeks(iso: string, weeks: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString();
}
