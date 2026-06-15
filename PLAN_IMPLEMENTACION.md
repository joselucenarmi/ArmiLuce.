# 🛠️ PLAN DETALLADO DE CORRECCIONES Y MEJORAS

## 1️⃣ ERRORES INMEDIATOS A CORREGIR (Hoy)

### Error 1: Corregir Navbar.tsx
**Problema:** Sintaxis inválida en el archivo
**Acción:**
```bash
# Revisar y reparar el archivo
cat src/components/Navbar.tsx | head -20
# Probablemente hay un error de JSON o caracteres especiales
```

### Error 2: Vulnerabilidades npm
```bash
npm audit fix
npm audit fix --force  # Si lo anterior no resuelve todo
```

### Error 3: Corregir PricingCard.tsx
**Cambio necesario:**
```typescript
// ❌ ACTUAL (INCORRECTO):
const handleCheckout = async () => {
  // ...
  const response = await fetch(..., {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,  // ❌ session no existe
```

// ✅ DEBE SER:
import { useAuth } from '../hooks/useAuth';

export function PricingCard({ product, isPopular = false }: PricingCardProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      window.location.href = '/auth';
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No session found');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId: product.priceId,
            plan: product.name,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Checkout failed');
      }

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Error al procesar el pago: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };
```

### Error 4: Crear archivo .env.example
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Stripe Configuration (Get from https://dashboard.stripe.com)
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxx

# Google Maps Configuration (Get from Google Cloud Console)
VITE_GOOGLE_MAPS_API_KEY=AIzaSyxxxxxx

# Marketplace APIs Configuration
IDEALISTA_API_KEY=your_key_here
IDEALISTA_API_URL=https://api.idealista.com/

FOTOCASA_API_KEY=your_key_here
FOTOCASA_API_URL=https://api.fotocasa.es/

OLX_API_KEY=your_key_here
OLX_API_URL=https://api.olx.com/

MILANUNCIOS_API_KEY=your_key_here
MILANUNCIOS_API_URL=https://api.milanuncios.com/

# Database Configuration
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Environment
MODE=development
VITE_API_URL=http://localhost:5173
```

---

## 2️⃣ IMPLEMENTACIÓN: APIs DE MERCADOS (CRÍTICA)

### Estructura de datos necesaria

#### A. Crear tabla de listados de marketplace
```sql
-- Nueva tabla para datos sincronizados
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  -- Información del listado
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  location TEXT,
  type TEXT NOT NULL, -- 'terreno', 'vivienda', 'local', etc.
  category TEXT NOT NULL, -- 'property', 'vehicle', 'land'
  
  -- Información de la fuente
  source TEXT NOT NULL, -- 'idealista', 'fotocasa', 'olx', 'milanuncios'
  external_id TEXT NOT NULL,
  source_url TEXT NOT NULL,
  
  -- Imágenes
  images TEXT[],
  
  -- Metadata
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'active', -- 'active', 'sold', 'removed'
  raw_data JSONB, -- Guardar respuesta completa de API
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint
  UNIQUE(source, external_id)
);

-- Índices para performance
CREATE INDEX idx_marketplace_source ON public.marketplace_listings(source);
CREATE INDEX idx_marketplace_category ON public.marketplace_listings(category);
CREATE INDEX idx_marketplace_price ON public.marketplace_listings(price);
CREATE INDEX idx_marketplace_location ON public.marketplace_listings(location);
CREATE INDEX idx_marketplace_sync_status ON public.marketplace_listings(sync_status);
```

#### B. Crear tabla de API logs
```sql
CREATE TABLE IF NOT EXISTS public.api_sync_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source TEXT NOT NULL, -- 'idealista', 'fotocasa', etc.
  sync_type TEXT NOT NULL, -- 'full', 'incremental'
  status TEXT NOT NULL, -- 'pending', 'running', 'success', 'failed'
  items_processed INTEGER,
  items_added INTEGER,
  items_updated INTEGER,
  items_removed INTEGER,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  UNIQUE(source, started_at)
);
```

### Crear funciones serverless para sincronización

