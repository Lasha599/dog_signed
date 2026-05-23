'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { useStore } from '@/lib/store';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, busy, error } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const submit = async () => {
    setLocalError('');
    if (!name || !email || !password) {
      setLocalError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }
    const ok = await signUp(name, email, password);
    if (ok) router.push('/onboarding');
  };

  const shown = localError || error;

  return (
    <>
      <Nav />
      <main className="max-w-md mx-auto px-6 py-16">
        <h1 className="font-display text-4xl font-semibold mb-2">Create your account</h1>
        <p className="text-muted mb-8">No credit card required.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Your name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Anna Petrova" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="anna@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </div>
          {shown && <div className="text-clay text-sm">{shown}</div>}
          <button onClick={submit} disabled={busy} className="btn-primary w-full mt-2 disabled:opacity-50">
            {busy ? 'Creating account…' : 'Continue'}
          </button>
          <p className="text-sm text-muted text-center">
            Already have an account? <Link href="/signin" className="text-clay hover:underline">Sign in</Link>
          </p>
        </div>
      </main>
    </>
  );
}
