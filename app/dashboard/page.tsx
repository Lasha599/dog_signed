'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import { useStore, daysUntil } from '@/lib/store';
import { PRODUCTS } from '@/lib/products';
import { Plus, Pause, Play, SkipForward, Zap, Trash2, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { state, hydrated, subscriptionAction, cancelSubscription } = useStore();

  useEffect(() => {
    if (hydrated && !state.user) router.push('/register');
  }, [hydrated, state.user, router]);

  if (!hydrated || !state.user) return null;

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex justify-between items-start mb-10">
          <div>
            <p className="text-muted text-sm">Welcome back,</p>
            <h1 className="font-display text-4xl font-semibold">{state.user.name}</h1>
          </div>
          <Link href="/onboarding" className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add a dog
          </Link>
        </div>

        {state.dogs.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-muted mb-4">No dogs yet. Let's set up your first delivery.</p>
            <Link href="/onboarding" className="btn-primary inline-block">Get started</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {state.dogs.map(dog => {
              const sub = state.subscriptions.find(s => s.dogId === dog.id);
              const product = sub ? PRODUCTS.find(p => p.id === sub.productId) : null;
              if (!sub || !product) return null;
              const days = daysUntil(sub.nextDeliveryISO);
              const isLow = days > 14;

              return (
                <div key={dog.id} className="card">
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Dog info */}
                    <div>
                      <div className="aspect-square rounded-2xl overflow-hidden bg-sand mb-3">
                        <img
                          src={`https://placedog.net/400/400?id=${(dog.id.charCodeAt(dog.id.length - 1) % 20) + 1}`}
                          alt={dog.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="font-display text-2xl font-semibold">{dog.name}</div>
                      <div className="text-sm text-muted">
                        {dog.breed} · {dog.ageYears}y {dog.ageMonths}m · {dog.weightKg}kg
                      </div>
                    </div>

                    {/* Subscription */}
                    <div className="md:col-span-2">
                      <div className="flex items-start gap-4 mb-6">
                        <img src={product.image} alt="" className="w-20 h-20 rounded-xl object-cover" />
                        <div className="flex-1">
                          <div className="text-xs text-muted">{product.brand}</div>
                          <div className="font-display text-xl font-semibold">{product.name}</div>
                          <div className="text-sm text-muted mt-1">
                            ${product.price.toFixed(2)} · every {sub.frequencyWeeks} weeks · {(product.bagSize_g / 1000).toFixed(0)}kg bag
                          </div>
                        </div>
                      </div>

                      {/* Next delivery */}
                      <div className={`rounded-xl p-4 mb-4 ${
                        sub.status === 'paused' ? 'bg-ink/5' : isLow ? 'bg-clay/10' : 'bg-forest/10'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted">
                              {sub.status === 'paused' ? 'Subscription' : 'Next delivery'}
                            </div>
                            <div className="font-display text-2xl font-semibold">
                              {sub.status === 'paused' ? 'Paused' : `in ${days} days`}
                            </div>
                          </div>
                          {isLow && sub.status === 'active' && (
                            <div className="flex items-center gap-1 text-clay text-sm">
                              <AlertCircle className="w-4 h-4" />
                              Running low?
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => subscriptionAction(sub.id, 'skip')}
                          className="px-3 py-1.5 rounded-full text-xs border border-ink/15 hover:bg-ink/5 flex items-center gap-1"
                        >
                          <SkipForward className="w-3 h-3" /> Skip next
                        </button>
                        <button
                          onClick={() => subscriptionAction(sub.id, 'sooner')}
                          className="px-3 py-1.5 rounded-full text-xs border border-ink/15 hover:bg-ink/5 flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" /> Deliver sooner
                        </button>
                        <button
                          onClick={() => subscriptionAction(sub.id, sub.status === 'active' ? 'pause' : 'resume')}
                          className="px-3 py-1.5 rounded-full text-xs border border-ink/15 hover:bg-ink/5 flex items-center gap-1"
                        >
                          {sub.status === 'active' ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Resume</>}
                        </button>
                        <button
                          onClick={() => {
                            if (!confirm(`Cancel subscription for ${dog.name}?`)) return;
                            cancelSubscription(sub.id);
                          }}
                          className="px-3 py-1.5 rounded-full text-xs border border-ink/15 hover:bg-clay/10 hover:border-clay text-muted hover:text-clay flex items-center gap-1 ml-auto"
                        >
                          <Trash2 className="w-3 h-3" /> Cancel
                        </button>
                      </div>

                      {/* History */}
                      <div className="mt-6 pt-6 border-t border-ink/10">
                        <div className="text-xs text-muted mb-2">Order history</div>
                        <div className="space-y-1 text-sm">
                          {state.history.filter(h => h.dogId === dog.id).map(h => (
                            <div key={h.id} className="flex justify-between">
                              <span>{product.name}</span>
                              <span className="text-muted">
                                {new Date(h.deliveredAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                          {state.history.filter(h => h.dogId === dog.id).length === 0 && (
                            <div className="text-muted text-xs">No deliveries yet.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
