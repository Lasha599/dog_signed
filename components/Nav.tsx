'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { PawPrint } from 'lucide-react';

export default function Nav() {
  const router = useRouter();
  const { state, hydrated, signOut } = useStore();

  return (
    <nav className="sticky top-0 z-50 bg-cream/80 backdrop-blur border-b border-ink/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <PawPrint className="w-6 h-6 text-clay group-hover:rotate-12 transition" />
          <span className="font-display text-xl font-semibold tracking-tight">PawPantry</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/catalog" className="btn-ghost text-sm">Catalog</Link>
          {hydrated && state.user ? (
            <>
              <Link href="/dashboard" className="btn-primary text-sm">Dashboard</Link>
              <button
                onClick={async () => { await signOut(); router.push('/'); }}
                className="btn-ghost text-xs text-muted"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              {hydrated && <Link href="/signin" className="btn-ghost text-sm">Sign in</Link>}
              <Link href="/register" className="btn-primary text-sm">Get started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
