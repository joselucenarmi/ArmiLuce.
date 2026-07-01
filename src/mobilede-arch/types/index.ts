export type MobiledeEnvironment = 'production' | 'sandbox';

export type MobiledeMarketplaceId = string; // e.g. MOBILEDE

export type MobiledeClientConfig = {
  // Mobile.de no usa OAuth en esta implementación inicial.
  // Se reserva estructura para credenciales/headers si hicieran falta.
  environment: MobiledeEnvironment;
};

export type MobiledeTokenCache = {
  // Placeholder para mantener el mismo contrato general (sin lógica).
  // Fase C implementará scraping y podría usar cookies/sesión si aplica.
  _unused?: never;
};

export type MobiledeBrowseRequest = {
  // Búsqueda: puede ampliarse en Fase C según el parser real del sitio.
  query: string;
  limit: number;
  offset?: number;
};

export type MobiledeBrowseItem = {
  external_id: string; // identificación canónica del anuncio (extraída en Fase C)
  title?: string;
  price?: number;
  currency?: string;
  url?: string;

  // Campos opcionales que en Fase C se intentarán extraer
  location?: string;
  images?: string[];
};

export type MobiledeBrowseResponse = {
  items: MobiledeBrowseItem[];
  total?: number;
  offset?: number;
  limit?: number;
};
