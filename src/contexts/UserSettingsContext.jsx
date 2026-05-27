import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AuthContext } from './AuthContext';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

const STORAGE_KEY = 'senai-diario:user-settings:v1';

const defaultAccessibility = {
  theme: 'light',
  highContrast: false,
  colorScheme: 'senai',
  fontScale: 1,
  spacing: 'comfortable',
  interfaceScale: 1,
  keyboardShortcuts: true,
  screenReaderHints: true,
  focusMode: true,
  librasProvider: 'ready',
};

const defaultNotifications = {
  weeklyReports: true,
  absenceAlerts: true,
  automationFailures: true,
  productUpdates: false,
};

const createDefaultSettings = () => ({
  profile: {
    nome: '',
    email: '',
    telefone: '',
    cargo: '',
    foto: '',
    bio: '',
  },
  accessibility: defaultAccessibility,
  notifications: defaultNotifications,
  accessLogs: [],
  security: {
    passwordUpdatedAt: '',
  },
});

const readStoredSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const persistSettings = (settings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

const persistRemoteSettings = (userKey, userRole, settings) => {
  if (!isSupabaseConfigured || !supabase || !userKey || userKey === 'anonymous') return;

  supabase
    .from('user_preferences')
    .upsert({
      user_id: userKey,
      user_role: userRole || 'usuario',
      profile: {
        ...settings.profile,
        security: settings.security,
      },
      accessibility: settings.accessibility,
      notifications: settings.notifications,
      access_logs: settings.accessLogs,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,user_role' })
    .then(({ error }) => {
      if (!error) return;
      const message = String(error.message || '').toLowerCase();
      const isMissingTable = message.includes('user_preferences')
        || message.includes('schema cache')
        || message.includes('does not exist')
        || message.includes('could not find the table');
      if (!isMissingTable) console.error('Erro ao salvar preferências no Supabase:', error);
    });
};

const readRemoteSettings = async (userKey, userRole) => {
  if (!isSupabaseConfigured || !supabase || !userKey || userKey === 'anonymous') return null;

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userKey)
    .eq('user_role', userRole || 'usuario')
    .maybeSingle();

  if (error) {
    const message = String(error.message || '').toLowerCase();
    if (message.includes('user_preferences') || message.includes('schema cache') || message.includes('does not exist')) {
      return null;
    }
    throw error;
  }

  if (!data) return null;

  return mergeSettings({
    profile: data.profile || {},
    accessibility: data.accessibility || {},
    notifications: data.notifications || {},
    accessLogs: data.access_logs || [],
    security: data.profile?.security || {},
  });
};

const getUserKey = (currentUser) => (
  currentUser?.profileId || currentUser?.id || currentUser?.email || currentUser?.role || 'anonymous'
);

const mergeSettings = (settings) => ({
  ...createDefaultSettings(),
  ...settings,
  profile: {
    ...createDefaultSettings().profile,
    ...(settings?.profile || {}),
  },
  accessibility: {
    ...defaultAccessibility,
    ...(settings?.accessibility || {}),
  },
  notifications: {
    ...defaultNotifications,
    ...(settings?.notifications || {}),
  },
  security: {
    ...createDefaultSettings().security,
    ...(settings?.security || {}),
  },
  accessLogs: Array.isArray(settings?.accessLogs) ? settings.accessLogs : [],
});

export const UserSettingsContext = createContext(null);

export function UserSettingsProvider({ children }) {
  const { currentUser } = useContext(AuthContext);
  const [allSettings, setAllSettings] = useState(() => readStoredSettings());
  const lastAccessLogRef = useRef('');
  const userKey = getUserKey(currentUser);

  const settings = useMemo(() => {
    const stored = mergeSettings(allSettings[userKey]);
    return {
      ...stored,
      profile: {
        ...stored.profile,
        nome: stored.profile.nome || currentUser?.nome || '',
        email: stored.profile.email || currentUser?.email || '',
      },
    };
  }, [allSettings, currentUser, userKey]);

  useEffect(() => {
    if (!currentUser || !isSupabaseConfigured) return undefined;

    let isMounted = true;

    const loadRemote = async () => {
      try {
        const remoteSettings = await readRemoteSettings(userKey, currentUser.role);
        if (!isMounted || !remoteSettings) return;

        setAllSettings((prev) => {
          const next = {
            ...prev,
            [userKey]: mergeSettings({
              ...prev[userKey],
              ...remoteSettings,
            }),
          };
          persistSettings(next);
          return next;
        });
      } catch (error) {
        console.error('Erro ao carregar preferências do Supabase:', error);
      }
    };

    loadRemote();

    return () => {
      isMounted = false;
    };
  }, [currentUser, userKey]);

  const updateCurrentSettings = useCallback((updater) => {
    setAllSettings((prev) => {
      const current = mergeSettings(prev[userKey]);
      const nextForUser = typeof updater === 'function' ? updater(current) : updater;
      const next = {
        ...prev,
        [userKey]: mergeSettings(nextForUser),
      };
      persistSettings(next);
      persistRemoteSettings(userKey, currentUser?.role, next[userKey]);
      return next;
    });
  }, [currentUser?.role, userKey]);

  const updateProfile = useCallback((profilePatch) => {
    updateCurrentSettings((current) => ({
      ...current,
      profile: {
        ...current.profile,
        ...profilePatch,
      },
    }));
  }, [updateCurrentSettings]);

  const updateAccessibility = useCallback((accessibilityPatch) => {
    updateCurrentSettings((current) => ({
      ...current,
      accessibility: {
        ...current.accessibility,
        ...accessibilityPatch,
      },
    }));
  }, [updateCurrentSettings]);

  const resetAccessibility = useCallback(() => {
    updateCurrentSettings((current) => ({
      ...current,
      accessibility: defaultAccessibility,
    }));
  }, [updateCurrentSettings]);

  const updateNotifications = useCallback((notificationsPatch) => {
    updateCurrentSettings((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        ...notificationsPatch,
      },
    }));
  }, [updateCurrentSettings]);

  const registerPasswordUpdate = useCallback(() => {
    updateCurrentSettings((current) => ({
      ...current,
      security: {
        ...current.security,
        passwordUpdatedAt: new Date().toISOString(),
      },
    }));
  }, [updateCurrentSettings]);

  const recordAccess = useCallback((event = 'login') => {
    if (!currentUser) return;
    updateCurrentSettings((current) => ({
      ...current,
      accessLogs: [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          event,
          role: currentUser.role,
          at: new Date().toISOString(),
          userAgent: navigator.userAgent,
        },
        ...current.accessLogs,
      ].slice(0, 12),
    }));
  }, [currentUser, updateCurrentSettings]);

  useEffect(() => {
    const accessibility = settings.accessibility;
    const root = document.documentElement;
    root.dataset.contrast = accessibility.highContrast ? 'high' : 'normal';
    root.dataset.colorScheme = accessibility.colorScheme;
    root.dataset.spacing = accessibility.spacing;
    root.style.setProperty('--user-font-scale', String(accessibility.fontScale));
    root.style.setProperty('--user-interface-scale', String(accessibility.interfaceScale));

    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const resolvedTheme = accessibility.theme === 'system'
        ? mediaQuery?.matches ? 'dark' : 'light'
        : accessibility.theme;

      root.dataset.theme = resolvedTheme;
      root.dataset.themePreference = accessibility.theme;
    };

    applyTheme();

    if (accessibility.theme !== 'system' || !mediaQuery) return undefined;

    mediaQuery.addEventListener?.('change', applyTheme);
    return () => mediaQuery.removeEventListener?.('change', applyTheme);
  }, [settings.accessibility]);

  useEffect(() => {
    if (!currentUser) return;
    const accessKey = `${userKey}:${currentUser.role}`;
    if (lastAccessLogRef.current === accessKey) return;
    lastAccessLogRef.current = accessKey;
    recordAccess(currentUser.role === 'tic' ? 'tic_login' : 'login');
  }, [currentUser, recordAccess, userKey]);

  const value = useMemo(() => ({
    settings,
    updateProfile,
    updateAccessibility,
    resetAccessibility,
    updateNotifications,
    registerPasswordUpdate,
    recordAccess,
  }), [
    settings,
    updateProfile,
    updateAccessibility,
    resetAccessibility,
    updateNotifications,
    registerPasswordUpdate,
    recordAccess,
  ]);

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error('useUserSettings deve ser usado dentro de UserSettingsProvider.');
  }
  return context;
};
