import type { NormalizedListing } from '../types';
import { createSupabaseClient } from '../utils/supabaseServer';

export async function insertListingsToDb(params: {
  listings: NormalizedListing[];
}): Promise<{ inserted: number; attempted: number }> {
  const { listings } = params;

  if (listings.length === 0) return { inserted: 0, attempted: 0 };

  const supabase = createSupabaseClient();

  // Inserta idempotente con external_id + source (ajuste al esquema real cuando se integre)
  // Usamos upsert si existe constraint; si no, fallará y tendremos que ajustar.
  const attempted = listings.length;

  const { error } = await supabase
    .from('listings')
    .upsert(
      listings.map((l) => ({
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
      {
        onConflict: 'idx_listings_source_external',
      },
    );

  if (error) {
    throw new Error(`DB insert/upsert error: ${error.message}`);
  }

  return { inserted: attempted, attempted };
}

