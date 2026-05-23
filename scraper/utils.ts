// Shared utilities for all store adapters.
// Anything that's "the same across all three sites" lives here.

import type { LifeStage, BreedSize } from './types';

// Real-browser User-Agent. Many sites (including zoomart.ge) return 403 to obvious bot
// User-Agents. Using a real one is the difference between "no data" and "data". If you
// want to be more polite, contact the store for an affiliate / API arrangement instead.
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Fetch a URL with a polite User-Agent, a timeout, and one automatic retry on failure.
 * Returns HTML text or throws.
 */
export async function fetchHtml(url: string, retries = 1): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en,ka;q=0.9,ru;q=0.8',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.text();
    } catch (err) {
      clearTimeout(timer);
      if (attempt === retries) throw err;
      await sleep(1000 * (attempt + 1)); // backoff: 1s, 2s, ...
    }
  }
  throw new Error('unreachable');
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse a price string into a number. Handles formats like:
 *  "45.50 ₾", "45,50 GEL", "₾45.50", "45.50"
 */
export function parsePrice(raw: string | undefined | null): number {
  if (!raw) return NaN;
  const cleaned = raw
    .replace(/\u00A0/g, ' ')          // non-breaking space
    .replace(/[^\d,.\s]/g, '')        // strip currency symbols
    .trim()
    .replace(/\s+/g, '')
    .replace(',', '.');               // EU decimal style → US
  const num = parseFloat(cleaned);
  return isNaN(num) ? NaN : num;
}

/**
 * Parse bag size from a product title into grams.
 * Handles: "15 kg", "15kg", "500 g", "2.5 кг", "12kg" etc.
 */
export function parseBagSizeGrams(text: string): number {
  if (!text) return 0;
  // Match number + optional decimal + unit (kg/g/кг/გრ etc.)
  const kgMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|кг|კგ|кгр)/i);
  if (kgMatch) {
    const n = parseFloat(kgMatch[1].replace(',', '.'));
    return Math.round(n * 1000);
  }
  const gMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gr|გრ|гр)\b/i);
  if (gMatch) {
    const n = parseFloat(gMatch[1].replace(',', '.'));
    return Math.round(n);
  }
  return 0;
}

/**
 * Best-effort classification of life stage from a product title.
 * Keywords are matched case-insensitively, English + Russian + Georgian where common.
 */
export function classifyLifeStage(title: string): LifeStage {
  const t = title.toLowerCase();
  if (/\b(puppy|junior|щенок|ლეკვი)\b/i.test(t)) return 'puppy';
  if (/\b(senior|mature|7\+|пожилой|ხანდაზმული)\b/i.test(t)) return 'senior';
  return 'adult';
}

/**
 * Classify breed size from title keywords.
 */
export function classifyBreedSize(title: string): BreedSize {
  const t = title.toLowerCase();
  if (/\b(small|mini|toy|маленьк|мелких|პატარა)\b/i.test(t)) return 'small';
  if (/\b(large|maxi|giant|крупн|დიდი)\b/i.test(t)) return 'large';
  return 'medium';
}

/**
 * Sniff the dominant protein source from a title.
 */
export function detectProteinSource(title: string): string {
  const t = title.toLowerCase();
  if (/chicken|курица|ქათამ/i.test(t)) return 'chicken';
  if (/beef|говядин|ხბო/i.test(t)) return 'beef';
  if (/lamb|ягнен|ცხვარ/i.test(t)) return 'lamb';
  if (/salmon|fish|рыб|тунец|თევზ/i.test(t)) return 'salmon';
  if (/turkey|индейк|ინდაური/i.test(t)) return 'turkey';
  if (/duck|утк|იხვ/i.test(t)) return 'duck';
  if (/venison|оленин/i.test(t)) return 'venison';
  return 'chicken'; // safest default for dog food
}

export function isGrainFree(title: string, ingredients: string[] = []): boolean {
  const haystack = (title + ' ' + ingredients.join(' ')).toLowerCase();
  if (/grain[\s-]?free|без зерна|без злак|უმარცვლო/i.test(haystack)) return true;
  return false;
}

/**
 * Slugify a string for use in IDs. Keeps ASCII, lowercases, replaces spaces with dashes.
 */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

/**
 * Resolve a relative URL against a base.
 */
export function absoluteUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}
