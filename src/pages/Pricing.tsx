import React from 'react';
import { STRIPE_PRODUCTS } from '../stripe-config';
import { PricingCard } from '../components/PricingCard';

export function Pricing() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Planes y Precios
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Elige el plan perfecto para encontrar tu propiedad ideal. 
            Cancela en cualquier momento.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="grid grid-cols-1 gap-8 max-w-md">
            {STRIPE_PRODUCTS.map((product, index) => (
              <PricingCard
                key={product.priceId}
                product={product}
                isPopular={index === 0}
              />
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Tienes preguntas?
            </h3>
            <p className="text-gray-600 mb-6">
              Nuestro equipo está aquí para ayudarte a encontrar el plan perfecto.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div>
                <strong className="text-gray-900">Garantía de satisfacción</strong>
                <p>30 días de garantía de devolución</p>
              </div>
              <div>
                <strong className="text-gray-900">Soporte 24/7</strong>
                <p>Ayuda cuando la necesites</p>
              </div>
              <div>
                <strong className="text-gray-900">Fácil cancelación</strong>
                <p>Cancela en cualquier momento</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}