'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import { useStore } from '@/lib/store';
import { PRODUCTS, BRANDS, Product } from '@/lib/products';
import {
  BREEDS, ALLERGY_OPTIONS, recommendProducts, suggestFrequencyWeeks,
  getLifeStage, getBreedSize, Dog
} from '@/lib/recommend';
import { Check, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { state, addDogAndSubscribe, busy, hydrated } = useStore();
  const [step, setStep] = useState(1);

  // Dog profile
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('Mixed Breed');
  const [ageYears, setAgeYears] = useState(2);
  const [ageMonths, setAgeMonths] = useState(0);
  const [weightKg, setWeightKg] = useState(15);
  const [activity, setActivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [allergies, setAllergies] = useState<string[]>([]);

  // Path: know food or want recommendation
  const [path, setPath] = useState<'browse' | 'recommend' | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState<string>('All');

  // Frequency
  const [frequencyWeeks, setFrequencyWeeks] = useState<number>(4);

  useEffect(() => {
    if (hydrated && !state.user) router.push('/register');
  }, [hydrated, state.user, router]);

  const dog: Dog = {
    id: 'temp', name, breed, ageYears, ageMonths, weightKg, activity, allergies,
  };

  const recommendations = useMemo(() => recommendProducts(dog), [name, breed, ageYears, ageMonths, weightKg, activity, allergies]);
  const filtered = useMemo(() => {
    return PRODUCTS.filter(p => brandFilter === 'All' || p.brand === brandFilter);
  }, [brandFilter]);

  const selectedProduct = productId ? PRODUCTS.find(p => p.id === productId) : null;

  // Auto-suggest frequency when product is picked
  useEffect(() => {
    if (selectedProduct) {
      setFrequencyWeeks(suggestFrequencyWeeks(dog, selectedProduct.bagSize_g));
    }
  }, [productId]);

  const finish = async () => {
    if (!selectedProduct) return;
    const ok = await addDogAndSubscribe(
      { name, breed, ageYears, ageMonths, weightKg, activity, allergies },
      selectedProduct.id,
      frequencyWeeks,
    );
    if (ok) router.push('/dashboard');
  };

  const canNext = () => {
    if (step === 1) return name.trim().length > 0 && weightKg > 0;
    if (step === 2) return path !== null;
    if (step === 3) return productId !== null;
    if (step === 4) return frequencyWeeks > 0;
    return false;
  };

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="flex-1">
              <div className={`h-1 rounded-full transition-all ${n <= step ? 'bg-clay' : 'bg-ink/10'}`} />
            </div>
          ))}
        </div>

        {/* Step 1: Dog profile */}
        {step === 1 && (
          <div className="fade-up">
            <h2 className="font-display text-4xl font-semibold mb-2">Tell us about your dog</h2>
            <p className="text-muted mb-8">We use this to suggest the right food and the right cadence.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Max" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Breed</label>
                <select className="input" value={breed} onChange={e => setBreed(e.target.value)}>
                  {BREEDS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Age (years)</label>
                  <input className="input" type="number" min={0} max={20} value={ageYears}
                    onChange={e => setAgeYears(parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Age (months)</label>
                  <input className="input" type="number" min={0} max={11} value={ageMonths}
                    onChange={e => setAgeMonths(parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                <input className="input" type="number" min={1} max={100} value={weightKg}
                  onChange={e => setWeightKg(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Activity level</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map(a => (
                    <button key={a} onClick={() => setActivity(a)}
                      className={`flex-1 py-3 rounded-lg border transition capitalize ${
                        activity === a ? 'border-clay bg-clay text-cream' : 'border-ink/15 bg-white/50 hover:bg-ink/5'
                      }`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Allergies or sensitivities (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {ALLERGY_OPTIONS.map(a => (
                    <button key={a}
                      onClick={() => setAllergies(allergies.includes(a)
                        ? allergies.filter(x => x !== a)
                        : [...allergies, a])}
                      className={`px-3 py-1.5 rounded-full text-sm border transition ${
                        allergies.includes(a) ? 'bg-forest text-cream border-forest' : 'border-ink/15 hover:bg-ink/5'
                      }`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Path choice */}
        {step === 2 && (
          <div className="fade-up">
            <h2 className="font-display text-4xl font-semibold mb-2">How would you like to choose?</h2>
            <p className="text-muted mb-8">Pick whatever fits — you can switch food later.</p>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setPath('browse')}
                className={`card text-left transition ${path === 'browse' ? 'ring-2 ring-clay' : 'hover:bg-white'}`}
              >
                <div className="font-display text-2xl font-semibold mb-1">I know what I want</div>
                <p className="text-muted text-sm">Browse our catalog and pick the brand and formula yourself.</p>
              </button>
              <button
                onClick={() => setPath('recommend')}
                className={`card text-left transition ${path === 'recommend' ? 'ring-2 ring-clay' : 'hover:bg-white'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-clay" />
                  <span className="font-display text-2xl font-semibold">Recommend for me</span>
                </div>
                <p className="text-muted text-sm">
                  We'll match a formula to {name || 'your dog'}'s age, size, activity, and allergies.
                </p>
              </button>
            </div>

            {name && (
              <div className="mt-8 p-4 bg-sand rounded-xl text-sm">
                <div className="text-muted mb-1">Profile summary</div>
                <div className="font-medium">
                  {name} · {breed} · {getLifeStage(dog)} · {getBreedSize(dog)} breed · {weightKg}kg · {activity} activity
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Pick product */}
        {step === 3 && (
          <div className="fade-up">
            <h2 className="font-display text-4xl font-semibold mb-2">
              {path === 'recommend' ? 'Our top picks for ' + (name || 'your dog') : 'Browse the catalog'}
            </h2>
            <p className="text-muted mb-8">
              {path === 'recommend'
                ? 'Based on the profile you gave us. Pick any to subscribe.'
                : 'Filter by brand. Prices and stock are pulled from partner stores.'}
            </p>

            {path === 'browse' && (
              <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                <button onClick={() => setBrandFilter('All')}
                  className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap border transition ${
                    brandFilter === 'All' ? 'bg-clay text-cream border-clay' : 'border-ink/15 hover:bg-ink/5'
                  }`}>All brands</button>
                {BRANDS.map(b => (
                  <button key={b} onClick={() => setBrandFilter(b)}
                    className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap border transition ${
                      brandFilter === b ? 'bg-clay text-cream border-clay' : 'border-ink/15 hover:bg-ink/5'
                    }`}>{b}</button>
                ))}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {(path === 'recommend' ? recommendations : filtered).map(p => (
                <ProductCard key={p.id} product={p} selected={productId === p.id} onSelect={() => setProductId(p.id)} />
              ))}
              {path === 'recommend' && recommendations.length === 0 && (
                <div className="col-span-2 card text-center text-muted">
                  No matches with current allergies. Try removing one, or browse the full catalog.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Frequency */}
        {step === 4 && selectedProduct && (
          <div className="fade-up">
            <h2 className="font-display text-4xl font-semibold mb-2">How often should we deliver?</h2>
            <p className="text-muted mb-8">
              Based on {name}'s weight and a {(selectedProduct.bagSize_g / 1000).toFixed(0)}kg bag, we suggest{' '}
              <span className="font-medium text-ink">every {suggestFrequencyWeeks(dog, selectedProduct.bagSize_g)} weeks</span>.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[2, 3, 4, 6, 8].map(w => (
                <button key={w} onClick={() => setFrequencyWeeks(w)}
                  className={`py-4 rounded-xl border transition ${
                    frequencyWeeks === w ? 'border-clay bg-clay text-cream' : 'border-ink/15 hover:bg-ink/5'
                  }`}>
                  <div className="font-display text-2xl font-semibold">{w}</div>
                  <div className="text-xs opacity-80">weeks</div>
                </button>
              ))}
            </div>

            <div className="mt-8 card">
              <div className="text-sm text-muted mb-1">Subscription summary</div>
              <div className="flex items-start gap-4">
                <img src={selectedProduct.image} alt="" className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="font-display text-xl font-semibold">{selectedProduct.brand}</div>
                  <div className="text-muted">{selectedProduct.name}</div>
                  <div className="text-sm mt-1">
                    ${selectedProduct.price.toFixed(2)} every {frequencyWeeks} weeks
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex justify-between mt-10">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="btn-ghost disabled:opacity-30 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          {step < 4 ? (
            <button
              onClick={() => canNext() && setStep(step + 1)}
              disabled={!canNext()}
              className="btn-primary disabled:opacity-40 flex items-center gap-1"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={finish} disabled={!canNext() || busy} className="btn-primary disabled:opacity-40">
              {busy ? 'Creating…' : 'Start subscription'}
            </button>
          )}
        </div>
      </main>
    </>
  );
}

function ProductCard({ product, selected, onSelect }: { product: Product; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect}
      className={`card text-left transition relative ${selected ? 'ring-2 ring-clay' : 'hover:bg-white'}`}>
      {selected && (
        <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-clay text-cream flex items-center justify-center">
          <Check className="w-4 h-4" />
        </div>
      )}
      <img src={product.image} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
      <div className="text-xs text-muted">{product.brand}</div>
      <div className="font-display text-lg font-semibold leading-tight">{product.name}</div>
      <div className="flex items-center justify-between mt-2">
        <div className="font-medium">${product.price.toFixed(2)}</div>
        <div className="text-xs text-muted">{(product.bagSize_g / 1000).toFixed(0)}kg bag</div>
      </div>
      <div className="text-xs text-muted mt-2">Price from {product.store} · updated {product.scrapedAt}</div>
    </button>
  );
}
