import type { EbayBrowseAdsRequest, EbayBrowseResponse } from './types.ts';
import type { EbayClientCredentialsConfig, EbayToken, EbayTokenCache, EbayBrowseItem } from '../types/index.ts';
import { getOAuthToken } from '../auth/getOAuthToken.ts';

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

  // Use valid search query for Browse API
  // TODO: make configurable via EBAY_SEARCH_QUERY env var
  const query = 'BMW';

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
  });

  return { items };
}

