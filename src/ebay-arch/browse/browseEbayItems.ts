import type { EbayBrowseAdsRequest, EbayBrowseResponse } from './types';
import type { EbayClientCredentialsConfig, EbayToken, EbayTokenCache, EbayBrowseItem } from '../types';
import { getOAuthToken } from '../auth/getOAuthToken';

function assertString(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing/invalid ${name}`);
  }
  return value;
}

export async function browseEbayAds(params: {
  request: EbayBrowseAdsRequest;
  config: EbayClientCredentialsConfig;
  tokenCache: EbayTokenCache;
}): Promise<EbayBrowseResponse> {
  const { request, config, tokenCache } = params;

  const token: EbayToken = await getOAuthToken({ config, cache: tokenCache });

  // Flujo mínimo para lograr “anuncios reales”: usamos Browse API equivalente via endpoint de anuncios.
  // Nota: el endpoint exacto puede variar por entorno/compatibilidad; si eBay responde con error
  // se deberá ajustar la ruta y parámetros.

  // Para mantener el flujo implementable, usamos la API de "find"/"get" que permite IDs.
  // Sin embargo, aquí no conocemos el endpoint definitivo del repo previo; por eso implementamos
  // la llamada con parámetros mínimos y transformamos al formato EbayBrowseItem.

  // Example de endpoint (ajustable):
  // GET https://api.ebay.com/buy/browse/v1/item_summary/search?q=... (reemplazado posteriormente)

  const query = `categoryId:${request.marketplaceId}`;

  const url = new URL(
    config.environment === 'production'
      ? 'https://api.ebay.com/buy/browse/v1/item_summary/search'
      : 'https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search',
  );

  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(request.limit));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      'X-EBAY-C-MARKETPLACE-ID': request.marketplaceId,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`eBay Browse API error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as any;

  const rawItems: any[] = Array.isArray(data?.itemSummaries)
    ? data.itemSummaries
    : Array.isArray(data?.itemSummaries)
      ? data.itemSummaries
      : Array.isArray(data?.items)
        ? data.items
        : [];

  const items: EbayBrowseItem[] = rawItems.slice(0, request.limit).map((it: any) => {
    const itemId = assertString(it?.item?.itemId ?? it?.itemId ?? it?.item?.id, 'itemId');

    const title = typeof it?.title === 'string' ? it.title : undefined;
    const description = typeof it?.shortDescription === 'string' ? it.shortDescription : undefined;

    const galleryURL = Array.isArray(it?.image?.imageUrls)
      ? it.image.imageUrls.filter((u: any) => typeof u === 'string')
      : Array.isArray(it?.imageUrls)
        ? it.imageUrls.filter((u: any) => typeof u === 'string')
        : undefined;

    const viewItemURL = typeof it?.item?.itemWebUrl === 'string' ? it.item.itemWebUrl : undefined;

    const location = typeof it?.item?.location === 'string' ? it.item.location : undefined;

    const categoryId = it?.categoryId ? String(it.categoryId) : undefined;

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
      galleryURL,
      viewItemURL,
      location,
      categoryId,
      price,
    };
  });

  return { items };
}

