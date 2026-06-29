export interface EbayToken {
  accessToken: string;
  /** Epoch millis */
  expiresAt: number;
}

export interface EbayClientCredentialsConfig {
  clientId: string;
  clientSecret: string;
  environment: 'production' | 'sandbox';
}

/**
 * Contrato + lógica reutilizable (sin secretos).
 * La implementación real vivirá en backend/Edge Functions.
 */
export interface EbayTokenProvider {
  /** Devuelve un token válido (reutiliza hasta expiración). */
  getToken(): Promise<EbayToken>;
}

