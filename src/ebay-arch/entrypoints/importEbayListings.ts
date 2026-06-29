import type {
  EbayClientCredentialsConfig,
  EbayTokenCache,
  NormalizedListing,
} from '../types';


import type { EbayBrowseResponse } from '../browse/types';
import { browseEbayAds } from '../browse/browseEbayItems';
import { normalizeEbayListings } from '../normalizer/normalizeEbayListings';
import { deduplicateListings } from '../importer/deduplicate';
import { insertListingsToDb } from '../importer/insertListings';

export async function importEbayListings(params: {
  config: EbayClientCredentialsConfig;
  marketplaceId: string;
  limit: number;
  tokenCache: EbayTokenCache;
}): Promise<{ imported: number }> {
  const { config, marketplaceId, limit, tokenCache } = params;

  const browse: EbayBrowseResponse = await browseEbayAds({
    request: {
      marketplaceId,
      limit,
    },
    config,
    tokenCache,
  });

  const normalized: NormalizedListing[] = normalizeEbayListings(browse.items);
  const deduped = deduplicateListings(normalized);

  const db = await insertListingsToDb({ listings: deduped });
  return { imported: db.inserted };
}

