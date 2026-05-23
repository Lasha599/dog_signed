// Client state hook. Backed by the API + MongoDB.
//
// Public interface is intentionally similar to the old localStorage version,
// so pages don't need rewriting:
//   const { state, update, hydrated } = useStore();
//
// Differences from the localStorage version:
//   - `state` is fetched from /api/me on mount.
//   - `update()` is replaced with action methods (signIn, signUp, addDog, etc.)
//     that call the API and refresh state. The shape of `update()` was too
//     tightly coupled to localStorage to keep meaningfully.
//
// On first load, if localStorage has the old key, we wipe it (per the migration
// decision: start fresh on the server).

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

async function fetchMe(): Promise<State> {
  const res = await fetch('/api/me', { cache: 'no-store' });
  if (!res.ok) return initial;
  return await res.json();
}

export function useStore() {
  const [state, setState] = useState<State>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wipe old localStorage data on first mount, then load from server.
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

  // ---- Auth ----
  const signUp = useCallback(async (name: string, email: string, password: string) => {
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sign-up failed');
      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sign-in failed');
      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    setState(initial);
  }, []);

  // ---- Dogs + subscriptions ----
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
      if (!dogRes.ok) throw new Error('Failed to add dog');
      const { dog } = await dogRes.json();

      const subRes = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dogId: dog.id, productId, frequencyWeeks }),
      });
      if (!subRes.ok) throw new Error('Failed to create subscription');

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
    await fetch(`/api/subscriptions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    await refresh();
  }, [refresh]);

  const cancelSubscription = useCallback(async (id: string) => {
    await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
    await refresh();
  }, [refresh]);

  return {
    state,
    hydrated,
    busy,
    error,
    signUp, signIn, signOut,
    addDogAndSubscribe,
    subscriptionAction,
    cancelSubscription,
    refresh,
  };
}

// Date helpers kept here for backwards-compatible imports.
export function daysUntil(iso: string): number {
  const target = new Date(iso).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export function addWeeks(iso: string, weeks: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString();
}
