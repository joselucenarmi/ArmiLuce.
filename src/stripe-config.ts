export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  currencySymbol: string;
  mode: 'payment' | 'subscription';
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    priceId: 'price_1ThxAcIXfL8TnkwC2idYT1DL',
    name: 'Plan 1 mes',
    description: 'Suscripción mensual para acceso completo a todas las funcionalidades premium',
    price: 2.49,
    currency: 'eur',
    currencySymbol: '€',
    mode: 'subscription'
  },
  {
    priceId: 'price_1Ti3t4IXfL8TnkwCiz2juMzI',
    name: 'Plan 3 meses',
    description: 'Suscripción por 3 meses para acceso completo a todas las funcionalidades premium',
    price: 6.49,
    currency: 'eur',
    currencySymbol: '€',
    mode: 'subscription'
  },
  {
    priceId: 'price_1Ti3uWIXfL8TnkwCaAAe36qE',
    name: 'Plan 6 meses',
    description: 'Suscripción por 6 meses para acceso completo a todas las funcionalidades premium',
    price: 11.49,
    currency: 'eur',
    currencySymbol: '€',
    mode: 'subscription'
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
};