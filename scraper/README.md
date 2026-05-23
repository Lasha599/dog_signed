# PawPantry Scraper

Pulls live product data from Georgian pet food stores into the PawPantry catalog.

**Stores supported:** zoomart.ge, zoocity.ge, zoolife.ge

## How it works

```
scraper/
├── adapters/
│   ├── adapter.ts        StoreAdapter interface
│   ├── zoomart.ts        zoomart.ge adapter
│   ├── zoocity.ge        zoocity.ge adapter
│   └── zoolife.ts        zoolife.ge adapter
├── output/               per-store JSON results with errors and metadata
├── types.ts              shared TypeScript types
├── utils.ts              fetch, parsing, classification helpers
└── run.ts                entry point — orchestrates adapters

lib/scraped-products.json     ← final merged output, consumed by the Next.js app
```

Each adapter:
1. Fetches the dog-food category page
2. Extracts product detail page links
3. Visits each product page
4. Parses title, price, image, ingredients, etc.
5. Classifies life stage, breed size, protein source from the title
6. Returns a `ScrapedProduct[]`

The runner merges all adapters' results into `lib/scraped-products.json`, which `lib/products.ts` imports and concatenates with the mock catalog.

## Usage

```bash
npm run scrape              # all three stores
npm run scrape:zoomart      # one store
npm run scrape:zoocity
npm run scrape:zoolife
```

After scraping, restart the dev server (`npm run dev`) and refresh the catalog page.

## Tuning selectors (you'll need to do this once)

The CSS selectors in each adapter are **best guesses** — they're educated guesses based on common e-commerce HTML patterns, but until verified against the live site they probably won't match perfectly.

To tune one store (using zoomart as an example):

1. **Open the site** in your browser → navigate to the dog food category.
2. **Right-click a product card → Inspect.** Look at the surrounding HTML.
3. **Find a CSS selector that matches all product cards.** Common patterns: `.product-item`, `[data-product]`, `article.product`.
4. **Open `scraper/adapters/zoomart.ts`** and update `SELECTORS.productCard` and `SELECTORS.productLink`.
5. **Click into a product detail page.** Inspect the title, price, image, etc. Update the corresponding entries in `DETAIL_SELECTORS`.
6. **Run** `npm run scrape:zoomart` and check the output. Iterate.

The first successful scrape will write per-store JSON files to `scraper/output/` so you can inspect exactly what was parsed.

## Troubleshooting

**"No product links found"** — Selectors are wrong. Re-inspect the site.

**Products parsed but prices are `NaN`** — The price selector matches something, but the format isn't recognized. Look at `parsePrice` in `utils.ts` and check what the raw price text looks like.

**Bag sizes are all `1000`** (default fallback) — The product title doesn't contain a kg/g value, or `parseBagSizeGrams` regex doesn't match the format. Add new patterns to the regex.

**Site shows "loading" or blank content when scraped** — The site uses client-side JavaScript rendering. `cheerio` only sees the initial HTML, so it can't extract dynamically-rendered products. You'll need to swap `fetchHtml` for a headless browser like Playwright:

```bash
npm install -D playwright
npx playwright install chromium
```

Then in `utils.ts`, replace the `fetchHtml` body with a Playwright-based version that waits for the page to render before returning HTML.

**Getting blocked / 403 / 429 errors** — The site detects the bot. Options:
- Increase `REQUEST_DELAY_MS` in the adapter (currently 1500ms)
- Switch to a real browser User-Agent in `utils.ts` (currently uses a polite bot UA)
- Run the scraper less frequently
- Reach out to the store for an affiliate or API partnership

## Adding a new store

1. Create `scraper/adapters/yourstore.ts` — copy `zoocity.ts` as a starting template.
2. Update `BASE_URL`, `CATEGORY_URLS`, selectors, and `source` / `storeName`.
3. Register it in `scraper/run.ts` by importing and adding to the `ADAPTERS` map.
4. Update `scraper/types.ts` — add `'yourstore'` to the `source` union type.

## Running on a schedule

Once the scraper is stable, schedule it via:

- **GitHub Actions** (free): `.github/workflows/scrape.yml` with a cron trigger that runs the scraper and commits the updated JSON file
- **Vercel Cron** (Hobby plan supports daily): a serverless function that runs the scraper and writes to your database
- **A small VPS** with a system cron job

For Vercel Cron specifically, you'll want to migrate `lib/scraped-products.json` to a database (Vercel Postgres, Supabase) since the filesystem on Vercel is read-only at runtime.

## Legal notes

Scraping is generally legal for publicly-accessible data, but:
- Always respect `robots.txt` (check each site's `/robots.txt`)
- Throttle requests to avoid impacting site performance
- Use a User-Agent that identifies who you are
- If a site asks you to stop, stop
- For a real business, partner with stores instead — affiliate APIs are more durable and legally clean
