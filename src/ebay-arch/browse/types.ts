import type { EbayBrowseItem, EbayMarketplaceId } from '../types/index.ts';

export type EbayBrowseAdsRequest = {
  /** conjunto mínimo para flujo: los datos exactos se ajustan luego */
  marketplaceId: EbayMarketplaceId;
  /** filtros opcionales */
  limit: number;
};

export type EbayBrowseResponse = {
  items: EbayBrowseItem[];
};

