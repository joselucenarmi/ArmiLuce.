import type { NormalizedListing } from '../types/index.ts';
import { createSupabaseClient } from '../utils/supabaseServer.ts';

export async function insertListingsToDb(params: {
  listings: NormalizedListing[];
}): Promise<{ inserted: number; attempted: number }> {
  const { listings } = params;

  if (listings.length === 0) return { inserted: 0, attempted: 0 };

  const supabase = createSupabaseClient();
  const attempted = listings.length;

  // idx_listings_source_external es un índice único PARCIAL (WHERE source/external_id
  // IS NOT NULL), lo que Postgres no puede usar como destino de ON CONFLICT vía upsert
  // genérico de PostgREST. Por eso deduplicamos manualmente contra lo ya existente en BD
  // (por source + external_id) y hacemos un INSERT normal solo con los anuncios nuevos.
  const source = listings[0].source;
  const externalIds = listings
    .map((l) => l.external_id)
    .filter((id): id is string => Boolean(id));

  const { data: existing, error: existingError } = await supabase
    .from('listings')
    .select('external_id')
    .eq('source', source)
    .in('external_id', externalIds);

  if (existingError) {
    throw new Error(`DB lookup error: ${existingError.message}`);
  }

  const existingIds = new Set((existing ?? []).map((row: { external_id: string }) => row.external_id));
  const newListings = listings.filter((l) => !l.external_id || !existingIds.has(l.external_id));

  if (newListings.length === 0) {
    return { inserted: 0, attempted };
  }

  const { error } = await supabase.from('listings').insert(
    newListings.map((l) => ({
      title: l.title,
      description: l.description,
      price: l.price,
      location: l.location,
      type: l.type,
      category: l.category,
      source: l.source,
      external_id: l.external_id,
      url_original: l.url_original,
      source_url: l.source_url,
      image_url: l.image_url,
      images: l.images,
    })),
  );

  if (error) {
    throw new Error(`DB insert error: ${error.message}`);
  }

  return { inserted: newListings.length, attempted };
}

