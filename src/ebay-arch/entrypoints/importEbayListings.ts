import type {
  EbayClientCredentialsConfig,
  EbayTokenCache,
  NormalizedListing,
} from '../types/index.ts';


import type { EbayBrowseResponse } from '../browse/types.ts';
import { browseEbayAds } from '../browse/browseEbayItems.ts';
import { normalizeEbayListings } from '../normalizer/normalizeEbayListings.ts';
import { deduplicateListings } from '../importer/deduplicate.ts';
import { insertListingsToDb } from '../importer/insertListings.ts';

export async function importEbayListings(params: {
  config: EbayClientCredentialsConfig;
  marketplaceId: string;
  limit: number;
  tokenCache: EbayTokenCache;
  /** Categorías eBay de vehículos a recorrer; por defecto usa la lista interna de browseEbayItems.ts */
  categoryIds?: string[];
}): Promise<{ imported: number }> {
  const { config, marketplaceId, limit, tokenCache, categoryIds } = params;

  const browse: EbayBrowseResponse = await browseEbayAds({
    request: {
      marketplaceId,
      limit,
      categoryIds,
    },
    config,
    tokenCache,
  });

  const normalized: NormalizedListing[] = normalizeEbayListings(browse.items);
  const deduped = deduplicateListings(normalized);

  const db = await insertListingsToDb({ listings: deduped });
  return { imported: db.inserted };
}

