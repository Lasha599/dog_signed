import Link from 'next/link';
import Nav from '@/components/Nav';
import { Truck, Sparkles, Calendar, PawPrint } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Nav />
      <main className="grain">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="fade-up">
              <div className="chip mb-6">
                <Sparkles className="w-3 h-3" />
                Auto-pilot for your dog's bowl
              </div>
              <h1 className="font-display text-6xl md:text-7xl font-semibold leading-[0.95] tracking-tight">
                Never run out of <span className="italic text-clay">dog food</span> again.
              </h1>
              <p className="mt-6 text-lg text-muted max-w-md leading-relaxed">
                Set the brand, set the rhythm. We'll keep the bowl full — so you can focus on the
                belly rubs, the walks, and the zoomies.
              </p>
              <div className="mt-8 flex gap-3">
                <Link href="/register" className="btn-primary">Start your subscription</Link>
                <Link href="/catalog" className="btn-secondary">Browse food</Link>
              </div>
            </div>

            <div className="relative fade-up delay-1">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-sand">
                <img
                  src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800"
                  alt="A happy dog"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-cream border border-ink/10 rounded-2xl px-5 py-4 shadow-lg">
                <div className="text-xs text-muted">Next delivery</div>
                <div className="font-display text-2xl font-semibold">in 12 days</div>
              </div>
              <div className="absolute -top-4 -right-4 bg-clay text-cream rounded-full px-4 py-2 text-xs font-medium rotate-6">
                Free shipping
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-sand py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-center mb-16">
              Three steps. Then forget about it.
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: PawPrint, title: 'Tell us about your dog', text: 'Breed, age, weight, allergies. We use it to recommend food if you need help choosing.' },
                { icon: Calendar, title: 'Pick food & rhythm', text: 'Browse the catalog or take our recommendation. Set a delivery cadence that matches your bag size.' },
                { icon: Truck, title: 'We deliver. Forever.', text: 'New bag shows up before the old one runs out. Pause, skip, or swap any time.' },
              ].map((s, i) => (
                <div key={i} className={`fade-up delay-${i + 1}`}>
                  <div className="w-12 h-12 rounded-full bg-clay text-cream flex items-center justify-center mb-4">
                    <s.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold mb-2">{s.title}</h3>
                  <p className="text-muted leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-24 text-center max-w-3xl mx-auto px-6">
          <h2 className="font-display text-5xl font-semibold leading-tight">
            Your dog deserves a bowl that's never empty.
          </h2>
          <p className="mt-4 text-muted">Set up your first delivery in under two minutes.</p>
          <Link href="/register" className="btn-primary mt-8 inline-block">Get started</Link>
        </section>

        <footer className="border-t border-ink/10 py-8 text-center text-xs text-muted">
          PawPantry — frontend demo. No real orders, no real charges. Built for Vercel.
        </footer>
      </main>
    </>
  );
}