#### Función 1: Sync Idealista (supabase/functions/sync-idealista/index.ts)
```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface IdeallistaListing {
  propertyCode: string;
  title: string;
  description: string;
  price: number;
  location: {
    address: string;
  };
  pictures: Array<{ url: string }>;
  url: string;
  propertyType: string;
}

Deno.serve(async (req: Request) => {
  try {
    const API_KEY = Deno.env.get('IDEALISTA_API_KEY');
    const API_URL = Deno.env.get('IDEALISTA_API_URL');

    if (!API_KEY || !API_URL) {
      throw new Error('Missing Idealista credentials');
    }

    // Log inicial
    const logId = await createSyncLog('idealista', 'full', 'running');

    // Llamar a API de Idealista (ejemplo)
    const response = await fetch(`${API_URL}properties`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Idealista API error: ${response.status}`);
    }

    const data = await response.json();
    const listings: IdeallistaListing[] = data.items || [];

    let added = 0;
    let updated = 0;

    // Procesar cada listado
    for (const listing of listings) {
      const { data: existing } = await supabase
        .from('marketplace_listings')
        .select('id')
        .eq('source', 'idealista')
        .eq('external_id', listing.propertyCode)
        .maybeSingle();

      const listingData = {
        title: listing.title,
        description: listing.description,
        price: listing.price,
        location: listing.location.address,
        type: mapIdeallistaType(listing.propertyType),
        category: 'property',
        source: 'idealista',
        external_id: listing.propertyCode,
        source_url: listing.url,
        images: listing.pictures?.map(p => p.url) || [],
        sync_status: 'active',
        raw_data: listing,
        last_seen: new Date().toISOString(),
      };

      if (existing) {
        await supabase
          .from('marketplace_listings')
          .update(listingData)
          .eq('id', existing.id);
        updated++;
      } else {
        await supabase
          .from('marketplace_listings')
          .insert([listingData]);
        added++;
      }
    }

    // Actualizar log
    await updateSyncLog(logId, 'success', listings.length, added, updated, 0);

    return new Response(
      JSON.stringify({ success: true, added, updated, total: listings.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

function mapIdeallistaType(propertyType: string): string {
  const mapping: Record<string, string> = {
    'apartment': 'vivienda',
    'house': 'vivienda',
    'land': 'terreno',
    'office': 'local',
    'commercial': 'local',
    'warehouse': 'nave',
  };
  return mapping[propertyType] || 'otros';
}

async function createSyncLog(source: string, type: string, status: string): Promise<string> {
  const { data } = await supabase
    .from('api_sync_logs')
    .insert([{ source, sync_type: type, status }])
    .select('id')
    .single();
  return data?.id || '';
}

async function updateSyncLog(
  logId: string,
  status: string,
  processed: number,
  added: number,
  updated: number,
  removed: number
): Promise<void> {
  await supabase
    .from('api_sync_logs')
    .update({
      status,
      items_processed: processed,
      items_added: added,
      items_updated: updated,
      items_removed: removed,
      ended_at: new Date().toISOString(),
    })
    .eq('id', logId);
}
```

#### Función 2: Sync de múltiples APIs (supabase/functions/sync-all-marketplaces/index.ts)
```typescript
// Función para ejecutar todos los syncs
// Puede ser llamada por un cron job

Deno.serve(async (req: Request) => {
  const sources = ['idealista', 'fotocasa', 'olx', 'milanuncios'];
  const results = {};

  for (const source of sources) {
    try {
      const response = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-${source}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
        }
      );
      results[source] = await response.json();
    } catch (error) {
      results[source] = { error: (error as Error).message };
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### Actualizar tabla listings para usar marketplace_listings
```typescript
// En src/lib/supabase.ts - Actualizar Query

export async function getListings(filters: ListingFilters) {
  // Combinar datos de listings (manual) + marketplace_listings (sincronizados)
  let query = supabase
    .from('marketplace_listings')
    .select('*')
    .eq('sync_status', 'active');

  // Aplicar filtros...
  // ...
}
```

---

## 3️⃣ IMPLEMENTACIÓN: GOOGLE MAPS

### Instalación
```bash
npm install @react-google-maps/api
```

### Crear componente MapView (src/components/MapView.tsx)
```typescript
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useLoadScript } from '@react-google-maps/api';
import { useState } from 'react';
import { Listing } from '../lib/supabase';

interface MapViewProps {
  listings: Listing[];
  onListingSelect: (id: string) => void;
}

export function MapView({ listings, onListingSelect }: MapViewProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  if (!isLoaded) return <div>Cargando mapa...</div>;

  return (
    <GoogleMap
      zoom={10}
      center={{ lat: 40.4168, lng: -3.7038 }} // Madrid por defecto
      mapContainerStyle={{ width: '100%', height: '100%' }}
    >
      {listings.map((listing) => {
        const coords = parseCoordinates(listing.location);
        if (!coords) return null;

        return (
          <Marker
            key={listing.id}
            position={coords}
            onClick={() => setSelectedMarker(listing.id)}
          >
            {selectedMarker === listing.id && (
              <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                <div className="p-2">
                  <h3 className="font-bold">{listing.title}</h3>
                  <p className="text-sm">${listing.price}</p>
                  <button
                    onClick={() => onListingSelect(listing.id)}
                    className="mt-2 px-2 py-1 bg-emerald-500 text-white rounded text-xs"
                  >
                    Ver detalles
                  </button>
                </div>
              </InfoWindow>
            )}
          </Marker>
        );
      })}
    </GoogleMap>
  );
}

function parseCoordinates(location: string | null) {
  // TODO: Implementar geocoding
  // Por ahora retornar null, luego conectar con Google Geocoding API
  return null;
}
```

### Crear servicio de Geocoding
```typescript
// src/services/geocoding.ts
const cache = new Map<string, { lat: number; lng: number }>();

export async function geocodeAddress(address: string) {
  if (cache.has(address)) {
    return cache.get(address);
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
  );

  const data = await response.json();

  if (data.results.length > 0) {
    const { lat, lng } = data.results[0].geometry.location;
    cache.set(address, { lat, lng });
    return { lat, lng };
  }

  return null;
}
```

---

## 4️⃣ CONFIGURACIÓN STRIPE - Pasos Concretos

### 1. Obtener Price IDs reales
1. Ir a https://dashboard.stripe.com/prices
2. Crear 3 precios (1 mes, 3 meses, 6 meses):
   - 1 mes: €2.49
   - 3 meses: €6.49
   - 6 meses: €11.49
3. Copiar los Price IDs (price_xxxxx)

### 2. Actualizar stripe-config.ts
```typescript
export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    priceId: 'price_1ThxAcIXfL8TnkwC2idYT1DL', // ✅ REAL
    name: 'Plan 1 mes',
    description: 'Suscripción mensual',
    price: 2.49,
    currency: 'eur',
    currencySymbol: '€',
    mode: 'subscription'
  },
  // ... resto ...
];
```

### 3. Configurar webhook en Stripe
1. Ir a https://dashboard.stripe.com/webhooks
2. Crear nuevo endpoint
3. URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Seleccionar eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 4. Variables de entorno
```bash
# Obtener del dashboard de Stripe
STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## 5️⃣ IMPLEMENTACIÓN: NOTIFICACIONES PUSH

### Instalación
```bash
npm install firebase
```

### Crear servicio de notificaciones (src/services/notifications.ts)
```typescript
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function requestNotificationPermission() {
  try {
    const token = await getToken(messaging);
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Failed to get notification token:', error);
  }
}

export function setupNotificationListener() {
  onMessage(messaging, (payload) => {
    console.log('Message received:', payload);
    
    if (Notification.permission === 'granted') {
      new Notification(payload.notification?.title || 'New Alert', {
        body: payload.notification?.body,
        icon: payload.notification?.image,
      });
    }
  });
}
```

---

## 6️⃣ DOCUMENTACIÓN MÍNIMA A CREAR

### README.md actualizado
```markdown
# ArmiLuce - Marketplace Inmobiliario

App para buscar y vender inmuebles, terrenos y vehículos con alertas inteligentes.

## Características

- 🏠 Búsqueda de inmuebles, terrenos y vehículos
- 🔔 Alertas personalizadas en tiempo real
- 📍 Visualización en mapa
- ⭐ Favoritos y guardados
- 💳 Suscripción premium con Stripe
- 🔐 Autenticación segura con Supabase

## Tech Stack

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Supabase (PostgreSQL + Auth)
- Payments: Stripe
- Maps: Google Maps API

## Instalación

1. Clonar repositorio
2. Copiar `.env.example` a `.env.local` y llenar variables
3. `npm install`
4. `npm run dev`

## Deployment

Ver [DEPLOYMENT.md](./DEPLOYMENT.md)

## License

MIT
```

---

## 📋 CHECKLIST DE TAREAS

### Semana 1: Correcciones Críticas
- [ ] Corregir Navbar.tsx
- [ ] Corregir PricingCard.tsx (variable session)
- [ ] Resolver vulnerabilidades npm
- [ ] Crear .env.example
- [ ] Validar deployment local

### Semana 2-3: APIs de Mercados
- [ ] Crear tablas marketplace_listings
- [ ] Implementar sync Idealista
- [ ] Implementar sync Fotocasa
- [ ] Implementar sync OLX
- [ ] Testing de sincronización

### Semana 4: Google Maps
- [ ] Setup Google Maps API
- [ ] Crear componente MapView
- [ ] Integrar geocoding
- [ ] Testing de mapa

### Semana 5: Notificaciones
- [ ] Setup Firebase Cloud Messaging
- [ ] Implementar notificaciones push
- [ ] Email notifications
- [ ] Testing

### Semana 6: Testing & Deploy
- [ ] Escribir tests
- [ ] Deploy staging
- [ ] Testing en producción
- [ ] Optimizaciones
- [ ] Deploy producción

---

Este plan es orientativo. Los tiempos pueden variar según:
- Complejidad de las APIs de mercados
- Experiencia del desarrollador
- Disponibilidad de tiempo
- Cambios en requisitos
```

