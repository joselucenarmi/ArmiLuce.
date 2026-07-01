import type { MobiledeBrowseItem, MobiledeBrowseResponse } from '../types/index.ts';
import type { NormalizedListing } from '../../ebay-arch/types/index.ts';
import { normalizeMobiledeListing } from './normalizeMobiledeListing.ts';
import type { MobiledeMarketplaceId } from '../types/index.ts';

/**
 * Fase B: normalizador por contrato (sin extracción real aún).
 * En Fase D se completará el mapping exacto desde el scraper.
 */
export function normalizeMobiledeListings(items: MobiledeBrowseItem[]): NormalizedListing[] {
  return items.map(normalizeMobiledeListing);
}

export function normalizeMobiledeBrowseResponse(params: {
  response: MobiledeBrowseResponse;
  marketplaceId: MobiledeMarketplaceId;
}): NormalizedListing[] {
  void params;
  // En Fase D se usará response.items y se validará consistencia por marketplace.
  return normalizeMobiledeListings(params.response.items);
}
