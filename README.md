# PawPantry — auto-delivery pet food

A Next.js subscription app for automatic dog food delivery. Owners register, pick (or get recommended) a food, choose a cadence, and the site tracks the delivery schedule.

**Stack:** Next.js 14 · TypeScript · MongoDB Atlas · Tailwind · deployed on Vercel

## Quick start

You need **Node.js 18.17+** and a free **MongoDB Atlas** cluster.

```bash
cp .env.example .env.local
# edit .env.local — fill in MONGODB_URI and SESSION_SECRET
npm install
npm run dev
```

Then open http://localhost:3000.

### Generate a session secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Paste the output as `SESSION_SECRET` in `.env.local`.

### Get a MongoDB connection string

1. Sign up free at [cloud.mongodb.com](https://cloud.mongodb.com) → create a cluster (M0 free tier is fine)
2. Database Access → Add User (use a strong, generated password)
3. Network Access → Allow access from anywhere (or your IP for local dev)
4. Connect → Drivers → copy the Node.js connection string
5. Paste into `.env.local` as `MONGODB_URI`, replacing `<password>` with the real one

## What's built

- **Landing**, **registration**, **sign-in** pages
- **4-step onboarding wizard**: dog profile → choose path → pick food → set frequency
- **Smart food recommender** based on age, size, activity level, allergies
- **Auto-suggested delivery frequency** from weight × bag size
- **Dashboard** with countdown, skip / sooner / pause / cancel actions, order history
- **Catalog browse** with brand, life-stage, grain-free, and live-only filters
- **Scraper** for Georgian pet food stores (zoomart.ge, zoocity.ge, zoolife.ge); see `scraper/README.md`
- **MongoDB-backed** users, dogs, subscriptions, order history
- **bcrypt + JWT session** auth (no third-party auth library)

## Deploy to Vercel

1. Push to GitHub
2. vercel.com → New Project → import repo
3. **Add environment variables** in Project Settings → Environment Variables:
   - `MONGODB_URI`
   - `MONGODB_DB`
   - `SESSION_SECRET`
4. Deploy

Every `git push` to `main` auto-deploys. Preview URLs for branches and PRs.

## Refresh the product catalog

Locally:
```bash
npm run scrape              # all stores
npm run scrape:zoomart      # one store
```

Commit `lib/scraped-products.json` and push — Vercel redeploys with the fresh data.

For automation, see `scraper/README.md` (GitHub Actions or Vercel Cron).

## Project docs

- `plan.md` — product vision, current phase, roadmap
- `claude.md` — codebase guide for AI assistants and new developers
- `scraper/README.md` — how to tune selectors and run the scraper

## License

MIT. Use freely.
