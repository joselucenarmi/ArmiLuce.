import type { EbayToken } from '../../../src/providers/ebay/auth/eBayClientCredentialsAuth';
import { getEbayAccessToken } from './oauth/getEbayAccessToken';

export type EbayBrowseRequestParams = Record<string, never>;


export interface EbayApiClientConfig {
  clientId: string;
  clientSecret: string;
  environment: 'production' | 'sandbox';
}

/**
 * Cliente API para eBay (backend).
 * No ejecuta Browse en esta tarea; solo deja la arquitectura preparada.
 */
export class EbayApiClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly environment: 'production' | 'sandbox';

  private tokenCache: { token?: EbayToken } = {};

  constructor(config: EbayApiClientConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.environment = config.environment;
  }

  private async getValidToken(): Promise<EbayToken> {
    return getEbayAccessToken({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      environment: this.environment,
      tokenCache: this.tokenCache,
    });
  }

  /**
   * Placeholder: se añadirá Browse API (sin importar todavía anuncios).
   */
  async browse(params: EbayBrowseRequestParams): Promise<never> {
    void params;
    throw new Error('Browse not implemented yet (architecture prepared only).');
  }
}


