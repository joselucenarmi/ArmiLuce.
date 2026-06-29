export type DisplaySubscriptionPlan = 'basic' | 'alerts' | 'pro' | 'premium';

export function normalizeInternalPlan(plan?: string | null): DisplaySubscriptionPlan {
  const p = (plan || '').toLowerCase().trim();

  if (!p) return 'basic';

  if (p === 'basic' || p === 'free' || p === 'basico' || p === 'básico') return 'basic';
  if (p === 'alertas' || p === 'alerts') return 'alerts';
  if (p === 'pro' || p === 'professional' || p === 'professional_pro') return 'pro';
  if (p === 'premium') return 'premium';

  return 'basic';
}

export function getSubscriptionDisplayLabel(plan: DisplaySubscriptionPlan): 'BÁSICO' | 'ALERTAS' | 'PRO' | 'PREMIUM' {
  switch (plan) {
    case 'basic':
      return 'BÁSICO';
    case 'alerts':
      return 'ALERTAS';
    case 'pro':
      return 'PRO';
    case 'premium':
      return 'PREMIUM';
  }
}

// Single source of truth for whether the subscription is considered "active".
// Stripe can return statuses like: active, trialing, past_due, unpaid, canceled, etc.
export function isSubscriptionActive(subscriptionStatus?: string | null): boolean {
  const s = (subscriptionStatus || '').toLowerCase().trim();
  if (!s) return false;

  // Active cases we consider valid for permissions.
  return s === 'active' || s === 'trialing';
}


