// Product catalog: merges scraped data from Georgian pet food stores (zoomart.ge,
// zoocity.ge, zoolife.ge) with a hardcoded mock catalog used as fallback.
//
// To refresh scraped data, run from the project root:
//   npm run scrape           # all stores
//   npm run scrape:zoomart   # one store
//
// The scraper writes lib/scraped-products.json which is imported below.
// If scraping fails or returns nothing, the mock catalog (MOCK_PRODUCTS) keeps the app usable.

import scrapedRaw from './scraped-products.json';

export type LifeStage = 'puppy' | 'adult' | 'senior';
export type BreedSize = 'small' | 'medium' | 'large';

export type Product = {
  id: string;
  brand: string;
  name: string;
  image: string;
  price: number;
  bagSize_g: number;
  lifeStage: LifeStage;
  breedSize: BreedSize;
  proteinSource: string;
  grainFree: boolean;
  highProtein: boolean;
  weightControl: boolean;
  ingredients: string[];
  rating: number;
  store: string;
  scrapedAt: string;
  // Optional fields populated only on scraped products:
  source?: 'zoomart' | 'zoocity' | 'zoolife';
  sourceUrl?: string;
  currency?: string;
  inStock?: boolean;
};

// Treat scraped JSON as Product[] — the scraper produces a superset of these fields.
const SCRAPED_PRODUCTS = scrapedRaw as unknown as Product[];

