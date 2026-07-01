import type { EbayBrowseItem, EbayMarketplaceId } from '../types/index.ts';

export type EbayBrowseAdsRequest = {
  /** conjunto mínimo para flujo: los datos exactos se ajustan luego */
  marketplaceId: EbayMarketplaceId;
  /** número máximo total de anuncios a recuperar (se pagina internamente hasta alcanzarlo) */
  limit: number;
  /**
   * IDs de categoría oficiales de eBay a recorrer (categoría "vehículos", no
   * "piezas y accesorios"). Si no se indica, se usa la lista por defecto de
   * categorías de vehículos definida en browseEbayItems.ts.
   */
  categoryIds?: string[];
};

export type EbayBrowseResponse = {
  items: EbayBrowseItem[];
};

