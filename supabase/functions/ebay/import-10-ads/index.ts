import { createClient } from 'npm:@supabase/supabase-js@2';

import type {
  EbayClientCredentialsConfig,
  EbayTokenCache,
} from '../../../../src/ebay-arch/index.ts';
import { importEbayListingsFlow, getVehicleCategoriesForMarketplace } from '../../../../src/ebay-arch/index.ts';

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

// Marketplaces compatibles a recorrer en cada ejecución. Configurable vía
// env (lista separada por comas) sin tocar código; si no se define, se usan
// los 5 marketplaces solicitados. Si solo se quisiera el comportamiento
// previo (un único marketplace), basta con definir EBAY_MARKETPLACES con un
// solo valor o dejar sólo EBAY_MARKETPLACE_ID.
const DEFAULT_MARKETPLACES = ['EBAY_ES', 'EBAY_DE', 'EBAY_FR', 'EBAY_IT', 'EBAY_GB'];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startedAt = Date.now();

  try {
    const supabaseUrl = getEnvOrThrow('SUPABASE_URL');
    const serviceRoleKey = getEnvOrThrow('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Config OAuth desde env. El token client_credentials de eBay no está
    // ligado a un marketplace concreto (el marketplace se indica por
    // request vía header X-EBAY-C-MARKETPLACE-ID), así que se puede
    // reutilizar el mismo cache de token para todos los marketplaces.
    const configEbay: EbayClientCredentialsConfig = {
      clientId: getEnvOrThrow('EBAY_CLIENT_ID'),
      clientSecret: getEnvOrThrow('EBAY_CLIENT_SECRET'),
      environment: (Deno.env.get('EBAY_ENVIRONMENT') === 'sandbox' ? 'sandbox' : 'production') as
        | 'production'
        | 'sandbox',
    };
    const tokenCache: EbayTokenCache = {};

    const marketplacesEnv = Deno.env.get('EBAY_MARKETPLACES');
    const marketplaces = marketplacesEnv
      ? marketplacesEnv.split(',').map((m) => m.trim()).filter(Boolean)
      : DEFAULT_MARKETPLACES;

    // Límite TOTAL de anuncios a recuperar en la ejecución completa
    // (sumando todos los marketplaces), configurable vía env sin tocar
    // código. Se reparte a partes iguales entre marketplaces y se recorta
    // si algún marketplace no agota su cupo, para no superar nunca el total.
    const totalLimit = Number(Deno.env.get('EBAY_IMPORT_LIMIT') ?? '200');
    const perMarketplaceLimit = Math.max(1, Math.ceil(totalLimit / marketplaces.length));

    const perMarketplaceReport: Array<{
      marketplaceId: string;
      categories: string[];
      fetched: number;
      inserted: number;
      duplicates: number;
      error?: string;
    }> = [];

    let totalFetched = 0;
    let totalInserted = 0;
    let totalDuplicates = 0;

    for (const marketplaceId of marketplaces) {
      // Respeta el tope total de anuncios de la ejecución: si ya se alcanzó,
      // no se consulta el resto de marketplaces pendientes.
      if (totalFetched >= totalLimit) break;

      const remainingBudget = totalLimit - totalFetched;
      const limitForThisMarketplace = Math.min(perMarketplaceLimit, remainingBudget);

      const categories = getVehicleCategoriesForMarketplace(marketplaceId).map(
        (c) => `${c.label} (${c.categoryId})`,
      );

      try {
        const result = await importEbayListingsFlow({
          config: configEbay,
          marketplaceId,
          limit: limitForThisMarketplace,
          tokenCache,
        });

        totalFetched += result.fetched;
        totalInserted += result.imported;
        const duplicates = result.attempted - result.imported;
        totalDuplicates += duplicates;

        perMarketplaceReport.push({
          marketplaceId,
          categories,
          fetched: result.fetched,
          inserted: result.imported,
          duplicates,
        });
      } catch (err) {
        // Si un marketplace falla (red, API, etc.), se registra el error y
        // se continúa con el resto sin abortar la ejecución completa.
        console.error(`eBay import error (marketplace ${marketplaceId}):`, err);
        perMarketplaceReport.push({
          marketplaceId,
          categories,
          fetched: 0,
          inserted: 0,
          duplicates: 0,
          error: (err as Error)?.message ?? String(err),
        });
      }
    }

    // Devolver además los últimos anuncios de eBay insertados como evidencia
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('source', 'ebay')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const elapsedMs = Date.now() - startedAt;

    return new Response(
      JSON.stringify({
        imported: totalInserted,
        report: {
          marketplaces: perMarketplaceReport,
          totalFetched,
          totalInserted,
          totalDuplicates,
          elapsedMs,
        },
        sample: data ?? [],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error)?.message ?? String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
