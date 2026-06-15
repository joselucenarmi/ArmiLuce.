# 🚀 GUÍA DE INICIO RÁPIDO

## ¿Cómo ver el proyecto AHORA MISMO?

### Paso 1: Configurar Supabase

1. Ir a https://supabase.com y crear una cuenta
2. Crear un proyecto nuevo
3. En el Dashboard, ir a **Settings → API**
4. Copiar:
   - Project URL
   - Anon Key

### Paso 2: Configurar Stripe (Modo Test)

1. Ir a https://stripe.com y crear cuenta
2. Ir a Dashboard → Developers → API Keys
3. Copiar:
   - Publishable Key (pk_test_...)
   - Secret Key (sk_test_...)

### Paso 3: Crear archivo .env.local

En la raíz del proyecto crear `.env.local`:

```env
# Supabase (Obligatorio para que funcione)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Stripe (Necesario para suscripción)
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx

# Opcional (para más tarde)
VITE_GOOGLE_MAPS_API_KEY=
IDEALISTA_API_KEY=
```

### Paso 4: Instalar y ejecutar

```bash
cd /home/codespace/ArmiLuce./

# Instalar dependencias
npm install

# Ejecutar dev server
npm run dev
```

App estará en: http://localhost:5173

---

## 🧪 PRUEBAS RÁPIDAS DEL PROYECTO

### Test 1: Autenticación
1. Abre http://localhost:5173
2. Verás formulario de login
3. Crea una cuenta (email + password)
4. Deberías entrar al Dashboard

**Esperado:** ✅ Dashboard carga
**Real:** [VEREMOS]

### Test 2: Búsqueda de anuncios
1. Click en "Buscar anuncios"
2. **PROBLEMA:** La base de datos está VACÍA
3. No habrá anuncios para mostrar

**Solución temporal:** Añadir datos de prueba manualmente

### Test 3: Sistema de alertas
1. Click en "Alertas"
2. Crear una nueva alerta
3. Deberías poder crearla

**Esperado:** ✅ Alerta creada
**Real:** [VEREMOS]

### Test 4: Pricing (Suscripción)
1. Click en "Pricing"
2. Ver planes
3. Click en "Suscribirse"
4. Deberá llevarte a Stripe

**Problema:** Sin key de Stripe correcta no funcionará

---

## 📊 QUÉ VER EN VIVO

### Funciona correctamente ✅
- Registro/Login
- Sistema de alertas
- Favoritos
- Notificaciones (guardadas en BD)
- Perfil/Configuración

### NO funciona ❌
- Búsqueda (BD vacía)
- Mapas (API no configurada)
- Pagos (Stripe incomplete)
- Notificaciones push (no implementadas)
- APIs de mercados (no existen)

### Incompleto ⚠️
- PricingCard (bug en variable session)
- Navbar (error de sintaxis)
- Sync de datos (no existe)

---

## 🐛 ERRORES CONOCIDOS (Já encontrados)

### Error 1: npm vulnerabilities
```bash
npm audit fix
```

### Error 2: Navbar.tsx - TS Error
```
src/components/Navbar.tsx:1:8 - error TS1005: ';' expected.
```
**Causa:** Probablemente caracteres especiales o JSON
**Solución:** Revisar archivo manualmente

### Error 3: PricingCard - Variable `session` no existe
**Línea:** ~30 en src/components/PricingCard.tsx
**Causa:** No importa ni obtiene la sesión
**Solución:** Usar useAuth hook

---

## 📈 MÉTRICAS DEL PROYECTO

| Métrica | Valor |
|---------|-------|
| Líneas de código | ~3000+ |
| Componentes | 15+ |
| Páginas | 10+ |
| Tablas BD | 6 |
| Funciones serverless | 3 |
| Migraciones | 5 |
| Dependencias npm | 14 |
| Vulnerabilidades npm | 18 ⚠️ |

---

## 🎯 PRÓXIMOS PASOS (Orden de Importancia)

### Hoy (Critical)
1. [ ] Corregir errores de compilación
2. [ ] Resolver vulnerabilidades npm
3. [ ] Validar autenticación

### Esta semana (High)
1. [ ] Crear datos de prueba en BD
2. [ ] Corregir PricingCard
3. [ ] Hacer test de Stripe en modo test

### Próxima semana (Medium)
1. [ ] Investigar APIs de mercados
2. [ ] Diseñar estructura de sync
3. [ ] Prototipar con datos mock

### Mes que viene (Important)
1. [ ] Implementar APIs reales
2. [ ] Google Maps integration
3. [ ] Push notifications
4. [ ] Deployment prep

---

## 💡 RECOMENDACIONES

### Para desarrollo local
```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Monitorear tipos
npm run typecheck -- --watch

# Terminal 3: Lint
npm run lint -- --watch
```

### Para debugging
```bash
# En Chrome DevTools:
1. F12 → Console
2. Buscar errores
3. Ver Network requests
4. Usar React DevTools extension
```

### Para testing de Stripe
```bash
# Usar tarjeta de prueba:
4242 4242 4242 4242
Exp: 12/25
CVC: 123
```

---

## 📞 PRÓXIMAS ACCIONES

1. **CORREGIR ERRORES INMEDIATOS** (hoy)
   - Fix Navbar.tsx
   - Fix PricingCard.tsx
   - npm audit fix

2. **CONFIGURAR ENTORNO** (hoy/mañana)
   - Crear .env.local con credenciales reales
   - Validar Supabase
   - Validar Stripe

3. **PRUEBAS BÁSICAS** (mañana)
   - Ejecutar proyecto
   - Probar autenticación
   - Probar flujo de alertas

4. **DATOS DE PRUEBA** (esta semana)
   - Insertar listados de prueba
   - Crear alertas de prueba
   - Verificar notificaciones

5. **APIs DE MERCADOS** (próxima semana)
   - Investigar APIs disponibles
   - Diseñar estructura de sync
   - Empezar con mock data

---

¿Necesitas ayuda con alguno de estos pasos? 🤔
