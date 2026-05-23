# CLAUDE.md — Codebase Guide for AI Assistants

This file orients Claude Code (or any AI assistant) to the PawPantry codebase. Read this before making changes.

## Project at a glance

**PawPantry** is a Next.js 14 dog food auto-delivery subscription app. See `plan.md` for product vision and roadmap.

- **MongoDB Atlas** backend (Phase 2 — current)
- **Email + password auth** with bcrypt + httpOnly JWT cookie sessions
- **Scraper** for Georgian pet food stores (zoomart.ge, zoocity.ge, zoolife.ge); see `scraper/README.md`
- **Mock catalog fallback** so the app works even if the scraper hasn't run
- **Required env vars**: `MONGODB_URI`, `MONGODB_DB`, `SESSION_SECRET` — see `.env.example`

## How to run

```bash
cp .env.example .env.local        # fill in MONGODB_URI and SESSION_SECRET
npm install
npm run dev                       # http://localhost:3000
npm run build                     # production build (sanity check before deploy)
```

Requires Node.js 18.17+. MongoDB Atlas free tier is fine.

To generate a session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | All pages under `app/`, API routes under `app/api/` |
| Language | TypeScript (strict) | `tsconfig.json` has strict mode on |
| Database | MongoDB Atlas | `lib/db.ts` lazy-connects with HMR-safe singleton |
| Auth | bcryptjs + jose (JWT) | httpOnly cookie session, Edge-compatible |
| Validation | zod | Schemas on every write endpoint |
| Styling | Tailwind CSS 3 | Custom colors in `tailwind.config.js` |
| Icons | lucide-react | Tree-shaken, only what's imported |
| State | Custom hook (`lib/store.ts`) | `useStore()` fetches from `/api/me`, mutates via API |
| Fonts | Google Fonts via `<link>` | Fraunces (display) + Inter (body) |
| UI library | None | Components are handcrafted Tailwind |

Deliberate non-choices: no NextAuth, no Zustand, no Redux, no shadcn/ui, no Prisma, no Mongoose. The MongoDB driver is used directly. Add abstractions only when complexity demands it.

## File map

```
pawpantry/
├── app/
│   ├── layout.tsx           Root layout + Google Fonts
│   ├── globals.css          Tailwind directives + custom classes
│   ├── page.tsx             Landing page
│   ├── register/page.tsx    Sign-up form
│   ├── signin/page.tsx      Sign-in form
│   ├── onboarding/page.tsx  4-step wizard
│   ├── dashboard/page.tsx   Subscription management (auth-gated)
│   ├── catalog/page.tsx     Browse products
│   └── api/                 Server routes
│       ├── auth/signup/route.ts     POST — create account, set session cookie
│       ├── auth/signin/route.ts     POST — verify credentials, set cookie
│       ├── auth/signout/route.ts    POST — clear cookie
│       ├── me/route.ts              GET  — current user + dogs + subs + history
│       ├── dogs/route.ts            POST — create dog
│       ├── subscriptions/route.ts             POST   — create
│       └── subscriptions/[id]/route.ts        PATCH  — skip/sooner/pause/resume
│                                              DELETE — cancel
├── components/
│   └── Nav.tsx              Sticky top nav with sign-in/out
├── lib/
│   ├── db.ts                MongoDB connection + collection helpers + indexes
│   ├── auth.ts              JWT signing, password hashing, session cookie helpers
│   ├── models.ts            UserDoc, DogDoc, SubscriptionDoc, OrderDoc types
│   ├── store.ts             Client-side useStore() hook — talks to /api routes
│   ├── products.ts          Merges scraped + mock catalog
│   ├── scraped-products.json   Output of the scraper
│   └── recommend.ts         Recommendation algorithm, frequency suggestion
├── scraper/                 Standalone scraper (see scraper/README.md)
├── plan.md                  Product vision and roadmap
├── claude.md                This file
├── README.md                User-facing setup
├── .env.example             Template — copy to .env.local and fill in
├── package.json
└── …
```

## Core data model

All defined in `lib/store.ts` and `lib/recommend.ts`:

```ts
type User = { name: string; email: string };

type Dog = {
  id: string;
  name: string;
  breed: string;
  ageYears: number;
  ageMonths: number;
  weightKg: number;
  activity: 'low' | 'medium' | 'high';
  allergies: string[];
};

type Subscription = {
  id: string;
  dogId: string;
  productId: string;
  frequencyWeeks: number;
  nextDeliveryISO: string;   // ISO date string
  status: 'active' | 'paused';
  createdAt: string;
};

type OrderHistoryItem = {
  id: string;
  dogId: string;
  productId: string;
  deliveredAt: string;
};

type State = {
  user: User | null;
  dogs: Dog[];
  subscriptions: Subscription[];
  history: OrderHistoryItem[];
};
```

The entire app state is one `State` object. Subscriptions link to dogs and products by id.

## State management pattern

`useStore()` from `lib/store.ts` is the single client-side entry point. On mount it calls `GET /api/me` to load the user's data; if not signed in, returns an empty state.

