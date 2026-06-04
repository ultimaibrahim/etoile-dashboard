import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lbnqpcrhyebtbblpvazp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WXCdzeTmvrF2IGJfogAMGw_FBP-mr8Y';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL y Anon Key son obligatorios. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
