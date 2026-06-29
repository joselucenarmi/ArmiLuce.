import type { Listing } from '../../../lib/supabase';

/**
 * Tipos raw (recibidos desde eBay) — esquema mínimo a definir gradualmente.
 */
export interface EbayRawListing {
  // Nota: eBay representa diferentes anuncios con diferentes endpoints/fields.
  // Aquí dejamos una interfaz mínima y flexible para iterar.
  itemId: string;
  title?: string;
  description?: string;
  galleryURL?: string[];
  viewItemURL?: string;
  location?: string;
  categoryId?: string;
  price?: {
    value?: string;
    currency?: string;
  };
}

export interface NormalizeEbayListingInput {
  raw: EbayRawListing;
  /** Identifica el marketplace para el formato interno */
  marketplaceId: string; // p.ej. EBAY_ES
}

/**
 * Normaliza 1 anuncio de eBay al formato interno de ArmiLuce (Listing).
 * No debe hacer HTTP ni usar secretos.
 */
export function normalizeEbayListing(input: NormalizeEbayListingInput): Omit<Listing, 'id' | 'created_at' | 'updated_at'> {
  const { raw } = input;

  const priceValue = raw.price?.value ? Number(raw.price.value) : NaN;

  return {
    title: raw.title || 'eBay - Sin título',
    description: raw.description || null,
    price: Number.isFinite(priceValue) ? priceValue : 0,
    location: raw.location || null,
    // eBay no tiene un taxonomy 1:1 con ArmiLuce; mapearemos en función de categoryId.
    type: mapEbayCategoryToInternalType(raw.categoryId),
    category: mapEbayCategoryToInternalCategory(raw.categoryId),
    source: 'ebay',
    external_id: raw.itemId ?? null,
    url_original: null,
    source_url: raw.viewItemURL || null,
    image_url: raw.galleryURL?.[0] || null,
    images: raw.galleryURL?.length ? raw.galleryURL : null,
  };
}

function mapEbayCategoryToInternalCategory(categoryId?: string): Listing['category'] {
  // Placeholder: se ajustará cuando implementemos Browse/Ad endpoints.
  // Por defecto ArmiLuce tratará estos items como 'property' para no romper compatibilidad.
  void categoryId;
  return 'property';
}

function mapEbayCategoryToInternalType(categoryId?: string): Listing['type'] {
  // Placeholder.
  void categoryId;
  return 'vivienda';
}