// Format scrapedAt timestamps (ISO from scraper) into "Xh ago" for display.
function relativeTime(iso: string): string {
  if (!iso) return 'just now';
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const SCRAPED_WITH_RELATIVE_TIME: Product[] = SCRAPED_PRODUCTS.map(p => ({
  ...p,
  scrapedAt: relativeTime(p.scrapedAt),
  inStock: p.inStock !== false,
}));

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1', brand: 'NorthPaw Naturals', name: 'Wild Salmon & Sweet Potato',
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400',
    price: 54.99, bagSize_g: 12000, lifeStage: 'adult', breedSize: 'medium',
    proteinSource: 'salmon', grainFree: true, highProtein: true, weightControl: false,
    ingredients: ['salmon', 'sweet potato', 'peas', 'flaxseed'], rating: 4.7,
    store: 'PetMart', scrapedAt: '2h ago',
  },
  {
    id: 'p2', brand: 'TrailMix Canine', name: 'Mountain Recipe Adult',
    image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400',
    price: 42.50, bagSize_g: 15000, lifeStage: 'adult', breedSize: 'large',
    proteinSource: 'chicken', grainFree: false, highProtein: false, weightControl: false,
    ingredients: ['chicken', 'brown rice', 'barley', 'carrots'], rating: 4.4,
    store: 'Chewify', scrapedAt: '4h ago',
  },
  {
    id: 'p3', brand: 'Kibble & Co.', name: 'Puppy Growth Formula',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400',
    price: 38.00, bagSize_g: 8000, lifeStage: 'puppy', breedSize: 'medium',
    proteinSource: 'chicken', grainFree: false, highProtein: true, weightControl: false,
    ingredients: ['chicken', 'oats', 'salmon oil', 'blueberries'], rating: 4.8,
    store: 'PetMart', scrapedAt: '1h ago',
  },
  {
    id: 'p4', brand: 'Hearth & Hound', name: 'Senior Wellness Lamb',
    image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
    price: 49.99, bagSize_g: 10000, lifeStage: 'senior', breedSize: 'medium',
    proteinSource: 'lamb', grainFree: false, highProtein: false, weightControl: true,
    ingredients: ['lamb', 'brown rice', 'glucosamine', 'pumpkin'], rating: 4.6,
    store: 'BarkBox Store', scrapedAt: '3h ago',
  },
  {
    id: 'p5', brand: 'NorthPaw Naturals', name: 'Small Breed Turkey',
    image: 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=400',
    price: 36.00, bagSize_g: 5000, lifeStage: 'adult', breedSize: 'small',
    proteinSource: 'turkey', grainFree: true, highProtein: true, weightControl: false,
    ingredients: ['turkey', 'lentils', 'spinach', 'flaxseed'], rating: 4.5,
    store: 'Chewify', scrapedAt: '5h ago',
  },
  {
    id: 'p6', brand: 'TrailMix Canine', name: 'Large Breed Beef',
    image: 'https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?w=400',
    price: 58.99, bagSize_g: 18000, lifeStage: 'adult', breedSize: 'large',
    proteinSource: 'beef', grainFree: false, highProtein: true, weightControl: false,
    ingredients: ['beef', 'brown rice', 'carrots', 'spinach'], rating: 4.3,
    store: 'PetMart', scrapedAt: '6h ago',
  },
  {
    id: 'p7', brand: 'Kibble & Co.', name: 'Weight Management Adult',
    image: 'https://images.unsplash.com/photo-1581888227599-779811939961?w=400',
    price: 44.00, bagSize_g: 11000, lifeStage: 'adult', breedSize: 'medium',
    proteinSource: 'chicken', grainFree: false, highProtein: false, weightControl: true,
    ingredients: ['chicken', 'barley', 'L-carnitine', 'fiber blend'], rating: 4.2,
    store: 'BarkBox Store', scrapedAt: '2h ago',
  },
  {
    id: 'p8', brand: 'Hearth & Hound', name: 'Limited Ingredient Duck',
    image: 'https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=400',
    price: 62.00, bagSize_g: 10000, lifeStage: 'adult', breedSize: 'medium',
    proteinSource: 'duck', grainFree: true, highProtein: false, weightControl: false,
    ingredients: ['duck', 'sweet potato', 'pumpkin'], rating: 4.9,
    store: 'Chewify', scrapedAt: '3h ago',
  },
  {
    id: 'p9', brand: 'NorthPaw Naturals', name: 'Senior Small Breed',
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400',
    price: 39.99, bagSize_g: 4000, lifeStage: 'senior', breedSize: 'small',
    proteinSource: 'chicken', grainFree: false, highProtein: false, weightControl: true,
    ingredients: ['chicken', 'oats', 'glucosamine'], rating: 4.5,
    store: 'PetMart', scrapedAt: '4h ago',
  },
  {
    id: 'p10', brand: 'TrailMix Canine', name: 'Puppy Large Breed',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
    price: 46.50, bagSize_g: 14000, lifeStage: 'puppy', breedSize: 'large',
    proteinSource: 'chicken', grainFree: false, highProtein: true, weightControl: false,
    ingredients: ['chicken', 'rice', 'fish oil', 'calcium'], rating: 4.6,
    store: 'Chewify', scrapedAt: '1h ago',
  },
  {
    id: 'p11', brand: 'Kibble & Co.', name: 'Performance High-Energy',
    image: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400',
    price: 56.00, bagSize_g: 13000, lifeStage: 'adult', breedSize: 'large',
    proteinSource: 'chicken', grainFree: false, highProtein: true, weightControl: false,
    ingredients: ['chicken', 'beef', 'rice', 'fish meal'], rating: 4.4,
    store: 'BarkBox Store', scrapedAt: '2h ago',
  },
  {
    id: 'p12', brand: 'Hearth & Hound', name: 'Grain-Free Venison',
    image: 'https://images.unsplash.com/photo-1546975490-e8b92a360b24?w=400',
    price: 68.00, bagSize_g: 11000, lifeStage: 'adult', breedSize: 'medium',
    proteinSource: 'venison', grainFree: true, highProtein: true, weightControl: false,
    ingredients: ['venison', 'sweet potato', 'peas', 'blueberries'], rating: 4.8,
    store: 'PetMart', scrapedAt: '5h ago',
  },
];

// Merged catalog: scraped real products come first (when available), mock products
// fill in. If the scraper hasn't run yet, or all stores failed, we still have the mock
// catalog so the app never shows an empty page.
export const PRODUCTS: Product[] =
  SCRAPED_WITH_RELATIVE_TIME.length > 0
    ? [...SCRAPED_WITH_RELATIVE_TIME, ...MOCK_PRODUCTS]
    : MOCK_PRODUCTS;

export const HAS_SCRAPED_DATA = SCRAPED_WITH_RELATIVE_TIME.length > 0;
export const SCRAPED_COUNT = SCRAPED_WITH_RELATIVE_TIME.length;

export const BRANDS = Array.from(new Set(PRODUCTS.map(p => p.brand))).sort();
