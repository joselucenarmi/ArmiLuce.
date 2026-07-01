import type {
  MobiledeBrowseRequest,
  MobiledeBrowseResponse,
  MobiledeMarketplaceId,
  MobiledeBrowseItem,
} from '../types/index.ts';

import type { MobiledeClientConfig, MobiledeTokenCache } from '../types/index.ts';

/**
 * Fase B: stub. No implementa scraping todavía.
 * Fase C implementará:
 *  - abrir mobile.de
 *  - búsqueda
 *  - detectar anuncios
 *  - extraer enlaces e identificadores (external_id)
 *  - paginación viable
 */
export async function browseMobiledeAds(params: {
  request: MobiledeBrowseRequest;
  marketplaceId: MobiledeMarketplaceId;
  config: MobiledeClientConfig;
  tokenCache: MobiledeTokenCache;
}): Promise<MobiledeBrowseResponse> {
  void params;

  // Conservador: devuelve vacío para que el compilado/bundling funcione sin romper el core.
  return {
    items: [],
    total: 0,
    offset: params.request.offset ?? 0,
    limit: params.request.limit,
  };
}

export function assertMobiledeBrowseItem(item: unknown): asserts item is MobiledeBrowseItem {
  // Contrato para futuras fases (no se usa en Fase B).
  void item;
}
