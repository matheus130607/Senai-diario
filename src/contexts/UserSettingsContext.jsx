import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AuthContext } from './AuthContext';

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

const getUserKey = (currentUser) => (
  currentUser?.id || currentUser?.email || currentUser?.role || 'anonymous'
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

  const updateCurrentSettings = useCallback((updater) => {
    setAllSettings((prev) => {
      const current = mergeSettings(prev[userKey]);
      const nextForUser = typeof updater === 'function' ? updater(current) : updater;
      const next = {
        ...prev,
        [userKey]: mergeSettings(nextForUser),
      };
      persistSettings(next);
      return next;
    });
  }, [userKey]);

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
    root.dataset.theme = accessibility.theme;
    root.dataset.contrast = accessibility.highContrast ? 'high' : 'normal';
    root.dataset.colorScheme = accessibility.colorScheme;
    root.dataset.spacing = accessibility.spacing;
    root.style.setProperty('--user-font-scale', String(accessibility.fontScale));
    root.style.setProperty('--user-interface-scale', String(accessibility.interfaceScale));
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
