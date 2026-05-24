import { createClient } from '@supabase/supabase-js';

const normalizeSupabaseUrl = (url) => (
  String(url || '').trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
);

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
