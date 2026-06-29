import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Sin importar anuncios: solo verifica configuración.
  try {
    requiredEnv('EBAY_CLIENT_ID');
    requiredEnv('EBAY_CLIENT_SECRET');
    const env = requiredEnv('EBAY_ENVIRONMENT');
    const marketplaceId = requiredEnv('EBAY_MARKETPLACE_ID');

    return new Response(
      JSON.stringify({
        ok: true,
        ebay: {
          environment: env,
          marketplaceId,
        },
        note: 'Architecture test only. No Browse/import executed.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: (error as Error).message,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

