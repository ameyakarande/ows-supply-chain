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

export type SupabaseHealthStatus = 'connected' | 'network_error' | 'schema_missing' | 'missing_config';

export async function checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
  if (!isSupabaseConfigured || !supabase) {
    return 'missing_config';
  }

  const { error } = await supabase.from('app_master_data').select('id').limit(1);
  if (!error) {
    return 'connected';
  }

  const message = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`.toLowerCase();
  const code = `${error.code || ''}`.toLowerCase();

  if (
    code === '42p01' ||
    message.includes('relation') ||
    message.includes('does not exist') ||
    message.includes('schema cache')
  ) {
    return 'schema_missing';
  }

  return 'network_error';
}
