import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { initialData } from '../data/initialData';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { loadRemoteData, saveRemoteData, subscribeToRemoteData } from '../services/supabaseDataService';

export const DataContext = createContext(null);

const normalizeData = (rawData) => {
  const source = rawData && typeof rawData === 'object' ? rawData : initialData;
  const alunos = Array.isArray(source.alunos) ? source.alunos : initialData.alunos;
  const professores = Array.isArray(source.professores) ? source.professores : initialData.professores;
  const config = { ...(source.config || {}) };
  delete config.webhookUrl;

  return {
    ...initialData,
    ...source,
    turmas: Array.isArray(source.turmas) ? source.turmas : initialData.turmas,
    professores: professores.map((professor) => ({
      ...professor,
      turmas: Array.isArray(professor.turmas) ? professor.turmas : [],
    })),
    empresas: Array.isArray(source.empresas) && source.empresas.length > 0
      ? source.empresas
      : initialData.empresas,
    alunos: alunos.map((aluno) => ({
      ...aluno,
      status: aluno.status || (aluno.isPresent ? 'presente' : 'pendente'),
      empresaId: aluno.empresaId || '',
    })),
    config: {
      ...initialData.config,
      ...config,
      provider: 'supabase',
    },
  };
};

const serializeData = (value) => JSON.stringify(normalizeData(value));

export function DataProvider({ children }) {
  const [data, setData] = useState(() => normalizeData(initialData));
  const [isDataLoading, setIsDataLoading] = useState(isSupabaseConfigured);
  const [syncStatus, setSyncStatus] = useState(isSupabaseConfigured ? 'loading' : 'not_configured');
  const [syncError, setSyncError] = useState('');
  const hasLoadedRemoteData = useRef(!isSupabaseConfigured);
  const lastSavedSnapshot = useRef(serializeData(initialData));
  const saveTimeout = useRef(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined;
    }

    let isMounted = true;

    const loadData = async () => {
      try {
        setSyncStatus('loading');
        const remoteData = await loadRemoteData();
        const shouldSeedRemote = !remoteData || Object.keys(remoteData).length === 0;
        const normalized = normalizeData(shouldSeedRemote ? initialData : remoteData);
        const snapshot = serializeData(normalized);

        if (!isMounted) return;

        lastSavedSnapshot.current = snapshot;
        hasLoadedRemoteData.current = true;
        setData(normalized);
        setSyncError('');
        setSyncStatus('synced');
        setIsDataLoading(false);

        if (shouldSeedRemote) {
          await saveRemoteData(normalized);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do Supabase:', error);
        if (!isMounted) return;
        hasLoadedRemoteData.current = true;
        setSyncError(error.message || 'Erro ao carregar dados do Supabase.');
        setSyncStatus('error');
        setIsDataLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    return subscribeToRemoteData(
      (remoteData) => {
        const normalized = normalizeData(remoteData);
        const snapshot = serializeData(normalized);

        if (snapshot === lastSavedSnapshot.current) return;

        lastSavedSnapshot.current = snapshot;
        setData(normalized);
        setSyncError('');
        setSyncStatus('synced');
      },
      (error) => {
        console.error('Erro ao sincronizar dados do Supabase:', error);
        setSyncError(error.message || 'Erro ao sincronizar dados do Supabase.');
        setSyncStatus('error');
      },
    );
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !hasLoadedRemoteData.current) return undefined;

    const snapshot = serializeData(data);
    if (snapshot === lastSavedSnapshot.current) return undefined;

    setSyncStatus('saving');
    setSyncError('');

    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(async () => {
      try {
        const normalized = normalizeData(data);
        await saveRemoteData(normalized);
        lastSavedSnapshot.current = serializeData(normalized);
        setSyncStatus('synced');
      } catch (error) {
        console.error('Erro ao salvar dados no Supabase:', error);
        setSyncError(error.message || 'Erro ao salvar dados no Supabase.');
        setSyncStatus('error');
      }
    }, 600);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [data]);

  const saveDataNow = useCallback(async (nextData = data) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase nao configurado.');
    }

    const normalized = normalizeData(nextData);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    setSyncStatus('saving');
    setSyncError('');
    await saveRemoteData(normalized);
    lastSavedSnapshot.current = serializeData(normalized);
    setSyncStatus('synced');

    return normalized;
  }, [data]);

  const reloadData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase nao configurado.');
    }

    setSyncStatus('loading');
    setSyncError('');
    const remoteData = await loadRemoteData();
    const normalized = normalizeData(remoteData || initialData);
    lastSavedSnapshot.current = serializeData(normalized);
    setData(normalized);
    setSyncStatus('synced');

    return normalized;
  }, []);

  return (
    <DataContext.Provider
      value={{
        data,
        setData,
        isDataLoading,
        syncStatus,
        syncError,
        isSupabaseConfigured,
        saveDataNow,
        reloadData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
