import type { EbayClientCredentialsConfig, EbayTokenCache } from '../types';
import { importEbayListings } from '../entrypoints/importEbayListings';

export async function importEbayListingsFlow(params: {
  config: EbayClientCredentialsConfig;
  marketplaceId: string;
  limit: number;
  tokenCache: EbayTokenCache;
}): Promise<{ imported: number }> {
  return importEbayListings(params);
}

