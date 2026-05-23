/**
 * Adapter for zoomart.ge
 *
 * ⚠️ SELECTOR TUNING REQUIRED ⚠️
 * The selectors below are best-guess based on common e-commerce patterns.
 * To tune them:
 *   1. Open https://zoomart.ge in your browser
 *   2. Navigate to the dog food category
 *   3. Right-click a product → Inspect
 *   4. Find the real CSS selectors and replace the values in the SELECTORS object below
 *   5. Run: npm run scrape:zoomart
 *
 * If the site uses dynamic JS rendering (React/Vue), cheerio won't see the products.
 * In that case, switch the `fetchHtml` call to a headless browser (Playwright).
 * See the README at scraper/README.md for details.
 */

import * as cheerio from 'cheerio';
import type { StoreAdapter } from './adapter';
import type { ScrapeResult, ScrapedProduct } from '../types';
import {
  fetchHtml,
  sleep,
  parsePrice,
  parseBagSizeGrams,
  classifyLifeStage,
  classifyBreedSize,
  detectProteinSource,
  isGrainFree,
  slugify,
  absoluteUrl,
} from '../utils';

const BASE_URL = 'https://zoomart.ge';

// TODO: Verify these URLs by visiting the site. Update the slug after `/category/` if needed.
const CATEGORY_URLS = [
  `${BASE_URL}/category/dog-food`,
  // Add more pagination URLs here if the site paginates: `${BASE_URL}/category/dog-food?page=2`
];

// TODO: Tune these selectors after inspecting the live site.
const SELECTORS = {
  // Listing page — find each product card
  productCard: '.product-card, .product-item, [data-product]',
  // Within a card, the link to the product detail page
  productLink: 'a[href*="/product/"]',
};

// TODO: Tune these selectors on the product detail page.
const DETAIL_SELECTORS = {
  title: 'h1, .product-title, [itemprop="name"]',
  price: '.price, .product-price, [itemprop="price"], .current-price',
  image: '.product-image img, .main-image img, [itemprop="image"]',
  brand: '.product-brand, .brand-name, [itemprop="brand"]',
  description: '.product-description, .description, [itemprop="description"]',
  ingredients: '.ingredients, .composition',
  stockBadge: '.in-stock, .out-of-stock, .availability',
};

const MAX_PRODUCTS_PER_RUN = 30;     // safety cap during development
const REQUEST_DELAY_MS = 1500;       // polite throttling

export const zoomartAdapter: StoreAdapter = {
  source: 'zoomart',
  storeName: 'Zoomart.ge',
  baseUrl: BASE_URL,

  async scrape(): Promise<ScrapeResult> {
    const products: ScrapedProduct[] = [];
    const errors: string[] = [];
    const scrapedAt = new Date().toISOString();

    // 1. Collect product URLs from category page(s)
    const productUrls = new Set<string>();
    for (const categoryUrl of CATEGORY_URLS) {
      try {
        const html = await fetchHtml(categoryUrl);
        const $ = cheerio.load(html);
        $(SELECTORS.productCard).each((_, el) => {
          const href = $(el).find(SELECTORS.productLink).first().attr('href');
          if (href) productUrls.add(absoluteUrl(href, BASE_URL));
        });
        await sleep(REQUEST_DELAY_MS);
      } catch (err) {
        errors.push(`[${categoryUrl}] ${(err as Error).message}`);
      }
    }

    if (productUrls.size === 0) {
      errors.push(
        'No product links found. Likely causes: (a) selectors in SELECTORS are wrong — ' +
        'open the site, inspect, and update; (b) the site uses JS rendering and needs Playwright; ' +
        '(c) the category URL is wrong.'
      );
    }

    // 2. Visit each product page
    const urlList = Array.from(productUrls).slice(0, MAX_PRODUCTS_PER_RUN);
    for (const url of urlList) {
      try {
        const html = await fetchHtml(url);
        const product = parseProductPage(html, url, scrapedAt);
        if (product) products.push(product);
        await sleep(REQUEST_DELAY_MS);
      } catch (err) {
        errors.push(`[${url}] ${(err as Error).message}`);
      }
    }

    return { source: 'zoomart', products, errors, scrapedAt };
  },
};

function parseProductPage(html: string, url: string, scrapedAt: string): ScrapedProduct | null {
  const $ = cheerio.load(html);
  const title = $(DETAIL_SELECTORS.title).first().text().trim();
  if (!title) return null;

  const priceRaw = $(DETAIL_SELECTORS.price).first().text();
  const price = parsePrice(priceRaw);
  if (isNaN(price) || price <= 0) return null;

  const imageRaw = $(DETAIL_SELECTORS.image).first().attr('src')
    || $(DETAIL_SELECTORS.image).first().attr('data-src')
    || '';
  const image = imageRaw ? absoluteUrl(imageRaw, BASE_URL) : '';

  const brand = $(DETAIL_SELECTORS.brand).first().text().trim()
    || title.split(' ')[0]
    || 'Unknown';

  const description = $(DETAIL_SELECTORS.description).text();
  const ingredientsText = $(DETAIL_SELECTORS.ingredients).text();
  const ingredients = ingredientsText
    ? ingredientsText.split(/[,;]/).map(s => s.trim()).filter(Boolean).slice(0, 8)
    : [];

  const stockText = $(DETAIL_SELECTORS.stockBadge).text().toLowerCase();
  const inStock = !/out.of.stock|нет в наличии|არ არის/i.test(stockText);

  const bagSize_g = parseBagSizeGrams(title) || parseBagSizeGrams(description);

  return {
    id: 'zoomart-' + slugify(title),
    source: 'zoomart',
    sourceUrl: url,
    brand,
    name: title,
    image,
    price,
    currency: 'GEL',
    bagSize_g: bagSize_g || 1000,
    lifeStage: classifyLifeStage(title),
    breedSize: classifyBreedSize(title),
    proteinSource: detectProteinSource(title + ' ' + description),
    grainFree: isGrainFree(title, ingredients),
    highProtein: /high.protein|protein.\d{2,}/i.test(title + ' ' + description),
    weightControl: /weight.(control|management|loss)|light/i.test(title),
    ingredients,
    rating: 4.5,
    inStock,
    scrapedAt,
    store: 'Zoomart.ge',
  };
}
