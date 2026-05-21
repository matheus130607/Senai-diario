import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { initialData } from '../data/initialData';
import { isSupabaseConfigured } from '../services/supabaseClient';
import {
  loadSupabaseData,
  saveAttendanceRecords,
  subscribeToSupabaseData,
} from '../services/supabaseDataService';

export const DataContext = createContext(null);

const emptyData = {
  turmas: [],
  professores: [],
  empresas: [],
  alunos: [],
  administradores: [],
  presencas: [],
  config: {
    provider: 'supabase',
  },
};

const normalizeData = (rawData) => {
  const fallback = isSupabaseConfigured ? emptyData : initialData;
  const source = rawData && typeof rawData === 'object' ? rawData : fallback;
  const alunos = Array.isArray(source.alunos) ? source.alunos : fallback.alunos;
  const professores = Array.isArray(source.professores) ? source.professores : fallback.professores;
  const config = { ...(source.config || {}) };
  delete config.webhookUrl;

  return {
    ...fallback,
    ...source,
    turmas: Array.isArray(source.turmas) ? source.turmas : fallback.turmas,
    professores: professores.map((professor) => ({
      ...professor,
      turmas: Array.isArray(professor.turmas) ? professor.turmas : [],
    })),
    empresas: Array.isArray(source.empresas) ? source.empresas : fallback.empresas,
    alunos: alunos.map((aluno) => ({
      ...aluno,
      status: aluno.status || (aluno.isPresent ? 'presente' : 'pendente'),
      empresaId: aluno.empresaId || '',
      turmaId: aluno.turmaId || '',
    })),
    administradores: Array.isArray(source.administradores) ? source.administradores : [],
    presencas: Array.isArray(source.presencas) ? source.presencas : [],
    config: {
      ...fallback.config,
      ...config,
      provider: 'supabase',
    },
  };
};

export function DataProvider({ children }) {
  const [data, setData] = useState(() => normalizeData(isSupabaseConfigured ? emptyData : initialData));
  const [isDataLoading, setIsDataLoading] = useState(isSupabaseConfigured);
  const [syncStatus, setSyncStatus] = useState(isSupabaseConfigured ? 'loading' : 'not_configured');
  const [syncError, setSyncError] = useState('');
  const reloadTimeout = useRef(null);

  const reloadData = useCallback(async ({ silent = false } = {}) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase nao configurado.');
    }

    try {
      if (!silent) setSyncStatus('loading');
      setSyncError('');

      const remoteData = await loadSupabaseData();
      const normalized = normalizeData(remoteData);
      setData(normalized);
      setSyncStatus('synced');
      setIsDataLoading(false);

      return normalized;
    } catch (error) {
      setSyncError(error.message || 'Erro ao carregar dados do Supabase.');
      setSyncStatus('error');
      setIsDataLoading(false);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    let isMounted = true;

    const loadInitialData = async () => {
      try {
        await reloadData();
      } catch (error) {
        console.error('Erro ao carregar dados do Supabase:', error);
        if (!isMounted) return;
        setSyncError(error.message || 'Erro ao carregar dados do Supabase.');
        setSyncStatus('error');
        setIsDataLoading(false);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
      if (reloadTimeout.current) clearTimeout(reloadTimeout.current);
    };
  }, [reloadData]);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    return subscribeToSupabaseData(
      () => {
        if (reloadTimeout.current) clearTimeout(reloadTimeout.current);
        reloadTimeout.current = setTimeout(async () => {
          try {
            await reloadData({ silent: true });
          } catch (error) {
            console.error('Erro ao sincronizar dados do Supabase:', error);
            setSyncError(error.message || 'Erro ao sincronizar dados do Supabase.');
            setSyncStatus('error');
          }
        }, 300);
      },
      (error) => {
        console.error('Erro ao assinar dados do Supabase:', error);
        setSyncError(error.message || 'Erro ao assinar atualizacoes do Supabase.');
        setSyncStatus('error');
      },
    );
  }, [reloadData]);

  const saveAttendance = useCallback(async ({ alunos, turmaId, professorId, date }) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase nao configurado.');
    }

    setSyncStatus('saving');
    setSyncError('');

    try {
      await saveAttendanceRecords({ alunos, turmaId, professorId, date });
      return await reloadData({ silent: true });
    } catch (error) {
      setSyncError(error.message || 'Erro ao salvar presencas no Supabase.');
      setSyncStatus('error');
      throw error;
    }
  }, [reloadData]);

  return (
    <DataContext.Provider
      value={{
        data,
        setData,
        isDataLoading,
        syncStatus,
        syncError,
        isSupabaseConfigured,
        reloadData,
        saveAttendance,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
