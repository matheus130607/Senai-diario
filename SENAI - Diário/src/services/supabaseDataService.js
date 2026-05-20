import { isSupabaseConfigured, supabase } from './supabaseClient';

export const APP_DATA_TABLE = import.meta.env.VITE_SUPABASE_APP_DATA_TABLE || 'app_data';
export const APP_DATA_ID = import.meta.env.VITE_SUPABASE_APP_DATA_ID || 'main';

const ensureSupabase = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }
};

export const loadRemoteData = async () => {
  ensureSupabase();

  const { data, error } = await supabase
    .from(APP_DATA_TABLE)
    .select('payload')
    .eq('id', APP_DATA_ID)
    .maybeSingle();

  if (error) throw error;
  return data?.payload || null;
};

export const saveRemoteData = async (payload) => {
  ensureSupabase();

  const { error } = await supabase
    .from(APP_DATA_TABLE)
    .upsert(
      {
        id: APP_DATA_ID,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

  if (error) throw error;
};

export const subscribeToRemoteData = (onChange, onError) => {
  if (!isSupabaseConfigured || !supabase) return () => {};

  const channel = supabase
    .channel(`app-data-${APP_DATA_ID}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: APP_DATA_TABLE,
        filter: `id=eq.${APP_DATA_ID}`,
      },
      (payload) => {
        if (payload.new?.payload) {
          onChange(payload.new.payload);
        }
      },
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        onError?.(new Error('Falha ao assinar atualizacoes em tempo real do Supabase.'));
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
};
