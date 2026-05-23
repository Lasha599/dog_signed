'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { useStore } from '@/lib/store';

export default function SignInPage() {
  const router = useRouter();
  const { signIn, busy, error } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async () => {
    if (!email || !password) return;
    const ok = await signIn(email, password);
    if (ok) router.push('/dashboard');
  };

  return (
    <>
      <Nav />
      <main className="max-w-md mx-auto px-6 py-16">
        <h1 className="font-display text-4xl font-semibold mb-2">Welcome back</h1>
        <p className="text-muted mb-8">Sign in to manage your subscriptions.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input className="input" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="anna@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input className="input" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="••••••••" />
          </div>
          {error && (
            <div className="text-clay text-sm p-3 bg-clay/10 rounded-lg whitespace-pre-wrap break-words">
              {error}
            </div>
          )}
          <button onClick={submit} disabled={busy} className="btn-primary w-full mt-2 disabled:opacity-50">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-sm text-muted text-center">
            New here? <Link href="/register" className="text-clay hover:underline">Create an account</Link>
          </p>
        </div>
      </main>
    </>
  );
}
