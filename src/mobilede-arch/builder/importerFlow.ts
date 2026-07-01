import type { MobiledeClientConfig, MobiledeTokenCache, MobiledeMarketplaceId } from '../types/index.ts';
import { importMobiledeListings } from '../entrypoints/importMobiledeListings.ts';

export async function importMobiledeListingsFlow(params: {
  config: MobiledeClientConfig;
  marketplaceId: MobiledeMarketplaceId;
  query: string;
  limit: number;
  tokenCache: MobiledeTokenCache;
}): Promise<{ imported: number; fetched: number; attempted: number }> {
  return importMobiledeListings(params);
}
