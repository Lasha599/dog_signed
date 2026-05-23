/**
 * Scraper entry point.
 *
 * Usage:
 *   npm run scrape              # all stores
 *   npm run scrape:zoomart      # one store
 *   npm run scrape:zoocity
 *   npm run scrape:zoolife
 *
 * Output:
 *   - scraper/output/zoomart.json   (per-store, with errors and metadata)
 *   - scraper/output/zoocity.json
 *   - scraper/output/zoolife.json
 *   - lib/scraped-products.json     (merged, consumed by the Next.js app)
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zoomartAdapter } from './adapters/zoomart';
import { zoocityAdapter } from './adapters/zoocity';
import { zoolifeAdapter } from './adapters/zoolife';
import type { StoreAdapter } from './adapters/adapter';
import type { ScrapedProduct } from './types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(__dirname, 'output');
const FRONTEND_OUTPUT = join(ROOT, 'lib', 'scraped-products.json');

const ADAPTERS: Record<string, StoreAdapter> = {
  zoomart: zoomartAdapter,
  zoocity: zoocityAdapter,
  zoolife: zoolifeAdapter,
};

async function main() {
  const arg = process.argv[2];
  const toRun: StoreAdapter[] = arg
    ? [ADAPTERS[arg]].filter(Boolean)
    : Object.values(ADAPTERS);

  if (toRun.length === 0) {
    console.error(`Unknown adapter: "${arg}". Available: ${Object.keys(ADAPTERS).join(', ')}`);
    process.exit(1);
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  const allProducts: ScrapedProduct[] = [];
  let totalErrors = 0;

  for (const adapter of toRun) {
    console.log(`\n→ Scraping ${adapter.storeName} (${adapter.baseUrl})…`);
    const start = Date.now();
    const result = await adapter.scrape();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    console.log(`  ✓ ${result.products.length} products in ${elapsed}s`);
    if (result.errors.length > 0) {
      console.log(`  ⚠ ${result.errors.length} errors:`);
      result.errors.slice(0, 5).forEach(e => console.log(`     - ${e}`));
      if (result.errors.length > 5) console.log(`     … and ${result.errors.length - 5} more`);
      totalErrors += result.errors.length;
    }

    const perStorePath = join(OUTPUT_DIR, `${adapter.source}.json`);
    await writeFile(perStorePath, JSON.stringify(result, null, 2));
    console.log(`  → ${perStorePath}`);

    allProducts.push(...result.products);
  }

  // Merge all results into one file the frontend reads.
  await writeFile(FRONTEND_OUTPUT, JSON.stringify(allProducts, null, 2));
  console.log(`\n✓ Merged ${allProducts.length} products → ${FRONTEND_OUTPUT}`);

  if (allProducts.length === 0) {
    console.log('\n⚠ No products scraped. Most likely causes:');
    console.log('  1. Selectors in scraper/adapters/*.ts need tuning (open the live site & inspect)');
    console.log('  2. Sites use JS rendering — need Playwright instead of cheerio');
    console.log('  3. Sites are blocking the User-Agent — try a real browser UA in scraper/utils.ts');
    console.log('\nThe app will continue to use mock data as fallback.');
  }

  process.exit(totalErrors > 0 && allProducts.length === 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
