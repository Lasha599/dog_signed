/**
 * Adapter for zoolife.ge
 * ⚠️ Selectors are best-guess — verify on the live site and tune.
 */

import * as cheerio from 'cheerio';
import type { StoreAdapter } from './adapter';
import type { ScrapeResult, ScrapedProduct } from '../types';
import {
  fetchHtml, sleep, parsePrice, parseBagSizeGrams,
  classifyLifeStage, classifyBreedSize, detectProteinSource,
  isGrainFree, slugify, absoluteUrl,
} from '../utils';

const BASE_URL = 'https://zoolife.ge';

// TODO: Verify category URL.
const CATEGORY_URLS = [`${BASE_URL}/dog-food`];

// TODO: Tune selectors after inspecting zoolife.ge.
const SELECTORS = {
  productCard: '.product, .product-tile, article.product',
  productLink: 'a[href*="/product"], a.product-link, h2 a, h3 a',
};

const DETAIL_SELECTORS = {
  title: 'h1, .product-title',
  price: '.price, .product-price',
  image: '.product-image img, .gallery-main img',
  brand: '.brand-name, .product-brand',
  description: '.product-description, #description',
  ingredients: '.ingredients, .composition, #ingredients',
  stockBadge: '.stock-status, .availability',
};

const MAX_PRODUCTS_PER_RUN = 30;
const REQUEST_DELAY_MS = 1500;

export const zoolifeAdapter: StoreAdapter = {
  source: 'zoolife',
  storeName: 'Zoolife.ge',
  baseUrl: BASE_URL,

  async scrape(): Promise<ScrapeResult> {
    const products: ScrapedProduct[] = [];
    const errors: string[] = [];
    const scrapedAt = new Date().toISOString();
    const urls = new Set<string>();

    for (const categoryUrl of CATEGORY_URLS) {
      try {
        const html = await fetchHtml(categoryUrl);
        const $ = cheerio.load(html);
        $(SELECTORS.productCard).each((_, el) => {
          const href = $(el).find(SELECTORS.productLink).first().attr('href');
          if (href) urls.add(absoluteUrl(href, BASE_URL));
        });
        await sleep(REQUEST_DELAY_MS);
      } catch (err) {
        errors.push(`[${categoryUrl}] ${(err as Error).message}`);
      }
    }

    if (urls.size === 0) {
      errors.push('No product links found on zoolife.ge — selectors likely need tuning.');
    }

    for (const url of Array.from(urls).slice(0, MAX_PRODUCTS_PER_RUN)) {
      try {
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);
        const title = $(DETAIL_SELECTORS.title).first().text().trim();
        if (!title) continue;

        const price = parsePrice($(DETAIL_SELECTORS.price).first().text());
        if (isNaN(price) || price <= 0) continue;

        const imageRaw = $(DETAIL_SELECTORS.image).first().attr('src')
          || $(DETAIL_SELECTORS.image).first().attr('data-src') || '';

        const description = $(DETAIL_SELECTORS.description).text();
        const ingredientsText = $(DETAIL_SELECTORS.ingredients).text();
        const ingredients = ingredientsText
          ? ingredientsText.split(/[,;]/).map(s => s.trim()).filter(Boolean).slice(0, 8)
          : [];

        const stockText = $(DETAIL_SELECTORS.stockBadge).text().toLowerCase();
        const inStock = !/out.of.stock|нет в наличии|არ არის/i.test(stockText);
        const bagSize_g = parseBagSizeGrams(title) || parseBagSizeGrams(description);

        products.push({
          id: 'zoolife-' + slugify(title),
          source: 'zoolife',
          sourceUrl: url,
          brand: $(DETAIL_SELECTORS.brand).first().text().trim() || title.split(' ')[0],
          name: title,
          image: imageRaw ? absoluteUrl(imageRaw, BASE_URL) : '',
          price,
          currency: 'GEL',
          bagSize_g: bagSize_g || 1000,
          lifeStage: classifyLifeStage(title),
          breedSize: classifyBreedSize(title),
          proteinSource: detectProteinSource(title + ' ' + description),
          grainFree: isGrainFree(title, ingredients),
          highProtein: /high.protein/i.test(title + ' ' + description),
          weightControl: /weight.(control|management)|light/i.test(title),
          ingredients,
          rating: 4.5,
          inStock,
          scrapedAt,
          store: 'Zoolife.ge',
        });
        await sleep(REQUEST_DELAY_MS);
      } catch (err) {
        errors.push(`[${url}] ${(err as Error).message}`);
      }
    }

    return { source: 'zoolife', products, errors, scrapedAt };
  },
};
