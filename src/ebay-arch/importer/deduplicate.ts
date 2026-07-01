import type { NormalizedListing } from '../types/index.ts';

export function deduplicateListings(listings: NormalizedListing[]): NormalizedListing[] {
  const seen = new Set<string>();
  const result: NormalizedListing[] = [];

  for (const l of listings) {
    const key = l.external_id ?? `${l.source}|${l.url_original ?? ''}|${l.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(l);
  }

  return result;
}

