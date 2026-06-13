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
    priceId: 'price_1Thw9GRSWCND59VhMYrl5Hmb',
    name: 'Producto de prueba',
    description: 'Suscripción mensual para acceso completo a todas las funcionalidades premium',
    price: 19.99,
    currency: 'eur',
    currencySymbol: '€',
    mode: 'subscription'
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
};