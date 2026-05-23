'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { PRODUCTS, BRANDS, HAS_SCRAPED_DATA, SCRAPED_COUNT } from '@/lib/products';

export default function CatalogPage() {
  const [brandFilter, setBrandFilter] = useState('All');
  const [stage, setStage] = useState('All');
  const [grainFreeOnly, setGrainFreeOnly] = useState(false);
  const [scrapedOnly, setScrapedOnly] = useState(false);

  const filtered = useMemo(() => {
    return PRODUCTS.filter(p =>
      (brandFilter === 'All' || p.brand === brandFilter) &&
      (stage === 'All' || p.lifeStage === stage) &&
      (!grainFreeOnly || p.grainFree) &&
      (!scrapedOnly || !!p.source)
    );
  }, [brandFilter, stage, grainFreeOnly, scrapedOnly]);

  // Currency: scraped products use GEL, mock products use USD
  const fmtPrice = (p: typeof PRODUCTS[0]) =>
    p.currency === 'GEL' ? `${p.price.toFixed(2)} ₾` : `$${p.price.toFixed(2)}`;

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="font-display text-5xl font-semibold mb-2">Catalog</h1>
        <p className="text-muted mb-2">Prices pulled from partner stores. Updated continuously.</p>

        {/* Data source indicator */}
        <div className="text-xs text-muted mb-8">
          {HAS_SCRAPED_DATA ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-forest"></span>
              Live data: {SCRAPED_COUNT} products from Georgian stores
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-clay"></span>
              Demo data — run <code className="bg-sand px-1 rounded">npm run scrape</code> to fetch live prices
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <select className="input max-w-xs" value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
            <option>All</option>
            {BRANDS.map(b => <option key={b}>{b}</option>)}
          </select>
          <select className="input max-w-xs" value={stage} onChange={e => setStage(e.target.value)}>
            <option value="All">All life stages</option>
            <option value="puppy">Puppy</option>
            <option value="adult">Adult</option>
            <option value="senior">Senior</option>
          </select>
          <label className="inline-flex items-center gap-2 px-4 py-3 border border-ink/15 rounded-lg cursor-pointer bg-white/50">
            <input type="checkbox" checked={grainFreeOnly} onChange={e => setGrainFreeOnly(e.target.checked)} />
            Grain-free only
          </label>
          {HAS_SCRAPED_DATA && (
            <label className="inline-flex items-center gap-2 px-4 py-3 border border-ink/15 rounded-lg cursor-pointer bg-white/50">
              <input type="checkbox" checked={scrapedOnly} onChange={e => setScrapedOnly(e.target.checked)} />
              Live prices only
            </label>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(p => (
            <div key={p.id} className="card relative">
              {p.source && (
                <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider bg-forest text-cream px-2 py-0.5 rounded-full">
                  Live
                </span>
              )}
              {p.image ? (
                <img src={p.image} alt="" className="w-full h-40 object-cover rounded-lg mb-3" />
              ) : (
                <div className="w-full h-40 bg-sand rounded-lg mb-3 flex items-center justify-center text-muted text-sm">
                  No image
                </div>
              )}
              <div className="text-xs text-muted">{p.brand}</div>
              <div className="font-display text-lg font-semibold leading-tight">{p.name}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="chip">{p.lifeStage}</span>
                <span className="chip">{p.breedSize}</span>
                {p.grainFree && <span className="chip">grain-free</span>}
                {p.inStock === false && <span className="chip bg-clay/20 text-clay">out of stock</span>}
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="font-display text-xl font-semibold">{fmtPrice(p)}</div>
                <div className="text-xs text-muted">{(p.bagSize_g / 1000).toFixed(1)}kg</div>
              </div>
              <div className="text-xs text-muted mt-2 mb-3">
                {p.sourceUrl ? (
                  <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-clay underline-offset-2 hover:underline">
                    {p.store}
                  </a>
                ) : p.store} · {p.scrapedAt}
              </div>
              <Link href="/register" className="btn-primary w-full block text-center text-sm">
                Subscribe
              </Link>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="card text-center text-muted">No products match these filters.</div>
        )}
      </main>
    </>
  );
}
