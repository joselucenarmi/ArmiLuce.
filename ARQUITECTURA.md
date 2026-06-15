# 🏗️ ARQUITECTURA DEL PROYECTO

## Diagrama de Componentes Actual

```
┌─────────────────────────────────────────────────────────┐
│                    ArmiLuce App                         │
│                  (Frontend - Vite React)                │
└────────────┬──────────────────────────────────┬─────────┘
             │                                  │
        ┌────┴──────┐                    ┌────────────┐
        │ Auth Flow │                    │ UI Layout  │
        │ (useAuth) │                    │ & Pages    │
        └────┬──────┘                    └────────────┘
             │
    ┌────────┴──────────┐
    │  Pages (10)       │
    │ ├─ Dashboard      │
    │ ├─ Search         │
    │ ├─ Alerts         │
    │ ├─ Notifications  │
    │ ├─ Favorites      │
    │ ├─ Settings       │
    │ ├─ Pricing        │
    │ └─ ListingDetail  │
    └────────┬──────────┘
             │
    ┌────────┴───────────────────────┐
    │  External Services             │
    │                                │
    │  Supabase (Auth + DB) ────┐   │
    │  Stripe (Payments) ──────┐│   │
    │  Google Maps ────────────┐││  │
    │                          │││  │
    └──────────────────────────┼┼┼──┘
                               │││
    ┌──────────────────────────┼┼┼──────────────────┐
    │  Backend (Supabase)      │││                  │
    │                          │││                  │
    │  PostgreSQL DB:          ▼││                  │
    │  ├─ profiles             ││                   │
    │  ├─ listings             ││ (Sin marcar)      │
    │  ├─ alerts               ││ AÚN NO EXISTE:    │
    │  ├─ favorites            ││ - marketplace_listings
    │  └─ notifications        ││ - google_maps_cache
    │                          ││ - subscription_logs
    │  Serverless Functions:   ││                   │
    │  ├─ stripe-checkout      ▼│                   │
    │  ├─ stripe-portal         │                   │
    │  └─ stripe-webhook        │ (Sin marcar)      │
    │                           │ FALTA:            │
    │  RLS Policies: ✅          │ - sync-idealista │
    │  Auth Triggers: ✅         │ - sync-fotocasa  │
    │  Migrations: ✅            │ - sync-olx       │
    │                           │ - geocoding       │
    └───────────────────────────┴───────────────────┘
```

---

## Estado de Cada Componente

### 🟢 COMPLETAMENTE FUNCIONAL

**Frontend UI**
- [x] React setup
- [x] TypeScript
- [x] Tailwind CSS
- [x] Responsive design
- [x] Dark mode theme

**Autenticación**
- [x] Sign Up
- [x] Sign In
- [x] Sign Out
- [x] Email verification
- [x] Password recovery
- [x] useAuth Hook
- [x] Protected routes

**Base de Datos**
- [x] All tables created
- [x] RLS policies implemented
- [x] Relationships defined
- [x] Indexes created
- [x] Functions (trigger-based)

**Favoritos**
- [x] Add/Remove favoritos
- [x] Lista de favoritos
- [x] Search in favorites
- [x] Sort by price/date

---

### 🟡 PARCIALMENTE FUNCIONAL

**Búsqueda**
- [x] Interfaz de búsqueda
- [x] Filtros: categoría, tipo, precio, ubicación
- [x] Paginación
- [x] Vista grid/lista
- [ ] Full-text search (PostgreSQL)
- [ ] Búsqueda por mapa
- [ ] Búsqueda guardada

**Alertas**
- [x] Crear alertas
- [x] Editar alertas
- [x] Eliminar alertas
- [x] Activar/desactivar
- [x] Filtering logic
- [ ] Real-time alert trigger
- [ ] Email notifications

**Notificaciones**
- [x] Guardar en BD
- [x] Marcar como leído
- [x] Eliminar
- [ ] Push notifications
- [ ] Email alerts
- [ ] Realtime updates

**Stripe Integration**
- [x] 3 plans configured
- [x] Checkout function
- [x] Portal function
- [x] Webhook function
- [x] Pricing page
- [ ] Product IDs actualizados
- [ ] Error handling mejorado
- [ ] Discount codes

**PricingCard Component**
- [x] UI design
- [x] Features list
- [ ] Correct session handling
- [ ] Loading states
- [ ] Error handling

---

### 🔴 NO IMPLEMENTADO (CRÍTICO)

**APIs de Mercados**
```
❌ Idealista API integration
❌ Fotocasa API integration
❌ OLX API integration
❌ Milanuncios API integration
❌ Marketplace listings table
❌ Sync scheduling (cron)
❌ Data deduplication
❌ Price tracking
❌ URL validation
❌ Image handling
```

**Google Maps**
```
❌ Maps component
❌ Markers display
❌ Geocoding service
❌ Distance calculation
❌ Radius search
❌ Map filters
❌ Google Maps API key management
```

**Real-time Sync**
```
❌ Automated data refresh
❌ Change detection
❌ Price monitoring
❌ Availability tracking
❌ Sold item detection
❌ Error recovery
```

