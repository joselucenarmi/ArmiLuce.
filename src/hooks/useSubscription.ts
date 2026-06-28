import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useSubscription() {
  const { user } = useAuth();

  const createCheckout = async ({ priceId, plan }: { priceId: string; plan: string }) => {
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: { priceId, plan },
    });

    if (error) throw error;

    if (data?.url) {
      window.location.href = data.url;
    }

    return data;
  };

  const openPortal = async () => {
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase.functions.invoke('stripe-portal', {});

    if (error) throw error;

    if (data?.url) {
      window.location.href = data.url;
    }

    return data;
  };

  const checkoutMutation = useMutation({
    mutationFn: createCheckout,
  });

  const portalMutation = useMutation({
    mutationFn: openPortal,
  });

  return {
    createCheckout: checkoutMutation.mutate,
    openPortal: portalMutation.mutate,
    loading: checkoutMutation.isPending || portalMutation.isPending,
    error: checkoutMutation.error || portalMutation.error,
  };
}
