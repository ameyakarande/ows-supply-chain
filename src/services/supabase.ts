import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials missing. Check your .env.local or .env file.');
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type SupabaseHealthStatus = 'connected' | 'unavailable' | 'missing_config';

export async function checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
  if (!isSupabaseConfigured || !supabase) {
    return 'missing_config';
  }

  const { error } = await supabase.from('app_master_data').select('id').limit(1);
  return error ? 'unavailable' : 'connected';
}
