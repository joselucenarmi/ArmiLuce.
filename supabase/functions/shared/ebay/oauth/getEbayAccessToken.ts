import type { EbayToken } from '../../../../src/providers/ebay/auth/eBayClientCredentialsAuth';


export interface GetEbayAccessTokenInput {
  clientId: string;
  clientSecret: string;
  environment: 'production' | 'sandbox';
  /** Reutiliza token si aún es válido */
  tokenCache?: {
    token?: EbayToken;
  };
}

export function getEbayOAuthTokenEndpoint(environment: 'production' | 'sandbox'): string {
  // eBay requiere distintos hosts por entorno.
  // Ajustaremos cuando implementemos la integración real.
  return environment === 'production'
    ? 'https://api.ebay.com/identity/v1/oauth2/token'
    : 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';
}

export async function getEbayAccessToken(input: GetEbayAccessTokenInput): Promise<EbayToken> {
  const { clientId, clientSecret, environment, tokenCache } = input;

  const cached = tokenCache?.token;
  if (cached && Date.now() < cached.expiresAt) {
    return cached;
  }

  const tokenEndpoint = getEbayOAuthTokenEndpoint(environment);

  const body = new URLSearchParams();
  body.set('grant_type', 'client_credentials');
  // client_id/client_secret en basic auth recomendado

  const res = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`eBay OAuth token error: ${res.status} ${text}`);
  }

  const data = await res.json() as {
    access_token: string;
    expires_in: number; // seconds
  };

  const accessToken = data.access_token;
  const expiresAt = Date.now() + (data.expires_in * 1000) - 30_000; // buffer 30s

  const token: EbayToken = { accessToken, expiresAt };

  if (tokenCache) {
    tokenCache.token = token;
  }

  return token;
}

