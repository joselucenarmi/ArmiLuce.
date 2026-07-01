import { createClient } from '@supabase/supabase-js';

import type {
  EbayClientCredentialsConfig,
  EbayTokenCache,
} from '../../../src/ebay-arch';
import { importEbayListingsFlow } from '../../../src/ebay-arch';



export const config = {
  maxDuration: 300,
};

function getEnvOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export default async function handler(req: any, res: any) {
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
      environment: (process.env.EBAY_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production') as
        | 'production'
        | 'sandbox',
    };

    // marketplaceId real debe configurarse. Usamos variable de entorno.
    const marketplaceId = getEnvOrThrow('EBAY_MARKETPLACE_ID');

    const result = await importEbayListingsFlow({
      config: configEbay,
      marketplaceId,
      limit: 10,
      tokenCache,
    });

    // Devolver además 10 recién insertados (o los primeros disponibles si no hay orden garantizado)
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .limit(10);

    if (error) throw error;

    res.status(200).json({
      imported: result.imported,
      sample: data ?? [],
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? String(err) });
  }
}

