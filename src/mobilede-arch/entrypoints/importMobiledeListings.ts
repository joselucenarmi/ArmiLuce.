import type {
  MobiledeClientConfig,
  MobiledeTokenCache,
  MobiledeBrowseRequest,
  MobiledeMarketplaceId,
} from '../types/index.ts';

import type { NormalizedListing } from '../../ebay-arch/types/index.ts';
import { browseMobiledeAds } from '../browse/browseMobiledeItems.ts';
import { normalizeMobiledeListings } from '../normalizer/normalizeMobiledeListings.ts';
import { deduplicateListings } from '../../ebay-arch/importer/deduplicate.ts';

/**
 * Fase B: entrada por contrato (sin scraper real).
 * - En Fase C se implementará browseMobiledeAds con Playwright.
 * - En Fase D se completará el normalizador para external_id/enlaces.
 *
 * NO integra Supabase aún (la integración completa será en Fase E).
 */
export async function importMobiledeListings(params: {
  config: MobiledeClientConfig;
  marketplaceId: MobiledeMarketplaceId;
  query: string;
  limit: number;
  tokenCache: MobiledeTokenCache;
}): Promise<{ imported: number; fetched: number; attempted: number }> {
  const { config, marketplaceId, query, limit, tokenCache } = params;

  const browseReq: MobiledeBrowseRequest = {
    query,
    limit,
    offset: 0,
  };

  const browse = await browseMobiledeAds({
    request: browseReq,
    marketplaceId,
    config,
    tokenCache,
  });

  const normalized: NormalizedListing[] = normalizeMobiledeListings(browse.items);
  const deduped = deduplicateListings(normalized);

  // Fase B: como no hay inserción a DB, "imported" == deduped.length.
  // fetched/attempted: se reporta para mantener contrato y logs futuros.
  const attempted = normalized.length;
  const fetched = browse.items.length;

  return { imported: deduped.length, fetched, attempted };
}
