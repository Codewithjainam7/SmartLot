// @smartlot/core
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables. Check your .env file.");
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

/**
 * Checks connectivity to the live Supabase project.
 * Returns true if the database responds, false otherwise.
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('schemes').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// Supabase Client Config Marker
// Security: Connection Health and Session Sync
// UI: Session State Recovery Handlers