import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export function Success() {
  const { user } = useAuth();
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('subscription_plan')
          .eq('id', user.id)
          .single();
        
        if (data?.subscription_plan) {
          setSubscriptionPlan(data.subscription_plan);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Pago Exitoso!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Tu suscripción ha sido activada correctamente. Ya puedes disfrutar de todas las funcionalidades premium.
          </p>

          {subscriptionPlan && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Plan Activo
              </h3>
              <p className="text-blue-600 font-medium capitalize">
                {subscriptionPlan}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Link
              to="/dashboard"
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            >
              Ir al Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            
            <Link
              to="/"
              className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
            >
              <Home className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Recibirás un email de confirmación con los detalles de tu suscripción.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}