// Nota: este módulo se ejecuta en el runtime Deno de las Edge Functions de Supabase.
// Se usa el especificador 'npm:' (soportado nativamente por Deno) y Deno.env
// para leer variables de entorno. Este archivo está excluido del typecheck del
// frontend (tsconfig.app.json) porque solo corre en el runtime Deno.
import { createClient } from 'npm:@supabase/supabase-js@2';

export function createSupabaseClient() {
  const url = Deno.env.get('SUPABASE_URL');
  // INSERT en 'listings' requiere service_role (RLS restringe INSERT a service_role).
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url) throw new Error('Missing SUPABASE_URL');
  if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

