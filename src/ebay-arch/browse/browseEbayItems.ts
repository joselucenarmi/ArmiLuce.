import type { EbayBrowseAdsRequest, EbayBrowseResponse } from './types.ts';
import type { EbayClientCredentialsConfig, EbayToken, EbayTokenCache, EbayBrowseItem } from '../types/index.ts';
import { getOAuthToken } from '../auth/getOAuthToken.ts';

// Categorías oficiales de eBay (árbol "Motor: vehículos", id 9800) que
// contienen anuncios de vehículos reales, NO piezas/accesorios.
// IMPORTANTE: cada marketplace/sitio de eBay tiene su PROPIO árbol de
// categorías (categoryTreeId distinto: ES=186, DE=77, FR=71, IT=101, GB=3),
// por lo que los IDs de "Coches"/"Motos"/etc. no son los mismos en todos
// los sitios aunque la categoría raíz 9800 sí coincide en los 5. Se
// verificó cada ID contra la Taxonomy API y la Browse API reales para
// cada marketplace (ver informe final).
// SUV/todoterreno no tiene categoría propia en eBay: es una carrocería
// dentro de "Coches", por lo que ya queda cubierto en todos los sitios.
// Maquinaria agrícola/construcción y embarcaciones se probaron con la API
// real (categorías 11748, 26197 y 1293 en ES) y están dominadas (>99%) por
// piezas y accesorios, no por máquinas/embarcaciones completas, por lo que
// se excluyen para no reintroducir el problema original.
type MarketplaceCategoryConfig = {
  categoryId: string;
  minPrice: number;
  currency: string;
  label: string;
};

const MARKETPLACE_VEHICLE_CATEGORIES: Record<string, MarketplaceCategoryConfig[]> = {
  EBAY_ES: [
    { categoryId: '9801', minPrice: 1500, currency: 'EUR', label: 'Coches' },
    { categoryId: '9804', minPrice: 300, currency: 'EUR', label: 'Motos' },
    { categoryId: '10495', minPrice: 200, currency: 'EUR', label: 'Scooters' },
    { categoryId: '79055', minPrice: 1500, currency: 'EUR', label: 'Furgonetas' },
    { categoryId: '79054', minPrice: 1500, currency: 'EUR', label: 'Camiones' },
    { categoryId: '60996', minPrice: 1500, currency: 'EUR', label: 'Caravanas' },
  ],
  EBAY_DE: [
    { categoryId: '9801', minPrice: 1500, currency: 'EUR', label: 'Automobile' },
    { categoryId: '9804', minPrice: 300, currency: 'EUR', label: 'Motorräder' },
    { categoryId: '45642', minPrice: 1500, currency: 'EUR', label: 'Nutzfahrzeuge' },
    { categoryId: '44794', minPrice: 1500, currency: 'EUR', label: 'Wohnwagen & Wohnmobile' },
  ],
  EBAY_FR: [
    { categoryId: '9801', minPrice: 1500, currency: 'EUR', label: 'Autos' },
    { categoryId: '115621', minPrice: 300, currency: 'EUR', label: 'Motos, scooters, quads' },
    { categoryId: '79053', minPrice: 1500, currency: 'EUR', label: 'Utilitaires' },
    { categoryId: '44790', minPrice: 1500, currency: 'EUR', label: 'Caravanes' },
  ],
  EBAY_IT: [
    { categoryId: '9801', minPrice: 1500, currency: 'EUR', label: 'Auto' },
    { categoryId: '9804', minPrice: 300, currency: 'EUR', label: 'Moto e scooter' },
    { categoryId: '14256', minPrice: 1500, currency: 'EUR', label: 'Veicoli commerciali' },
    { categoryId: '105646', minPrice: 1500, currency: 'EUR', label: 'Camper e roulotte' },
  ],
  EBAY_GB: [
    { categoryId: '9801', minPrice: 1300, currency: 'GBP', label: 'Cars' },
    { categoryId: '422', minPrice: 260, currency: 'GBP', label: 'Motorcycles & Scooters' },
    { categoryId: '122202', minPrice: 1300, currency: 'GBP', label: 'Vans/Pickups' },
    { categoryId: '122192', minPrice: 1300, currency: 'GBP', label: 'Lorries/Trucks' },
    { categoryId: '121904', minPrice: 1300, currency: 'GBP', label: 'Campers, Caravans & Motorhomes' },
  ],
};

// Máximo de resultados por página que admite la Browse API de eBay.
const EBAY_BROWSE_MAX_PAGE_SIZE = 200;


// Devuelve la configuración de categorías de vehículos a usar para un
// marketplace dado; si el marketplace no está mapeado explícitamente, se
// usa la configuración de EBAY_ES como fallback (comportamiento previo).
export function getVehicleCategoriesForMarketplace(marketplaceId: string): MarketplaceCategoryConfig[] {
  return MARKETPLACE_VEHICLE_CATEGORIES[marketplaceId] ?? MARKETPLACE_VEHICLE_CATEGORIES.EBAY_ES;
}

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

  const categoryConfigs: MarketplaceCategoryConfig[] =
    request.categoryIds && request.categoryIds.length > 0
      ? request.categoryIds.map((id) => ({ categoryId: id, minPrice: 0, currency: 'EUR', label: id }))
      : getVehicleCategoriesForMarketplace(request.marketplaceId);

  const overallLimit = request.limit;
  const seenItemIds = new Set<string>();
  const items: EbayBrowseItem[] = [];

  // Recorre cada categoría de vehículos paginando (offset/limit) hasta
  // agotar sus resultados o alcanzar el límite total solicitado.
  for (const { categoryId, minPrice, currency } of categoryConfigs) {
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
      // Prioriza anuncios recién publicados (parámetro oficial de la Browse API).
      url.searchParams.set('sort', 'newlyListed');

      if (minPrice > 0) {
        url.searchParams.set('filter', `price:[${minPrice}..],priceCurrency:${currency}`);
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

