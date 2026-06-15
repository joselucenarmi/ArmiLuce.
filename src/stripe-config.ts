export type DurationMonths = 1 | 3 | 6 | 12;
export type PlanType = 'pro' | 'premium' | 'alertas';

export interface StripePriceOption {
  duration: DurationMonths;
  priceId: string;
  price: number;
  discountPercentage?: number;
}

export interface StripeProduct {
  id: string;
  name: string;
  planType: PlanType;
  description: string;
  currency: string;
  currencySymbol: string;
  basePrice: number; // precio de referencia por mes
  prices: StripePriceOption[];
  features: string[];
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_UjxgO9st0x21nh',
    name: 'Plan Pro',
    planType: 'pro',
    description: 'Acceso completo a búsqueda avanzada y alertas',
    currency: 'eur',
    currencySymbol: '€',
    basePrice: 7.49,
    prices: [
      { duration: 1, priceId: 'price_1TkTkrRSWCND59VhxEGx9BHz', price: 7.49 },
      { duration: 3, priceId: 'price_1TkTmmRSWCND59VhOb7A1Su8', price: 20.49 },
      { duration: 6, priceId: 'price_1TkTn1RSWCND59VhQlb2EVhV', price: 35.49 },
      { duration: 12, priceId: 'price_1TkTnJRSWCND59VhDNNNXM4X', price: 62.49 },
    ],
    features: [
      'Búsqueda avanzada de propiedades',
      'Hasta 5 alertas activas',
      'Notificaciones diarias',
      'Historial de búsquedas',
      'Soporte por email',
    ],
  },
  {
    id: 'prod_UjxgsLTFitEWfq',
    name: 'Plan Premium',
    planType: 'premium',
    description: 'Todo de Pro + herramientas avanzadas y soporte prioritario',
    currency: 'eur',
    currencySymbol: '€',
    basePrice: 14.49,
    prices: [
      { duration: 1, priceId: 'price_1TkTlIRSWCND59VhDYs0JQJU', price: 14.49 },
      { duration: 3, priceId: 'price_1TkToeRSWCND59Vh6p8Gjydj', price: 40.49 },
      { duration: 6, priceId: 'price_1TkToqRSWCND59Vh6oZDkbDx', price: 72.49 },
      { duration: 12, priceId: 'price_1TkTp7RSWCND59VhH8uiUD8a', price: 122.49 },
    ],
    features: [
      'Todo del Plan Pro',
      'Alertas ilimitadas',
      'Comparativas de propiedades',
      'Análisis de precios',
      'Exportar resultados',
      'Soporte prioritario',
    ],
  },
  {
    id: 'prod_UjxfnbWqzmQbKp',
    name: 'Plan Alertas',
    planType: 'alertas',
    description: 'Solo alertas y notificaciones, sin búsqueda avanzada',
    currency: 'eur',
    currencySymbol: '€',
    basePrice: 2.49,
    prices: [
      { duration: 1, priceId: 'price_1TkTkWRSWCND59VhE2dyV6Bt', price: 2.49 },
      { duration: 3, priceId: 'price_1TkTleRSWCND59VheCKLnkIx', price: 6.49 },
      { duration: 6, priceId: 'price_1TkTlwRSWCND59VhSLlEYb1H', price: 11.49 },
      { duration: 12, priceId: 'price_1TkTmDRSWCND59Vh4HyyeUfF', price: 21.49 },
    ],
    features: [
      'Hasta 3 alertas activas',
      'Notificaciones por email',
      'Palabras clave personalizadas',
      'Rango de precios personalizado',
    ],
  },
];

export const getProductByPriceId = (priceId: string): { product: StripeProduct; duration: DurationMonths } | undefined => {
  for (const product of STRIPE_PRODUCTS) {
    const priceOption = product.prices.find(p => p.priceId === priceId);
    if (priceOption) {
      return { product, duration: priceOption.duration };
    }
  }
  return undefined;
};

export const getPriceByDuration = (planType: PlanType, duration: DurationMonths): StripePriceOption | undefined => {
  const product = STRIPE_PRODUCTS.find(p => p.planType === planType);
  return product?.prices.find(p => p.duration === duration);
};