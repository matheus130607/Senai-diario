export const USER_SETTINGS_STORAGE_KEY = 'senai-diario:user-settings:v1';
export const ACCESSIBILITY_SNAPSHOT_KEY = 'senai-diario:accessibility-snapshot:v1';

export const DEFAULT_ACCESSIBILITY = {
  theme: 'light',
  highContrast: false,
  colorScheme: 'senai',
  fontScale: 1,
  spacing: 'comfortable',
  interfaceScale: 1,
  focusMode: true,
  reducedMotion: false,
  keyboardShortcuts: true,
  screenReaderHints: true,
};

export const ACCESSIBILITY_OPTIONS = {
  theme: ['light', 'dark', 'system'],
  colorScheme: ['senai', 'blue', 'green', 'mono'],
  spacing: ['compact', 'comfortable', 'wide'],
};

const clampNumber = (value, min, max, fallback) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(max, Math.max(min, numberValue));
};

const chooseOption = (value, options, fallback) => (
  options.includes(value) ? value : fallback
);

export const normalizeAccessibility = (accessibility = {}) => {
  const safeAccessibility = accessibility && typeof accessibility === 'object' ? accessibility : {};

  return {
    theme: chooseOption(safeAccessibility.theme, ACCESSIBILITY_OPTIONS.theme, DEFAULT_ACCESSIBILITY.theme),
    highContrast: Boolean(safeAccessibility.highContrast),
    colorScheme: chooseOption(safeAccessibility.colorScheme, ACCESSIBILITY_OPTIONS.colorScheme, DEFAULT_ACCESSIBILITY.colorScheme),
    fontScale: clampNumber(safeAccessibility.fontScale, 0.9, 1.25, DEFAULT_ACCESSIBILITY.fontScale),
    spacing: chooseOption(safeAccessibility.spacing, ACCESSIBILITY_OPTIONS.spacing, DEFAULT_ACCESSIBILITY.spacing),
    interfaceScale: clampNumber(safeAccessibility.interfaceScale, 0.95, 1.15, DEFAULT_ACCESSIBILITY.interfaceScale),
    focusMode: safeAccessibility.focusMode !== false,
    reducedMotion: Boolean(safeAccessibility.reducedMotion),
    keyboardShortcuts: true,
    screenReaderHints: true,
  };
};

const sanitizeSettingsStore = (settingsStore) => (
  Object.fromEntries(
    Object.entries(settingsStore).map(([key, value]) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return [key, value];
      return [
        key,
        {
          ...value,
          accessibility: normalizeAccessibility(value.accessibility),
        },
      ];
    }),
  )
);

export const readStoredSettings = () => {
  try {
    const raw = localStorage.getItem(USER_SETTINGS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const sanitized = sanitizeSettingsStore(parsed);
    if (JSON.stringify(sanitized) !== JSON.stringify(parsed)) {
      localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch {
    return {};
  }
};

export const persistSettings = (settings) => {
  try {
    localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Prefer keeping the app usable over failing on storage restrictions.
  }
};

export const readAccessibilitySnapshot = () => {
  try {
    const rawSnapshot = localStorage.getItem(ACCESSIBILITY_SNAPSHOT_KEY);
    if (rawSnapshot) return normalizeAccessibility(JSON.parse(rawSnapshot));
  } catch {
    // Fall through to the settings store.
  }

  const storedSettings = readStoredSettings();
  const anonymousSettings = storedSettings.anonymous?.accessibility;
  return normalizeAccessibility(anonymousSettings);
};

export const persistAccessibilitySnapshot = (accessibility) => {
  try {
    localStorage.setItem(ACCESSIBILITY_SNAPSHOT_KEY, JSON.stringify(normalizeAccessibility(accessibility)));
  } catch {
    // localStorage may be unavailable in private or restricted contexts.
  }
};

export const resolveTheme = (theme) => {
  if (theme !== 'system') return theme;
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

export const applyAccessibilityToDocument = (accessibility, resolvedThemeOverride) => {
  if (typeof document === 'undefined') return;

  const normalized = normalizeAccessibility(accessibility);
  const root = document.documentElement;
  const resolvedTheme = resolvedThemeOverride || resolveTheme(normalized.theme);

  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = normalized.theme;
  root.dataset.contrast = normalized.highContrast ? 'high' : 'normal';
  root.dataset.colorScheme = normalized.colorScheme;
  root.dataset.spacing = normalized.spacing;
  root.dataset.focusMode = normalized.focusMode ? 'enhanced' : 'standard';
  root.dataset.reducedMotion = normalized.reducedMotion ? 'true' : 'false';
  delete root.dataset.libras;
  root.style.setProperty('--user-font-scale', String(normalized.fontScale));
  root.style.setProperty('--user-interface-scale', String(normalized.interfaceScale));
  root.style.setProperty('--user-font-size', `${(16 * normalized.fontScale * normalized.interfaceScale).toFixed(2)}px`);
};

export const applyInitialAccessibilitySnapshot = () => {
  if (typeof window === 'undefined') return;
  applyAccessibilityToDocument(readAccessibilitySnapshot());
};
