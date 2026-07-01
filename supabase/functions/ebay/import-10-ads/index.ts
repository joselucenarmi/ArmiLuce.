import { createClient } from 'npm:@supabase/supabase-js@2';

import type {
  EbayClientCredentialsConfig,
  EbayTokenCache,
} from '../../../../src/ebay-arch/index.ts';
import { importEbayListingsFlow } from '../../../../src/ebay-arch/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function getEnvOrThrow(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = getEnvOrThrow('SUPABASE_URL');
    const serviceRoleKey = getEnvOrThrow('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Token cache por petición
    const tokenCache: EbayTokenCache = {};

    // Config OAuth desde env
    const configEbay: EbayClientCredentialsConfig = {
      clientId: getEnvOrThrow('EBAY_CLIENT_ID'),
      clientSecret: getEnvOrThrow('EBAY_CLIENT_SECRET'),
      environment: (Deno.env.get('EBAY_ENVIRONMENT') === 'sandbox' ? 'sandbox' : 'production') as
        | 'production'
        | 'sandbox',
    };

    // marketplaceId real debe configurarse. Usamos variable de entorno.
    const marketplaceId = getEnvOrThrow('EBAY_MARKETPLACE_ID');

    // Límite total de anuncios a recuperar por ejecución, recorriendo las
    // categorías oficiales de vehículos definidas en browseEbayItems.ts
    // (paginado internamente). Configurable vía env sin tocar el código.
    const limit = Number(Deno.env.get('EBAY_IMPORT_LIMIT') ?? '200');

    const result = await importEbayListingsFlow({
      config: configEbay,
      marketplaceId,
      limit,
      tokenCache,
    });

    // Devolver además los últimos anuncios de eBay insertados como evidencia
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('source', 'ebay')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return new Response(
      JSON.stringify({ imported: result.imported, sample: data ?? [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error)?.message ?? String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

