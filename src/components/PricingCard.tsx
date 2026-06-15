import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { StripeProduct, DurationMonths, getPriceByDuration } from '../stripe-config';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

interface PricingCardProps {
  product: StripeProduct;
  isPopular?: boolean;
}

export function PricingCard({ product, isPopular = false }: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<DurationMonths>(1);
  const { user, session } = useAuth();

  const selectedPrice = getPriceByDuration(product.planType, selectedDuration);
  const durationLabel = `${selectedDuration} ${selectedDuration === 1 ? 'mes' : 'meses'}`;

  const handleCheckout = async () => {
    if (!user) {
      window.location.href = '/auth';
      return;
    }

    if (!session?.access_token) {
      console.error('No session available for checkout');
      return;
    }

    if (!selectedPrice) {
      console.error('No price selected');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: selectedPrice.priceId,
          plan: product.planType,
          duration: selectedDuration,
          successUrl: `${window.location.origin}/settings?payment=success`,
          cancelUrl: `${window.location.origin}/pricing?payment=canceled`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Error al crear la sesión de pago');
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió URL de checkout');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert(`Error al procesar el pago: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl',
        isPopular ? 'border-blue-500 scale-105' : 'border-gray-200'
      )}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Recomendado
          </span>
        </div>
      )}

      <div className="p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-gray-600 mb-6">{product.description}</p>

        {/* Duration Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">Duración</label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 3, 6, 12].map((months) => (
              <button
                key={months}
                onClick={() => setSelectedDuration(months as DurationMonths)}
                className={cn(
                  'py-2 px-2 rounded-lg text-sm font-medium transition-all',
                  selectedDuration === months
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {months}m
              </button>
            ))}
          </div>
        </div>

        {/* Price Display */}
        {selectedPrice && (
          <div className="mb-8">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900">
                {product.currencySymbol}{selectedPrice.price.toFixed(2)}
              </span>
              <span className="text-gray-600">/{durationLabel}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {(selectedPrice.price / selectedDuration).toFixed(2)}{product.currencySymbol}/mes
            </p>
          </div>
        )}

        {/* Features */}
        <ul className="space-y-4 mb-8">
          {product.features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <button
          onClick={handleCheckout}
          disabled={isLoading || !selectedPrice}
          className={cn(
            'w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center',
            isPopular
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-900 hover:bg-gray-800 text-white'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            `Contratar ${durationLabel}`
          )}
        </button>
      </div>
    </div>
  );
}
