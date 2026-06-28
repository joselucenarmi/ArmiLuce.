import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Crown, AlertCircle, Star } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

type SubscriptionPlan = 'basic' | 'pro' | 'professional';
type PlanBadge = 'basic' | 'pro' | 'premium';

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
        return { subscription_plan: 'basic' as SubscriptionPlan, subscription_status: '' };
      }

      const { data } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status')
        .eq('id', userId)
        .single();

      if (!data) return { subscription_plan: 'basic' as SubscriptionPlan, subscription_status: '' };

      const rawPlan = (data.subscription_plan || 'basic') as string;
      const normalizedPlan: SubscriptionPlan =
        rawPlan === 'pro' || rawPlan === 'professional' || rawPlan === 'basic'
          ? (rawPlan as SubscriptionPlan)
          : 'basic';

      return {
        subscription_plan: normalizedPlan,
        subscription_status: data.subscription_status || '',
      };
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Invalidate/refetch cuando el usuario vuelve desde /settings tras un checkout/portal
  // settings?payment=success|canceled (ver PricingCard -> successUrl/cancelUrl)
  useEffect(() => {
    if (!user) return;

    const search = location.search || '';
    const cameFromSettingsFlow =
      location.pathname === '/settings' &&
      (search.includes('payment=success') || search.includes('payment=canceled'));

    if (!cameFromSettingsFlow) return;

    queryClient.invalidateQueries({ queryKey });
  }, [user, location.pathname, location.search, queryClient, queryKey]);

  if (!user) return null;

  const subscriptionPlan = data?.subscription_plan ?? 'basic';
  const subscriptionStatus = data?.subscription_status ?? '';

  const isActive = subscriptionStatus === 'active';

  const planLabel = (() => {
    if (!isActive) return { label: 'Básico', badge: 'basic' as PlanBadge };

    switch (subscriptionPlan) {
      case 'professional':
        return { label: 'Premium', badge: 'premium' as PlanBadge };
      case 'pro':
        return { label: 'Pro', badge: 'pro' as PlanBadge };
      case 'basic':
      default:
        return { label: 'Básico', badge: 'basic' as PlanBadge };
    }
  })();

  const badgeClasses =
    planLabel.badge === 'premium'
      ? 'bg-yellow-100 text-yellow-800'
      : planLabel.badge === 'pro'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-gray-100 text-gray-600';

  const Icon =
    planLabel.badge === 'premium' ? Crown : planLabel.badge === 'pro' ? Star : AlertCircle;

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badgeClasses}`}>
      <Icon className="w-4 h-4 mr-1" />
      {planLabel.label}
    </div>
  );
}
