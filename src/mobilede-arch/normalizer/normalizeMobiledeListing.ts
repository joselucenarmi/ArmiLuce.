import type { MobiledeBrowseItem } from '../types/index.ts';
import type { NormalizedListing } from '../../ebay-arch/types/index.ts';

/**
 * Fase B: stub de normalización.
 * En Fase D se completará el mapping exacto.
 */
export function normalizeMobiledeListing(item: MobiledeBrowseItem): NormalizedListing {
  return {
    title: item.title ?? 'Sin título',
    description: null,
    price: typeof item.price === 'number' ? item.price : 0,
    location: item.location ?? null,

    type: 'mobilede',
    category: 'vehicle',

    source: 'mobilede',
    external_id: item.external_id ?? null,

    url_original: item.url ?? null,
    source_url: item.url ?? null,

    image_url: item.images?.[0] ?? null,
    images: item.images ?? null,
  };
}
