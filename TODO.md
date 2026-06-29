# TODO

- [x] Crear arquitectura modular en `src/ebay-arch/` (auth, browse, normalizer, importer, types, utils).
- [x] Implementar flujo mínimo: OAuth -> Browse -> Normalizar -> Deduplicar -> Insertar.
- [x] Crear endpoint de prueba Supabase Edge Function: `supabase/functions/ebay/import-10-ads/index.ts` que inserta 10 anuncios reales.
- [x] Asegurar compilación: `npm run typecheck`.
- [x] Asegurar build: `npm run build`.

