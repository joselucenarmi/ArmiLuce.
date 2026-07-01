import type { EbayBrowseItem, NormalizedListing } from '../types/index.ts';

export function normalizeEbayListing(item: EbayBrowseItem): NormalizedListing {
  const title = item.title ?? 'Sin título';
  const description = item.description ?? null;

  const priceNumber = (() => {
    if (!item.price?.value) return 0;
    const n = Number(String(item.price.value).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  })();

  const location = item.location ?? null;
  const type = 'ebay';
  const category = item.categoryId ?? 'unknown';

  return {
    title,
    description,
    price: priceNumber,
    location,
    type,
    category,
    source: 'ebay',
    external_id: item.itemId ?? null,
    url_original: item.viewItemURL ?? null,
    source_url: item.viewItemURL ?? null,
    image_url: item.galleryURL?.[0] ?? null,
    images: item.galleryURL ?? null,
  };
}

export function normalizeEbayListings(items: EbayBrowseItem[]): NormalizedListing[] {
  return items.map(normalizeEbayListing);
}

