import type { ListingCategory } from './catalog';

export type SearchSortBy = 'created_at' | 'price' | 'price-desc';

export type SearchFiltersState = {
  query: string;
  categories: ListingCategory[];
  types: string[];
  priceMin: string;
  priceMax: string;
  location: string;
  source: string;
  sortBy: SearchSortBy;
};

export type AlertsFiltersState = {
  category: ListingCategory | '';
  type: string;
  max_price: string;
  location: string;
  keywords: string;
};

export const DEFAULT_SEARCH_FILTERS: SearchFiltersState = {
  query: '',
  categories: [],
  types: [],
  priceMin: '',
  priceMax: '',
  location: '',
  source: '',
  sortBy: 'created_at',
};

