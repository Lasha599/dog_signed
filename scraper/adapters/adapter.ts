// Every store adapter implements this interface.
// To add a new store: create a new file in scraper/adapters/ that exports a `StoreAdapter`,
// then register it in scraper/run.ts.

import type { ScrapeResult } from '../types';

export interface StoreAdapter {
  /** Short machine name, e.g. "zoomart" */
  source: string;
  /** Human-readable, e.g. "Zoomart.ge" */
  storeName: string;
  /** Base URL of the storefront, used for resolving relative links */
  baseUrl: string;
  /** Run the scrape. Should never throw — collect errors into the result. */
  scrape(): Promise<ScrapeResult>;
}
