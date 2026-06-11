import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { Check, Zap, Crown, Rocket, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    description: 'Para exploradores ocasionales',
    icon: Zap,
    color: 'slate',
    features: [
      { text: 'Ver todas las propiedades', included: true },
      { text: 'Búsqueda avanzada', included: true },
      { text: 'Hasta 3 alertas activas', included: true },
      { text: 'Favoritos ilimitados', included: true },
      { text: 'Valoración básica', included: true },
      { text: 'Alertas ilimitadas', included: false },
      { text: 'Valoraciones avanzadas', included: false },
      { text: 'Exportar datos', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    description: 'Para inversores activos',
    icon: Crown,
    color: 'emerald',
    popular: true,
    features: [
      { text: 'Todo en Basic', included: true },
      { text: 'Alertas ilimitadas', included: true },
      { text: 'Valoraciones avanzadas', included: true },
      { text: 'Análisis de comparables', included: true },
      { text: 'Notificaciones email', included: true },
      { text: 'Exportar datos', included: false },
      { text: 'Análisis de mercado', included: false },
    ],
  },
  {
    id: 'professional',
    name: 'Profesional',
    price: 79,
    description: 'Para profesionales del sector',
    icon: Rocket,
    color: 'blue',
    features: [
      { text: 'Todo en Pro', included: true },
      { text: 'Exportar datos (CSV, Excel)', included: true },
      { text: 'Análisis de mercado', included: true },
      { text: 'API access', included: true },
      { text: 'Soporte prioritario', included: true },
      { text: 'Multi-usuario', included: true },
    ],
  },
];

export function Pricing() {
  const { profile } = useAuth();
  const { createCheckout, loading } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const currentPlan = profile?.subscription_plan || 'basic';

  const handleSelectPlan = async (planId: string, price: number) => {
    if (planId === 'basic' || planId === currentPlan) return;

    // For demo purposes, we'll use placeholder price IDs
    // In production, these would be your actual Stripe price IDs
    const priceId = billingCycle === 'annual'
      ? `price_${planId}_annual`
      : `price_${planId}_monthly`;

    createCheckout({ priceId, plan: planId });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">Planes que se adaptan a ti</h1>
        <p className="text-slate-400 text-lg">Desde inversores ocasionales hasta profesionales del sector</p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={cn('text-sm', billingCycle === 'monthly' ? 'text-white' : 'text-slate-400')}>Mensual</span>
        <button
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
          className={cn('relative w-14 h-8 rounded-full transition-colors', billingCycle === 'annual' ? 'bg-emerald-500' : 'bg-slate-600')}
        >
          <div className={cn('absolute top-1 w-6 h-6 bg-white rounded-full transition-transform', billingCycle === 'annual' ? 'left-7' : 'left-1')} />
        </button>
        <span className={cn('text-sm', billingCycle === 'annual' ? 'text-white' : 'text-slate-400')}>Anual</span>
        <span className="ml-2 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-sm rounded-full">Ahorra 20%</span>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          const annualPrice = plan.price * 12 * 0.8;

          return (
            <div
              key={plan.id}
              className={cn(
                'relative bg-slate-800/50 backdrop-blur-xl border rounded-2xl overflow-hidden',
                plan.popular ? 'border-emerald-500/50 ring-2 ring-emerald-500/25' : 'border-slate-700/50',
                isCurrent && 'ring-2 ring-blue-500/50'
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 px-4 py-1 bg-emerald-500 text-white text-xs font-medium rounded-bl-xl">Popular</div>
              )}
              {isCurrent && (
                <div className="absolute top-0 right-0 px-4 py-1 bg-blue-500 text-white text-xs font-medium rounded-bl-xl">Plan actual</div>
              )}

              <div className="p-6 lg:p-8">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                  plan.color === 'emerald' ? 'bg-emerald-500/10' : plan.color === 'blue' ? 'bg-blue-500/10' : 'bg-slate-700/50'
                )}>
                  <Icon className={cn(plan.color === 'emerald' ? 'text-emerald-400' : plan.color === 'blue' ? 'text-blue-400' : 'text-slate-400')} size={24} />
                </div>

                <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                <p className="text-slate-400 text-sm mt-1">{plan.description}</p>

                <div className="mt-6">
                  <div className="flex items-baseline gap-1">
                    {plan.price === 0 ? (
                      <span className="text-4xl font-bold text-white">Gratis</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-white">{billingCycle === 'annual' ? Math.round(annualPrice) : plan.price}€</span>
                        <span className="text-slate-400">/{billingCycle === 'annual' ? 'año' : 'mes'}</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleSelectPlan(plan.id, plan.price)}
                  disabled={isCurrent || loading}
                  className={cn(
                    'w-full mt-6 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                    isCurrent
                      ? 'bg-blue-500/10 border border-blue-500/50 text-blue-400 cursor-not-allowed'
                      : plan.id === 'basic'
                      ? 'bg-slate-700/50 border border-slate-600/50 text-white hover:bg-slate-700'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25',
                    loading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <CreditCard size={18} />
                  {isCurrent ? 'Plan actual' : plan.id === 'basic' ? 'Volver a Basic' : 'Suscribirse'}
                </button>

                <div className="mt-8 space-y-4">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="text-emerald-400 flex-shrink-0 mt-0.5" size={18} />
                      <span className="text-sm text-slate-300">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="mt-12 bg-slate-800/30 rounded-2xl p-6 lg:p-8">
        <h2 className="text-xl font-semibold text-white mb-6">Preguntas frecuentes</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-white font-medium mb-2">¿Puedo cambiar de plan en cualquier momento?</h3>
            <p className="text-slate-400 text-sm">Sí, puedes actualizar o cancelar tu plan cuando quieras.</p>
          </div>
          <div>
            <h3 className="text-white font-medium mb-2">¿Hay permanencia mínima?</h3>
            <p className="text-slate-400 text-sm">No, puedes cancelar tu suscripción sin penalización.</p>
          </div>
          <div>
            <h3 className="text-white font-medium mb-2">¿Métodos de pago aceptados?</h3>
            <p className="text-slate-400 text-sm">Aceptamos tarjetas de crédito/débito (Visa, Mastercard, American Express).</p>
          </div>
          <div>
            <h3 className="text-white font-medium mb-2">¿Qué incluye el análisis de mercado?</h3>
            <p className="text-slate-400 text-sm">Tendrás acceso a tendencias de precios y proyecciones por zona.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
