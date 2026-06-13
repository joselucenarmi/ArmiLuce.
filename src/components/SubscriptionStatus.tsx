import React, { useEffect, useState } from 'react';
import { Crown, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export function SubscriptionStatus() {
  const { user } = useAuth();
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('subscription_plan, subscription_status')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setSubscriptionPlan(data.subscription_plan || 'basic');
          setSubscriptionStatus(data.subscription_status || '');
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  if (!user) return null;

  const isPremium = subscriptionPlan !== 'basic' && subscriptionStatus === 'active';

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
      isPremium 
        ? 'bg-yellow-100 text-yellow-800' 
        : 'bg-gray-100 text-gray-600'
    }`}>
      {isPremium ? (
        <>
          <Crown className="w-4 h-4 mr-1" />
          Premium
        </>
      ) : (
        <>
          <AlertCircle className="w-4 h-4 mr-1" />
          Básico
        </>
      )}
    </div>
  );
}