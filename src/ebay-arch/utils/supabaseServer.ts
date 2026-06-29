import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url) throw new Error('Missing SUPABASE_URL');
  if (!anonKey) throw new Error('Missing SUPABASE_ANON_KEY');

  // RLS/Key rules apply según el rol del anon key.
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

