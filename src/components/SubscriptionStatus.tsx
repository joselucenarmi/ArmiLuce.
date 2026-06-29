import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Crown, AlertCircle, Star } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import {
  getSubscriptionDisplayLabel,
  isSubscriptionActive,
  normalizeInternalPlan,
  type DisplaySubscriptionPlan,
} from '../lib/subscriptionPlan';




type PlanBadge = DisplaySubscriptionPlan;

export function SubscriptionStatus() {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();


  const queryKey = useMemo(() => ['subscription-status', user?.id] as const, [user?.id]);

  const { data } = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async () => {
      const userId = user?.id;
      if (!userId) {
        return { subscription_plan: 'basic' as DisplaySubscriptionPlan, subscription_status: '' };
      }


      const { data } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status')
        .eq('id', userId)
        .single();

      if (!data) {
        // No hay fila de perfil: no podemos inferir un plan real
        return { subscription_plan: 'basic' as DisplaySubscriptionPlan, subscription_status: '' };
      }

      // Si existe un plan en Supabase, no lo “pisamos” con defaults: el label final depende de isSubscriptionActive(subscription_status)


      const normalizedPlan = normalizeInternalPlan(data.subscription_plan);

      return {
        subscription_plan: normalizedPlan,
        subscription_status: data.subscription_status || '',
      };
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Refrescar estado al volver de Stripe checkout/portal
  // (Stripe puede devolver a una ruta con query params; no dependemos de pathname)
  useEffect(() => {
    if (!user) return;

    const search = location.search || '';
    const isStripeReturn =
      search.includes('payment=success') ||
      search.includes('payment=canceled') ||
      search.includes('checkout=success') ||
      search.includes('checkout=canceled') ||
      search.includes('portal=success') ||
      search.includes('portal=canceled');

    if (!isStripeReturn) return;

    queryClient.invalidateQueries({ queryKey });
  }, [user, location.search, queryClient, queryKey]);


  if (!user) return null;

  const subscriptionPlan = normalizeInternalPlan(data?.subscription_plan);
  const subscriptionStatus = data?.subscription_status ?? '';


  const isActive = isSubscriptionActive(subscriptionStatus);


  const planLabel = (() => {
    if (!isActive) return { label: 'BÁSICO', badge: 'basic' as PlanBadge };

    return {
      label: getSubscriptionDisplayLabel(subscriptionPlan),
      badge: subscriptionPlan as PlanBadge,
    };
  })();

  const badgeClasses =
    planLabel.badge === 'premium'
      ? 'bg-yellow-100 text-yellow-800'
      : planLabel.badge === 'pro'
        ? 'bg-blue-100 text-blue-800'
        : planLabel.badge === 'alerts'
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-gray-100 text-gray-600';

  const Icon =
    planLabel.badge === 'premium'
      ? Crown
      : planLabel.badge === 'pro'
        ? Star
        : planLabel.badge === 'alerts'
          ? AlertCircle
          : AlertCircle;

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badgeClasses}`}>
      <Icon className="w-4 h-4 mr-1" />
      {planLabel.label}
    </div>
  );
}
