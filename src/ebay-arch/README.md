# ebay-arch

Arquitectura modular para ingestión de listings desde eBay.

Estructura:
- auth: OAuth token (client_credentials)
- browse: llamadas a Browse API
- normalizer: normalización de items -> NormalizedListing
- importer: deduplicación + inserción en DB
- types: tipos compartidos
- utils: utilidades (p.ej. asyncPool, supabase client)

Entrada principal:
- src/ebay-arch/entrypoints/importEbayListings.ts

Flujo:
1) OAuth token
2) Browse API
3) Normalizar
4) Deduplicar
5) Insertar en DB