**Notifications**
```
❌ Web push notifications
❌ Email notifications
❌ SMS alerts (optional)
❌ Telegram integration (optional)
❌ Notification preferences
❌ Unsubscribe links
```

---

## Flujo de Datos Actual vs. Requerido

### Actual (Incompleto)
```
Usuario
  │
  ├─→ [Búsqueda]
  │    │
  │    └─→ BD (listings vacía) ❌ SIN DATOS
  │
  ├─→ [Alertas]
  │    │
  │    └─→ BD (alertas guardadas) ✅
  │         │
  │         └─→ Notificaciones (en BD, sin push) ⚠️
  │
  ├─→ [Favoritos]
  │    │
  │    └─→ BD (favorites) ✅
  │
  └─→ [Pricing]
       │
       └─→ Stripe (incomplete) ⚠️
```

### Requerido (Completo)
```
APIs Externas
├─ Idealista → [Sync Worker]
├─ Fotocasa → [Sync Worker]
├─ OLX      → [Sync Worker]
└─ Milanuncios → [Sync Worker]
       │
       ▼
   [Deduplication]
       │
       ▼
   BD (marketplace_listings) ✅
       │
       ├─→ [Búsqueda] ✅
       │    │
       │    ├─→ [Mapa - Google Maps] ✅
       │    └─→ [Filtros Avanzados] ✅
       │
       ├─→ [Alertas]
       │    │
       │    ├─→ Matching automático ✅
       │    ├─→ Notifications (BD) ✅
       │    └─→ Push Notifications ✅
       │
       └─→ [Favoritos] ✅

[Usuario]
  │
  ├─→ Auth ✅
  ├─→ Búsqueda/Mapas ✅
  ├─→ Alertas + Notificaciones ✅
  ├─→ Favoritos ✅
  └─→ Suscripción (Stripe) ✅
```

---

## Tabla Comparativa: Estado Actual vs. Production-Ready

| Feature | Actual | Necesario | Gap |
|---------|--------|-----------|-----|
| UI/UX | 80% | 100% | 20% |
| Auth | 100% | 100% | 0% |
| Database | 95% | 100% | 5% |
| Búsqueda | 50% | 100% | 50% |
| Alertas | 80% | 100% | 20% |
| Mapas | 0% | 100% | 100% |
| APIs Externas | 0% | 100% | 100% |
| Notificaciones | 30% | 100% | 70% |
| Pagos | 60% | 100% | 40% |
| Testing | 0% | 80% | 80% |
| Documentación | 5% | 90% | 85% |
| **TOTAL** | **40%** | **100%** | **60%** |

---

## Stack Tecnológico Actual

### Frontend ✅
```
React 18.3.1
├─ TypeScript 5.5.3
├─ Vite 5.4.2
├─ Tailwind CSS 3.4.1
├─ React Router 7.17.0
├─ React Query 5.101.0
├─ Lucide React (iconos)
├─ Stripe JS
└─ Supabase JS Client
```

### Backend ✅
```
Supabase
├─ PostgreSQL (BD)
├─ Auth (Supabase Auth)
├─ Realtime DB
└─ Edge Functions (Deno)
```

### Externos ⚠️
```
Stripe (Incompleto)
├─ Checkout ⚠️
├─ Billing Portal ⚠️
└─ Webhooks ⚠️

Google Maps (No implementado)

APIs de Mercados (No implementado)
```

---

## Problemas Técnicos Detectados

### 1️⃣ Errores de Compilación
```typescript
// src/components/Navbar.tsx
❌ Syntax Error: ';' expected

// src/components/PricingCard.tsx
❌ Variable 'session' undefined
❌ No error handling en fetch
```

### 2️⃣ Vulnerabilidades
```
npm audit shows:
- 2 low severity
- 8 moderate severity
- 8 high severity

Total: 18 vulnerabilities
```

### 3️⃣ Configuración Incompleta
```
.env.example está VACÍO ❌
Stripe Price IDs son placeholders ❌
Google Maps key no configurada ❌
```

### 4️⃣ Datos de Prueba
```
Base de datos VACÍA ❌
Sin seed data ❌
Sin mock data ❌
```

---

## Timeline Estimado para Production

| Phase | Duration | Status |
|-------|----------|--------|
| Fix errors & setup | 1 week | TODO |
| Marketplace APIs | 3 weeks | TODO |
| Google Maps | 1 week | TODO |
| Notifications | 1 week | TODO |
| Testing | 2 weeks | TODO |
| Deployment | 1 week | TODO |
| **TOTAL** | **~9 weeks** | TO BEGIN |

---

## Recomendación Final

### Hoy (Urgente)
1. Corregir errores de compilación
2. Setup .env.local correcto
3. Validar autenticación

### Esta Semana (Importante)
1. Investigar APIs de mercados disponibles
2. Crear estructura para datos de mercados
3. Implement mock sync worker

### Próximas 2 Semanas (High Priority)
1. Implementar API de un mercado (Ej: Fotocasa)
2. Google Maps integration
3. Real-time notifications

### Mes Siguiente (Before Launch)
1. Todas las APIs
2. Testing exhaustivo
3. Performance optimization
4. Security audit
5. SEO optimization

**Recomendación: No lanzar sin las APIs implementadas. Sin datos = Sin usuarios.**

