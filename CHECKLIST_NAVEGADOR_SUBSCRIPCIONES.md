# Checklist navegador: comprobación completa de suscripciones (Premium)

> Objetivo: validar que checkout, webhook, estado en `profiles`, UI inmediata y endpoint unificado funcionan.

## 0) Requisitos previos
- Tener el proyecto desplegado (frontend + Supabase Edge Functions).
- Tener credenciales Stripe y Supabase configuradas en el entorno.
- Usar una cuenta de test en Stripe (modo test).

## 1) Ver que la UI muestra el estado correctamente
1. Abre la web en modo incógnito.
2. Inicia sesión en la cuenta de test.
3. Verifica el **badge Premium/Básico** en el **header desktop**:
   - Debe renderizarse `SubscriptionStatus` (en `src/components/Layout.tsx`).
   - Resultado esperado:
     - Si `profiles.subscription_status === 'active'` y `subscription_plan !== 'basic'` → **Premium**.
     - En caso contrario → **Básico**.

## 2) Compra Premium desde Pricing
1. Navega a **/pricing**.
2. Selecciona una duración (1/3/6/12 meses según UI).
3. Pulsa **Contratar**.
4. Confirma el pago en el flujo de Stripe (tarjeta test).
5. Debes terminar en **/settings?payment=success** (o la página configurada por la función).

## 3) Confirmar consistencia de endpoints
Objetivo: comprobar que todo apunta al mismo endpoint.

- El frontend debe crear checkout usando:
  - `.../functions/v1/stripe-checkout`.
- La parte alternativa debe quedar coherente:
  - `src/hooks/useSubscription.ts` ahora invoca `stripe-checkout`.

> Qué comprobar en navegador:
- Abre DevTools → Network.
- Filtra por `stripe-checkout` y confirma:
  - Existe un request a `functions/v1/stripe-checkout`.
  - No aparece un request a `functions/v1/create-checkout`.

## 4) Verificar que el webhook actualiza la BD
1. En Supabase, abre **Edge Functions logs** o el log del webhook.
2. Tras completar el pago, verifica que el endpoint:
   - `supabase/functions/stripe-webhook` recibe eventos.
3. Debe ocurrir como mínimo:
   - `checkout.session.completed` → actualiza en `profiles`:
     - `subscription_plan`
     - `subscription_status: 'active'`

> Resultado esperado:
- En la tabla `profiles` para tu usuario:
  - `subscription_status` debe pasar a `active`.
  - `subscription_plan` debe reflejar el plan correspondiente.

## 5) Verificar “estado Premium se refleja inmediatamente”
Hay dos escenarios a validar:

### Escenario A: al volver a la web tras success
1. Tras el success, vuelve al **header**.
2. Verifica que el badge pasa a **Premium**.
3. Si no cambia:
   - Recarrega la página (hard refresh) y vuelve a mirar el badge.

### Escenario B: navegación interna
1. Sin recargar totalmente el navegador, navega a:
   - /dashboard
   - /pricing
2. Verifica si el badge se actualiza en el header.

## 6) Probar portal y cambios de estado
1. En la UI donde esté el acceso a portal (si aplica), abre el portal.
2. Cancela o modifica la suscripción.
3. Espera eventos del webhook:
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Verifica en BD y en el badge:
   - cancel → `subscription_status` cambia de `active`
   - plan → según lógica del webhook

## 7) Errores a documentar (si aparecen)
- Request a endpoint incorrecto (create-checkout / stripe-checkout) → detener y corregir.
- Webhook firma inválida:
  - revisar `STRIPE_WEBHOOK_SECRET`.
- `profiles.stripe_customer_id` faltante:
  - debe crear customer y guardarlo (stripe-checkout lo hace).

## 8) Evidencia a guardar
- Screenshot del badge **antes** y **después** del pago.
- Captura del Network request a `stripe-checkout`.
- Link/screenshot de logs del webhook en Supabase.
- Captura de las columnas en `profiles`:
  - `subscription_plan`
  - `subscription_status`

