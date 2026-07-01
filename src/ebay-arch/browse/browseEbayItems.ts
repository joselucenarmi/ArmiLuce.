import type { EbayBrowseAdsRequest, EbayBrowseResponse } from './types.ts';
import type { EbayClientCredentialsConfig, EbayToken, EbayTokenCache, EbayBrowseItem } from '../types/index.ts';
import { getOAuthToken } from '../auth/getOAuthToken.ts';

// Categorías oficiales de eBay (árbol "Motor: vehículos", id 9800) que
// contienen anuncios de vehículos reales, NO piezas/accesorios.
// Verificado contra la Browse API real para el marketplace EBAY_ES:
// - 9801 Coches, 9804 Motos y 10495 Scooters devuelven vehículos reales.
// - 79055 Furgonetas, 79054 Camiones y 60996 Caravanas son las categorías
//   oficiales correctas aunque el inventario activo en EBAY_ES puede ser
//   bajo o nulo en un momento dado (limitación de datos del marketplace,
//   no del código: ver informe final).
// SUV/todoterreno no tiene categoría propia en eBay: es una carrocería
// dentro de "Coches" (9801), por lo que ya queda cubierto.
// Maquinaria agrícola/construcción y embarcaciones se probaron con la API
// real (categorías 11748, 26197 y 1293) y en EBAY_ES están dominadas
// (>99%) por piezas y accesorios, no por máquinas/embarcaciones completas,
// por lo que se excluyen para no reintroducir el problema original.
const DEFAULT_VEHICLE_CATEGORY_IDS = [
  '9801', // Coches (incluye SUV / todoterreno)
  '9804', // Motos
  '10495', // Scooters
  '79055', // Furgonetas
  '79054', // Camiones
  '60996', // Caravanas / autocaravanas
];

// Dentro de "Coches"/"Motos" eBay ES organiza las hojas del árbol POR MARCA
// (p.ej. 9801 > 9837 BMW), y esa hoja mezcla vehículos completos y piezas de
// esa marca sin una subcategoría propia que los separe. Se comprobó con la
// API real que un filtro de precio mínimo elimina prácticamente toda la
// contaminación de piezas/accesorios sin perder vehículos reales (ver
// informe final). Precio mínimo por categoría, en EUR:
const MIN_PRICE_EUR_BY_CATEGORY: Record<string, number> = {
  '9801': 1500, // Coches
  '9804': 300, // Motos
  '10495': 200, // Scooters
  '79055': 1500, // Furgonetas
  '79054': 1500, // Camiones
  '60996': 1500, // Caravanas / autocaravanas
};

// Máximo de resultados por página que admite la Browse API de eBay.
const EBAY_BROWSE_MAX_PAGE_SIZE = 200;


function assertString(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing/invalid ${name}`);
  }
  return value;
}

function mapBrowseItem(it: any): EbayBrowseItem {
  const itemId = assertString(it?.itemId ?? it?.item?.itemId ?? it?.item?.id, 'itemId');

  const title = typeof it?.title === 'string' ? it.title : undefined;
  const description = typeof it?.shortDescription === 'string' ? it.shortDescription : undefined;

  // Browse API item_summary shape: image.imageUrl (single) + additionalImages[].imageUrl
  const galleryURL = [
    ...(typeof it?.image?.imageUrl === 'string' ? [it.image.imageUrl] : []),
    ...(Array.isArray(it?.additionalImages)
      ? it.additionalImages
          .map((img: any) => img?.imageUrl)
          .filter((u: any) => typeof u === 'string')
      : []),
  ];

  const viewItemURL = typeof it?.itemWebUrl === 'string' ? it.itemWebUrl : undefined;

  const location =
    typeof it?.itemLocation?.city === 'string'
      ? it.itemLocation.city
      : typeof it?.itemLocation?.country === 'string'
        ? it.itemLocation.country
        : undefined;

  const categoryId = Array.isArray(it?.categories) && it.categories[0]?.categoryId
    ? String(it.categories[0].categoryId)
    : it?.categoryId
      ? String(it.categoryId)
      : undefined;

  const priceValue = it?.price?.value ?? it?.price?.value?.amount ?? it?.price?.amount;
  const priceCurrency = it?.price?.currency ?? it?.price?.value?.currency;

  const price =
    priceValue !== undefined
      ? {
          value: String(priceValue),
          currency: priceCurrency ? String(priceCurrency) : undefined,
        }
      : undefined;

  return {
    itemId,
    title,
    description,
    galleryURL: galleryURL.length ? galleryURL : undefined,
    viewItemURL,
    location,
    categoryId,
    price,
  };
}

export async function browseEbayAds(params: {
  request: EbayBrowseAdsRequest;
  config: EbayClientCredentialsConfig;
  tokenCache: EbayTokenCache;
}): Promise<EbayBrowseResponse> {
  const { request, config, tokenCache } = params;

  const token: EbayToken = await getOAuthToken({ config, cache: tokenCache });

  const baseUrl =
    config.environment === 'production'
      ? 'https://api.ebay.com/buy/browse/v1/item_summary/search'
      : 'https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search';

  const categoryIds =
    request.categoryIds && request.categoryIds.length > 0
      ? request.categoryIds
      : DEFAULT_VEHICLE_CATEGORY_IDS;

  const overallLimit = request.limit;
  const seenItemIds = new Set<string>();
  const items: EbayBrowseItem[] = [];

  // Recorre cada categoría de vehículos paginando (offset/limit) hasta
  // agotar sus resultados o alcanzar el límite total solicitado.
  for (const categoryId of categoryIds) {
    if (items.length >= overallLimit) break;

    let offset = 0;
    let total = Number.POSITIVE_INFINITY;

    while (items.length < overallLimit && offset < total) {
      const remaining = overallLimit - items.length;
      const pageSize = Math.min(EBAY_BROWSE_MAX_PAGE_SIZE, remaining);

      const url = new URL(baseUrl);
      url.searchParams.set('category_ids', categoryId);
      url.searchParams.set('limit', String(pageSize));
      url.searchParams.set('offset', String(offset));

      const minPrice = MIN_PRICE_EUR_BY_CATEGORY[categoryId];
      if (minPrice !== undefined) {
        url.searchParams.set('filter', `price:[${minPrice}..],priceCurrency:EUR`);
      }

      let res: Response;
      try {
        res = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
            'X-EBAY-C-MARKETPLACE-ID': request.marketplaceId,
          },
        });
      } catch (err) {
        // Error de red para esta categoría: no aborta la importación completa,
        // se continúa con la siguiente categoría.
        console.error(`eBay Browse API network error (category ${categoryId}):`, err);
        break;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error(`eBay Browse API error (category ${categoryId}): ${res.status} ${text}`);
        break;
      }

      const data = (await res.json()) as any;
      total = typeof data?.total === 'number' ? data.total : 0;

      const rawItems: any[] = Array.isArray(data?.itemSummaries) ? data.itemSummaries : [];
      if (rawItems.length === 0) break;

      for (const it of rawItems) {
        try {
          const mapped = mapBrowseItem(it);
          if (!seenItemIds.has(mapped.itemId)) {
            seenItemIds.add(mapped.itemId);
            items.push(mapped);
          }
        } catch (err) {
          // Item con datos incompletos: se descarta sin abortar el resto del lote.
          console.error(`Skipping malformed eBay item (category ${categoryId}):`, err);
        }
        if (items.length >= overallLimit) break;
      }

      offset += rawItems.length;
    }
  }

  return { items };
}

