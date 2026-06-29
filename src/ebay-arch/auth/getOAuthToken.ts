import type { EbayClientCredentialsConfig, EbayToken, EbayTokenCache, EbayEnvironment } from '../types';
import { getEbayOAuthTokenEndpoint } from './oauthEndpoint';

export async function getOAuthToken(params: {
  config: EbayClientCredentialsConfig;
  cache?: EbayTokenCache;
}): Promise<EbayToken> {
  const { config, cache } = params;

  const cached = cache?.token;
  if (cached && Date.now() < cached.expiresAt) {
    return cached;
  }

  const tokenEndpoint = getEbayOAuthTokenEndpoint(config.environment as EbayEnvironment);

  const body = new URLSearchParams();
  body.set('grant_type', 'client_credentials');

  const res = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // basic auth
      Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`eBay OAuth token error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };

  const expiresAt = Date.now() + data.expires_in * 1000 - 30_000;
  const token: EbayToken = { accessToken: data.access_token, expiresAt };

  if (cache) {
    cache.token = token;
  }

  return token;
}