```tsx
'use client';
import { useStore } from '@/lib/store';

export default function MyPage() {
  const {
    state,                 // { user, dogs, subscriptions, history }
    hydrated,              // false until /api/me has returned
    busy,                  // true while an action is in-flight
    error,                 // last error message, or null
    signUp, signIn, signOut,
    addDogAndSubscribe,    // (dogData, productId, frequencyWeeks) => Promise<boolean>
    subscriptionAction,    // (id, 'skip' | 'sooner' | 'pause' | 'resume') => Promise<void>
    cancelSubscription,    // (id) => Promise<void>
    refresh,               // re-fetch /api/me
  } = useStore();

  if (!hydrated) return null;
  // …
}
```

Key points:

- **Always check `hydrated`** before rendering data-dependent UI.
- **Action methods are async** and refresh state on success. Show `busy` while pending.
- **State is read-only** — no direct mutation. All changes go through methods that call the API.
- **Old localStorage data is wiped** on first mount (we're past that migration).

## Recommendation algorithm

In `lib/recommend.ts`:

- `getLifeStage(dog)` → `'puppy' | 'adult' | 'senior'`
- `getBreedSize(dog)` → `'small' | 'medium' | 'large'`
- `recommendProducts(dog)` → top 3 products, scored by criteria match. Allergens hard-exclude.
- `suggestFrequencyWeeks(dog, bagSize_g)` → nearest interval from `[2, 3, 4, 6, 8]` based on `weight_kg × 25 g/day` daily intake estimate.

When extending: add new scoring criteria inside `recommendProducts`. The function is pure and easy to test.

## Design system

Defined in `tailwind.config.js` and `app/globals.css`.

### Colors

| Token | Hex | Usage |
|---|---|---|
| `cream` | `#F5EFE4` | Page background |
| `clay` | `#C84B31` | Primary CTA, accents |
| `clayDark` | `#A23A24` | CTA hover |
| `forest` | `#2C3E2D` | Secondary accent (chips) |
| `sand` | `#E8DCC4` | Section backgrounds, neutral surfaces |
| `ink` | `#1A1A1A` | Text |
| `muted` | `#6B6157` | Secondary text |

Use these as Tailwind classes: `bg-clay`, `text-muted`, `border-ink/10`, etc.

### Typography

- **Display font** (`font-display`): Fraunces — used for headings, prices, brand
- **Body font**: Inter (default) — used everywhere else
- Heading sizes: prefer `text-4xl`/`text-5xl`/`text-6xl` with `font-display font-semibold`
- Pair with `tracking-tight` for large headlines

### Reusable component classes (in `globals.css`)

- `.btn-primary` — clay-filled rounded CTA
- `.btn-secondary` — outlined alternative
- `.btn-ghost` — transparent for tertiary actions
- `.input` — form field
- `.card` — white/70 + backdrop-blur + rounded-2xl panel
- `.chip` — small pill badge (sand background, forest text)
- `.grain` — adds subtle SVG noise overlay
- `.fade-up`, `.delay-1`, `.delay-2`, `.delay-3` — staggered entrance animation

**Important:** Tailwind opacity modifiers must use values from `[5, 10, 20, 25, 30, ...]`. Custom values like `border-ink/8` will fail to compile. Use `/10` instead.

## Common tasks — how to do them

### Add a new product to the catalog

Edit `lib/products.ts` — append to the `PRODUCTS` array. Required fields are typed in `Product`. Use Unsplash image URLs (already whitelisted in `next.config.js`).

### Add a new page

```bash
mkdir app/new-page
# create app/new-page/page.tsx
```

Use the App Router conventions. For pages with interactivity, add `'use client'` at the top. Import `Nav` from `@/components/Nav` to get the sticky header.

### Add a new field to the dog profile

1. Update the `Dog` type in `lib/recommend.ts`.
2. Add the input in `app/onboarding/page.tsx` step 1.
3. If it affects recommendations, update `recommendProducts` scoring.
4. If it should display, update `app/dashboard/page.tsx`.

### Add a new API endpoint

1. Create `app/api/<your-route>/route.ts` exporting `GET`, `POST`, `PATCH`, or `DELETE` functions.
2. Get the session: `const session = await getSession()` from `@/lib/auth`. Return 401 if null.
3. Validate input with zod (see `app/api/auth/signup/route.ts` for the pattern).
4. Get a typed collection: `const col = await dogs()` (or `users()`, `subscriptions()`, `orders()` from `@/lib/db`).
5. Always filter by `userId: session.uid` on reads/writes — never trust the client.
6. Strip `_id` before returning documents (`const { _id, ...safe } = doc`).

### Wire a new action into the client

1. Add a method to `useStore()` in `lib/store.ts` that calls your endpoint and then `refresh()`.
2. Use `setBusy(true)` and `setError(null)` at the start, `setBusy(false)` in `finally`.
3. Return a boolean for success so callers can route conditionally.

### Phase 3 outlook — payments and scheduler

Already-set foundations:
- `lib/models.ts` has `OrderDoc` — extend with `status: 'pending' | 'shipped' | 'delivered'`, Stripe ids
- Adding Stripe: `npm i stripe`, env var `STRIPE_SECRET_KEY`, webhook handler at `app/api/webhooks/stripe/route.ts`
- For Vercel Cron: add `vercel.json` with a cron entry pointing at `app/api/cron/deliver/route.ts`. Protect with a `CRON_SECRET` header check.

## Patterns and conventions

- **Client components** (`'use client'`) for anything interactive. Server components for pure rendering.
- **API routes** under `app/api/*/route.ts` export `GET`/`POST`/`PATCH`/`DELETE` functions. They run in Node.js by default.
- **No `<form>` tags with default submit** — use `onClick` handlers and call action methods from `useStore()`.
- **Image URLs**: Unsplash for product photos, placedog.net for dog photos, plus the Georgian store domains (all whitelisted in `next.config.js`).
- **Date math**: `addWeeks(iso, weeks)` and `daysUntil(iso)` helpers live in `lib/store.ts`.
- **Confirm destructive actions**: cancel uses `window.confirm()`.
- **Auth filtering**: every DB read/write that touches user data filters by `userId: session.uid`. Treat this as non-negotiable.
- **Error responses**: `NextResponse.json({ error: 'message' }, { status: 4xx })`. Never leak internal errors verbatim.

## Known limitations / things to be aware of

- **No SSR for personalized data** — pages flash empty before hydration. The `hydrated` guard prevents flicker but content arrives client-side. Acceptable for an authenticated dashboard; revisit if SEO matters for any of these pages.
- **No optimistic UI** — actions wait for the server round-trip before refreshing state. Fine on fast connections; add optimistic updates if the dashboard starts feeling sluggish.
- **No rate limiting on auth routes** — for production add `@upstash/ratelimit` or similar. Currently anyone can brute-force passwords.
- **No email verification or password reset** — listed in `plan.md` as Phase 2 remaining work.
- **No tests yet** — the recommendation logic in `lib/recommend.ts` and the API route handlers are the highest-value targets.
- **Hardcoded product images** in mock catalog point to Unsplash URLs; if any go 404 over time, swap them out in `lib/products.ts`.
- **Scraper runs locally only** — see `scraper/README.md` for scheduled-run options (GitHub Actions is the easiest).

## When in doubt

- Read `plan.md` for product intent.
- Look at `app/onboarding/page.tsx` for the most thorough example of forms + state updates + multi-step UX.
- Look at `app/dashboard/page.tsx` for the cleanest example of mutating state via `update()`.

## Deploying to Vercel (sharing with others)

PawPantry deploys to Vercel with zero configuration. Follow these steps to get a public URL you can share.

### One-time setup

1. Push the project to a GitHub repository (must be public, or private with Vercel access):
   ```bash
   cd pawpantry
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/YOUR-USERNAME/pawpantry.git
   git branch -M main
   git push -u origin main
   ```

2. Go to **https://vercel.com** → sign in with GitHub → click **Add New Project**.

3. Find your `pawpantry` repo in the list → click **Import**.

4. Leave all settings as-is (Vercel auto-detects Next.js). Click **Deploy**.

5. After ~60 seconds you get a live URL like `https://pawpantry-xyz.vercel.app`. Share that with anyone.

### Subsequent deploys

Every `git push` to `main` triggers an automatic redeploy. No manual steps needed:

```bash
git add .
git commit -m "your change"
git push
```

Vercel also creates a **preview URL** for every branch and pull request automatically.

### Environment variables

The MVP has none — no `.env` file is needed. When you add a backend (Phase 2+), add secrets in Vercel: **Project Settings → Environment Variables**. Never commit `.env.local` to git.

### Port forwarding (Codespaces only)

When running `npm run dev` inside GitHub Codespaces, Next.js reports `localhost:3000` in the terminal — but that address only works inside the container. To open the app:

1. Click the **Ports** tab at the bottom of the Codespaces window.
2. Find port **3000** → hover over the address in the *Forwarded Address* column → click the 🌐 globe icon.
3. This opens a URL like `https://your-codespace-3000.app.github.dev` — that's your app.

To make the preview shareable (e.g. to show a colleague): in the Ports tab, right-click port 3000 → **Port Visibility → Public**. The URL is then accessible without a GitHub login.

### Custom domain

In Vercel: **Project Settings → Domains → Add** → type your domain → follow the DNS instructions. Free on all Vercel plans.

### Vercel free tier limits (as of 2025)

- 100 GB bandwidth/month
- Unlimited deployments
- 1 project per free account (Hobby plan)

More than enough for a demo or early users. Upgrade to Pro when you add a real backend (needed for Vercel Postgres, Cron jobs, etc.).

## TODOs scattered in the code

Search for `TODO` in the codebase. Main hotspots:

- `lib/products.ts` — top of file, notes the backend migration path for the catalog.
