import type { EbayClientCredentialsConfig, EbayTokenCache } from '../types/index.ts';
import { importEbayListings } from '../entrypoints/importEbayListings.ts';

export async function importEbayListingsFlow(params: {
  config: EbayClientCredentialsConfig;
  marketplaceId: string;
  limit: number;
  tokenCache: EbayTokenCache;
  categoryIds?: string[];
}): Promise<{ imported: number; fetched: number; attempted: number }> {
  return importEbayListings(params);
}

