import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

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
  ...['.env.local', '.env'].map((file) => readEnvFile(resolve(file))).reduce((acc, item) => ({ ...acc, ...item }), {}),
  ...process.env,
};

const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
const defaultPassword = env.TEST_DEFAULT_PASSWORD || env.SEED_DEFAULT_PASSWORD || 'senha_teste_123';

if (!supabaseUrl || !anonKey) {
  throw new Error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para validar RLS.');
}

const credentials = {
  coordenacao: {
    email: env.TEST_COORDENACAO_EMAIL || 'admin@senaisp.edu.br',
    password: env.TEST_COORDENACAO_PASSWORD || defaultPassword,
  },
  secretaria: {
    email: env.TEST_SECRETARIA_EMAIL || 'secretaria@senaisp.edu.br',
    password: env.TEST_SECRETARIA_PASSWORD || defaultPassword,
  },
  professor: {
    email: env.TEST_PROFESSOR_EMAIL || 'carlos.almeida@senaisp.edu.br',
    password: env.TEST_PROFESSOR_PASSWORD || defaultPassword,
  },
  empresa: {
    email: env.TEST_EMPRESA_EMAIL || 'contato@techsolutions.com.br',
    password: env.TEST_EMPRESA_PASSWORD || defaultPassword,
  },
  tic: {
    email: env.TEST_TIC_EMAIL || env.SEED_TIC_EMAIL || 'tic@senaisp.edu.br',
    password: env.TEST_TIC_PASSWORD || env.SEED_TIC_PASSWORD || env.VITE_TIC_ACCESS_TOKEN || defaultPassword,
  },
};

const createSupabaseClient = () => createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const failIfError = (label, error) => {
  if (error) throw new Error(`${label}: ${error.message}`);
};

const loginAs = async (role) => {
  const client = createSupabaseClient();
  const credential = credentials[role];
  const { data, error } = await client.auth.signInWithPassword(credential);
  failIfError(`Login ${role}`, error);
  assert(data?.user, `Login ${role} nao retornou usuario Auth.`);

  const { data: profile, error: profileError } = await client.rpc('get_current_user_profile');
  failIfError(`Perfil ${role}`, profileError);
  assert(profile?.role === role, `Perfil esperado ${role}, recebido ${profile?.role || 'nenhum'}.`);

  return { client, profile };
};

const expectNoRowsForAnon = async () => {
  const client = createSupabaseClient();
  const { data, error } = await client.from('administradores').select('id').limit(1);
  failIfError('Consulta anonima administradores', error);
  assert((data || []).length === 0, 'Anon nao deve ler administradores.');
};

const countRows = async (client, table) => {
  const { count, error } = await client.from(table).select('id', { count: 'exact', head: true });
  failIfError(`Contagem ${table}`, error);
  return count || 0;
};

const expectSecretariaCrud = async (client) => {
  const payload = {
    nome: `Teste RLS Secretaria ${Date.now()}`,
    status: 'Ativo',
    quantidade_aulas: 1,
  };

  const { data, error } = await client.from('turmas').insert(payload).select('id').single();
  failIfError('Secretaria deve criar turma', error);
  assert(data?.id, 'Secretaria criou turma sem id.');

  const { error: updateError } = await client
    .from('turmas')
    .update({ status: 'Pausado' })
    .eq('id', data.id);
  failIfError('Secretaria deve editar turma', updateError);

  const { error: deleteError } = await client.from('turmas').delete().eq('id', data.id);
  failIfError('Secretaria deve excluir turma', deleteError);
};

const expectBlockedInsert = async (client, role) => {
  const payload = {
    nome: `Teste RLS bloqueado ${role} ${Date.now()}`,
    status: 'Ativo',
    quantidade_aulas: 1,
  };

  const { data, error } = await client.from('turmas').insert(payload).select('id').maybeSingle();
  if (!error && data?.id) {
    await client.from('turmas').delete().eq('id', data.id);
    throw new Error(`${role} nao deve criar turma.`);
  }
};

const run = async () => {
  await expectNoRowsForAnon();

  const sessions = {
    coordenacao: await loginAs('coordenacao'),
    secretaria: await loginAs('secretaria'),
    professor: await loginAs('professor'),
    empresa: await loginAs('empresa'),
    tic: await loginAs('tic'),
  };

  await expectSecretariaCrud(sessions.secretaria.client);
  await expectBlockedInsert(sessions.coordenacao.client, 'coordenacao');
  await expectBlockedInsert(sessions.professor.client, 'professor');
  await expectBlockedInsert(sessions.empresa.client, 'empresa');

  assert(await countRows(sessions.coordenacao.client, 'alunos') >= 0, 'Coordenacao deve ler alunos.');
  assert(await countRows(sessions.secretaria.client, 'professores') >= 0, 'Secretaria deve ler professores.');
  assert(await countRows(sessions.tic.client, 'user_profiles') >= 1, 'TIC deve ler user_profiles.');

  assert(await countRows(sessions.professor.client, 'administradores') === 0, 'Professor nao deve ler administradores.');
  assert(await countRows(sessions.empresa.client, 'professores') === 0, 'Empresa nao deve ler professores.');

  await Promise.all(Object.values(sessions).map(({ client }) => client.auth.signOut()));
  console.log('Validacao Supabase Auth/RLS concluida com sucesso.');
};

run().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
