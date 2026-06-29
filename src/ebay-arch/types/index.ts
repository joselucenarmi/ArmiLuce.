export type EbayEnvironment = 'production' | 'sandbox';

export type EbayMarketplaceId = string; // e.g. EBAY_ES

export type EbayClientCredentialsConfig = {
  clientId: string;
  clientSecret: string;
  environment: EbayEnvironment;
};

export type EbayToken = {
  accessToken: string;
  /** Epoch millis */
  expiresAt: number;
};

export type EbayTokenCache = {
  token?: EbayToken;
};

export type EbayBrowseItem = {
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
};

export type NormalizedListing = {
  title: string;
  description: string | null;
  price: number;
  location: string | null;
  type: string;
  category: string;
  source: string;
  external_id: string | null;
  url_original: string | null;
  source_url: string | null;
  image_url: string | null;
  images: string[] | null;
};

export type DedupKey = string; // normalmente external_id

