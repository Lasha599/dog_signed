// Types shared between the scraper and the Next.js frontend.
// Keep this in sync with lib/products.ts — the scraped Product shape
// must be a superset of the frontend Product shape.

export type LifeStage = 'puppy' | 'adult' | 'senior';
export type BreedSize = 'small' | 'medium' | 'large';

export type ScrapedProduct = {
  id: string;                 // store-prefixed slug, e.g. "zoomart-royal-canin-medium-adult-15kg"
  source: 'zoomart' | 'zoocity' | 'zoolife';
  sourceUrl: string;          // direct link back to the product page
  brand: string;
  name: string;               // full product title
  image: string;              // absolute image URL
  price: number;              // in GEL (Georgian Lari)
  currency: 'GEL';
  bagSize_g: number;          // normalized to grams (15kg → 15000)
  lifeStage: LifeStage;
  breedSize: BreedSize;
  proteinSource: string;
  grainFree: boolean;
  highProtein: boolean;
  weightControl: boolean;
  ingredients: string[];
  rating: number;             // 0-5, default 4.5 if site doesn't expose ratings
  inStock: boolean;
  scrapedAt: string;          // ISO timestamp
  store: string;              // human-readable store name
};

export type ScrapeResult = {
  source: ScrapedProduct['source'];
  products: ScrapedProduct[];
  errors: string[];
  scrapedAt: string;
};
