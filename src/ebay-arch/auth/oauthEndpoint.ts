import type { EbayEnvironment } from '../types';

export function getEbayOAuthTokenEndpoint(environment: EbayEnvironment): string {
  return environment === 'production'
    ? 'https://api.ebay.com/identity/v1/oauth2/token'
    : 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';
}

