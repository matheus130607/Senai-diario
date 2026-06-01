import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ENV_FILES = ['.env.local', '.env'];

const readEnvFile = (filePath) => {
  if (!existsSync(filePath)) return {};

  return readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return acc;
      const [key, ...valueParts] = trimmed.split('=');
      if (!key) return acc;
      acc[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      return acc;
    }, {});
};

const env = {
  ...ENV_FILES.map((file) => readEnvFile(resolve(file))).reduce((acc, item) => ({ ...acc, ...item }), {}),
  ...process.env,
};

const required = (key) => {
  const value = env[key];
  if (!value) throw new Error(`Variavel obrigatoria ausente: ${key}`);
  return value;
};

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const defaultPassword = env.SEED_DEFAULT_PASSWORD;
const ticEmail = (env.SEED_TIC_EMAIL || 'tic@senaisp.edu.br').toLowerCase();
const ticPassword = env.SEED_TIC_PASSWORD || defaultPassword;

if (!supabaseUrl) {
  throw new Error('Defina SUPABASE_URL ou VITE_SUPABASE_URL.');
}

if (!serviceRoleKey) {
  throw new Error('Defina SUPABASE_SERVICE_ROLE_KEY. Nunca use essa chave no frontend.');
}

if (!defaultPassword || defaultPassword.length < 8) {
  throw new Error('Defina SEED_DEFAULT_PASSWORD com pelo menos 8 caracteres.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const throwIfError = (label, error) => {
  if (error) throw new Error(`${label}: ${error.message}`);
};

const listAllAuthUsers = async () => {
  const users = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    throwIfError('Falha ao listar usuarios Auth', error);
    users.push(...(data?.users || []));
    if (!data?.users || data.users.length < perPage) break;
    page += 1;
  }

  return users;
};

const ensureAuthUser = async ({ email, password, role, nome }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;

  const existing = authUsersByEmail.get(normalizedEmail);
  const userMetadata = { role, nome };

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        ...(existing.user_metadata || {}),
        ...userMetadata,
      },
    });
    throwIfError(`Falha ao atualizar usuario Auth ${normalizedEmail}`, error);
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });
  throwIfError(`Falha ao criar usuario Auth ${normalizedEmail}`, error);
  authUsersByEmail.set(normalizedEmail, data.user);
  return data.user;
};

const loadRows = async (table, columns) => {
  const { data, error } = await supabase.from(table).select(columns);
  throwIfError(`Falha ao carregar ${table}`, error);
  return data || [];
};

const authUsers = await listAllAuthUsers();
const authUsersByEmail = new Map(authUsers.map((user) => [String(user.email || '').toLowerCase(), user]));
const profileRows = [];

const administradores = await loadRows('administradores', 'id,nome,email,perfil');
const professores = await loadRows('professores', 'id,nome,email_institucional');
const empresas = await loadRows('empresas', 'id,nome,email');

for (const admin of administradores) {
  if (!admin.email) continue;
  const role = admin.perfil === 'secretaria' ? 'secretaria' : 'coordenacao';
  const user = await ensureAuthUser({
    email: admin.email,
    password: defaultPassword,
    role,
    nome: admin.nome || role,
  });

  if (user) {
    profileRows.push({
      auth_user_id: user.id,
      role,
      nome: admin.nome || role,
      email: String(admin.email).toLowerCase(),
      status: 'active',
      related_professor_id: null,
      related_empresa_id: null,
      updated_at: new Date().toISOString(),
    });
  }
}

for (const professor of professores) {
  if (!professor.email_institucional) continue;
  const user = await ensureAuthUser({
    email: professor.email_institucional,
    password: defaultPassword,
    role: 'professor',
    nome: professor.nome || 'Professor',
  });

  if (user) {
    profileRows.push({
      auth_user_id: user.id,
      role: 'professor',
      nome: professor.nome || 'Professor',
      email: String(professor.email_institucional).toLowerCase(),
      status: 'active',
      related_professor_id: professor.id,
      related_empresa_id: null,
      updated_at: new Date().toISOString(),
    });
  }
}

for (const empresa of empresas) {
  if (!empresa.email) continue;
  const user = await ensureAuthUser({
    email: empresa.email,
    password: defaultPassword,
    role: 'empresa',
    nome: empresa.nome || 'Empresa parceira',
  });

  if (user) {
    profileRows.push({
      auth_user_id: user.id,
      role: 'empresa',
      nome: empresa.nome || 'Empresa parceira',
      email: String(empresa.email).toLowerCase(),
      status: 'active',
      related_professor_id: null,
      related_empresa_id: empresa.id,
      updated_at: new Date().toISOString(),
    });
  }
}

if (ticPassword) {
  const user = await ensureAuthUser({
    email: ticEmail,
    password: ticPassword,
    role: 'tic',
    nome: 'TIC Super Admin',
  });

  if (user) {
    profileRows.push({
      auth_user_id: user.id,
      role: 'tic',
      nome: 'TIC Super Admin',
      email: ticEmail,
      status: 'active',
      related_professor_id: null,
      related_empresa_id: null,
      updated_at: new Date().toISOString(),
    });
  }
}

if (profileRows.length > 0) {
  const { error } = await supabase
    .from('user_profiles')
    .upsert(profileRows, { onConflict: 'email' });
  throwIfError('Falha ao salvar user_profiles', error);
}

console.log(`Seed concluido. Perfis sincronizados: ${profileRows.length}.`);
