const parseBooleanEnv = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

export const isDevelopmentMode = Boolean(import.meta.env.DEV);

export const allowLegacyPasswordLogin = parseBooleanEnv(
  import.meta.env.VITE_ALLOW_LEGACY_PASSWORD_LOGIN,
  isDevelopmentMode,
);

export const showTestCredentialPanel = parseBooleanEnv(
  import.meta.env.VITE_SHOW_TEST_CREDENTIALS,
  isDevelopmentMode,
);
