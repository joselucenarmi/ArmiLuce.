import type { EbayClientCredentialsConfig, EbayTokenCache } from '../types/index.ts';
import { importEbayListings } from '../entrypoints/importEbayListings.ts';

export async function importEbayListingsFlow(params: {
  config: EbayClientCredentialsConfig;
  marketplaceId: string;
  limit: number;
  tokenCache: EbayTokenCache;
}): Promise<{ imported: number }> {
  return importEbayListings(params);
}

