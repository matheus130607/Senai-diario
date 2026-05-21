import { isSupabaseConfigured, supabase } from './supabaseClient';

export const TABLES = {
  alunos: 'alunos',
  professores: 'professores',
  empresas: 'empresas',
  turmas: 'turmas',
  administradores: 'administradores',
  professoresTurmas: 'professores_turmas',
  presencas: 'presencas',
};

const REALTIME_TABLES = Object.values(TABLES);
const VALID_ATTENDANCE_STATUSES = new Set(['presente', 'falta', 'pendente']);

const ensureSupabase = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }
};

const throwIfError = (error) => {
  if (error) throw error;
};

const idToString = (value) => (value === null || value === undefined ? '' : String(value));

const emptyToNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  return value;
};

const textValue = (value) => (value === undefined || value === null ? '' : String(value));

const firstTextValue = (...values) => {
  const value = values.find((item) => item !== undefined && item !== null && item !== '');
  return textValue(value);
};

const normalizeStatus = (status) => (
  VALID_ATTENDANCE_STATUSES.has(status) ? status : 'pendente'
);

export const getTodayAttendanceDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const mapTurmaFromDb = (turma) => ({
  id: idToString(turma.id),
  nome: textValue(turma.nome),
});

const mapEmpresaFromDb = (empresa) => ({
  id: idToString(empresa.id),
  nome: textValue(empresa.nome),
  cnpj: textValue(empresa.cnpj),
  endereco: textValue(empresa.endereco),
  email: textValue(empresa.email),
  senha: firstTextValue(empresa.senha, empresa.senha_hash),
});

const mapAdministradorFromDb = (admin) => ({
  id: idToString(admin.id),
  nome: textValue(admin.nome || 'Administrador'),
  email: textValue(admin.email),
  senha: firstTextValue(admin.senha, admin.senha_hash),
});

const mapPresencaFromDb = (presenca) => ({
  id: idToString(presenca.id),
  alunoId: idToString(presenca.aluno_id ?? presenca.alunoId),
  professorId: idToString(presenca.professor_id ?? presenca.professorId),
  turmaId: idToString(presenca.turma_id ?? presenca.turmaId),
  data: textValue(presenca.data),
  status: normalizeStatus(presenca.status),
});

const mapProfessorFromDb = (professor, turmas = []) => ({
  id: idToString(professor.id),
  nome: textValue(professor.nome),
  cpf: textValue(professor.cpf),
  nif: textValue(professor.nif),
  telefone: textValue(professor.telefone),
  email: firstTextValue(professor.email, professor.email_institucional),
  senha: firstTextValue(professor.senha, professor.senha_hash),
  turmas,
});

const mapAlunoFromDb = (aluno, statusByAlunoId) => {
  const alunoId = idToString(aluno.id);

  return {
    id: alunoId,
    nome: textValue(aluno.nome),
    cpf: textValue(aluno.cpf),
    telefone: textValue(aluno.telefone),
    email: firstTextValue(aluno.email, aluno.email_institucional),
    turmaId: idToString(aluno.turma_id ?? aluno.turmaId),
    empresaId: idToString(aluno.empresa_id ?? aluno.empresaId),
    status: statusByAlunoId.get(alunoId) || normalizeStatus(aluno.status),
  };
};

const professorPayloadFromForm = (professor) => ({
  nome: textValue(professor.nome).trim(),
  cpf: textValue(professor.cpf).trim(),
  nif: textValue(professor.nif).trim(),
  telefone: textValue(professor.telefone).trim(),
  email_institucional: textValue(professor.email).trim(),
  senha_hash: textValue(professor.senha),
});

const empresaPayloadFromForm = (empresa) => ({
  nome: textValue(empresa.nome).trim(),
  email: textValue(empresa.email).trim(),
  senha_hash: textValue(empresa.senha),
});

const alunoPayloadFromForm = (aluno) => ({
  nome: textValue(aluno.nome).trim(),
  cpf: textValue(aluno.cpf).trim(),
  telefone: textValue(aluno.telefone).trim(),
  email_institucional: textValue(aluno.email).trim(),
  turma_id: emptyToNull(aluno.turmaId),
  empresa_id: emptyToNull(aluno.empresaId),
});

export const loadSupabaseData = async (attendanceDate = getTodayAttendanceDate()) => {
  ensureSupabase();

  const [
    turmasResult,
    professoresResult,
    empresasResult,
    alunosResult,
    administradoresResult,
    professoresTurmasResult,
    presencasResult,
  ] = await Promise.all([
    supabase.from(TABLES.turmas).select('*').order('nome', { ascending: true }),
    supabase.from(TABLES.professores).select('*').order('nome', { ascending: true }),
    supabase.from(TABLES.empresas).select('*').order('nome', { ascending: true }),
    supabase.from(TABLES.alunos).select('*').order('nome', { ascending: true }),
    supabase.from(TABLES.administradores).select('*').order('nome', { ascending: true }),
    supabase.from(TABLES.professoresTurmas).select('*'),
    supabase.from(TABLES.presencas).select('*').eq('data', attendanceDate),
  ]);

  [
    turmasResult,
    professoresResult,
    empresasResult,
    alunosResult,
    administradoresResult,
    professoresTurmasResult,
    presencasResult,
  ].forEach(({ error }) => throwIfError(error));

  const presencas = (presencasResult.data || []).map(mapPresencaFromDb);
  const statusByAlunoId = new Map(
    presencas.map((presenca) => [presenca.alunoId, presenca.status]),
  );

  const turmasByProfessorId = (professoresTurmasResult.data || []).reduce((acc, relation) => {
    const professorId = idToString(relation.professor_id ?? relation.professorId);
    const turmaId = idToString(relation.turma_id ?? relation.turmaId);
    if (!professorId || !turmaId) return acc;
    if (!acc[professorId]) acc[professorId] = [];
    acc[professorId].push(turmaId);
    return acc;
  }, {});

  return {
    turmas: (turmasResult.data || []).map(mapTurmaFromDb),
    professores: (professoresResult.data || []).map((professor) => (
      mapProfessorFromDb(professor, turmasByProfessorId[idToString(professor.id)] || [])
    )),
    empresas: (empresasResult.data || []).map(mapEmpresaFromDb),
    alunos: (alunosResult.data || []).map((aluno) => mapAlunoFromDb(aluno, statusByAlunoId)),
    administradores: (administradoresResult.data || []).map(mapAdministradorFromDb),
    presencas,
    config: {
      provider: 'supabase',
      attendanceDate,
    },
  };
};

export const subscribeToSupabaseData = (onChange, onError) => {
  if (!isSupabaseConfigured || !supabase) return () => {};

  const channel = supabase.channel('senai-diario-relational-data');

  REALTIME_TABLES.forEach((table) => {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
      },
      () => onChange?.(),
    );
  });

  channel.subscribe((status) => {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      onError?.(new Error('Falha ao assinar atualizacoes em tempo real do Supabase.'));
    }
  });

  return () => {
    supabase.removeChannel(channel);
  };
};

export const saveTurmaRecord = async (turma) => {
  ensureSupabase();

  const values = { nome: textValue(turma.nome).trim() };
  const query = turma.id
    ? supabase.from(TABLES.turmas).update(values).eq('id', turma.id)
    : supabase.from(TABLES.turmas).insert(values);

  const { data, error } = await query.select('*').single();
  throwIfError(error);
  return mapTurmaFromDb(data);
};

export const deleteTurmaRecord = async (id) => {
  ensureSupabase();

  const { error: alunosError } = await supabase
    .from(TABLES.alunos)
    .update({ turma_id: null })
    .eq('turma_id', id);
  throwIfError(alunosError);

  const { error: relationsError } = await supabase
    .from(TABLES.professoresTurmas)
    .delete()
    .eq('turma_id', id);
  throwIfError(relationsError);

  const { error: presencasError } = await supabase
    .from(TABLES.presencas)
    .update({ turma_id: null })
    .eq('turma_id', id);
  throwIfError(presencasError);

  const { error } = await supabase
    .from(TABLES.turmas)
    .delete()
    .eq('id', id);
  throwIfError(error);
};

const replaceProfessorTurmas = async (professorId, turmaIds = []) => {
  const { error: deleteError } = await supabase
    .from(TABLES.professoresTurmas)
    .delete()
    .eq('professor_id', professorId);
  throwIfError(deleteError);

  const uniqueTurmaIds = [...new Set(turmaIds.filter(Boolean))];
  if (uniqueTurmaIds.length === 0) return;

  const rows = uniqueTurmaIds.map((turmaId) => ({
    professor_id: professorId,
    turma_id: turmaId,
  }));

  const { error: insertError } = await supabase
    .from(TABLES.professoresTurmas)
    .insert(rows);
  throwIfError(insertError);
};

export const saveProfessorRecord = async (professor) => {
  ensureSupabase();

  const values = professorPayloadFromForm(professor);
  const query = professor.id
    ? supabase.from(TABLES.professores).update(values).eq('id', professor.id)
    : supabase.from(TABLES.professores).insert(values);

  const { data, error } = await query.select('*').single();
  throwIfError(error);

  const turmas = Array.isArray(professor.turmas) ? professor.turmas : [];
  await replaceProfessorTurmas(data.id, turmas);

  return mapProfessorFromDb(data, turmas);
};

export const deleteProfessorRecord = async (id) => {
  ensureSupabase();

  const { error: relationsError } = await supabase
    .from(TABLES.professoresTurmas)
    .delete()
    .eq('professor_id', id);
  throwIfError(relationsError);

  const { error: presencasError } = await supabase
    .from(TABLES.presencas)
    .update({ professor_id: null })
    .eq('professor_id', id);
  throwIfError(presencasError);

  const { error } = await supabase
    .from(TABLES.professores)
    .delete()
    .eq('id', id);
  throwIfError(error);
};

export const saveEmpresaRecord = async (empresa) => {
  ensureSupabase();

  const values = empresaPayloadFromForm(empresa);
  const query = empresa.id
    ? supabase.from(TABLES.empresas).update(values).eq('id', empresa.id)
    : supabase.from(TABLES.empresas).insert(values);

  const { data, error } = await query.select('*').single();
  throwIfError(error);
  return mapEmpresaFromDb(data);
};

export const deleteEmpresaRecord = async (id) => {
  ensureSupabase();

  const { error: alunosError } = await supabase
    .from(TABLES.alunos)
    .update({ empresa_id: null })
    .eq('empresa_id', id);
  throwIfError(alunosError);

  const { error } = await supabase
    .from(TABLES.empresas)
    .delete()
    .eq('id', id);
  throwIfError(error);
};

export const saveAlunoRecord = async (aluno) => {
  ensureSupabase();

  const values = alunoPayloadFromForm(aluno);
  const query = aluno.id
    ? supabase.from(TABLES.alunos).update(values).eq('id', aluno.id)
    : supabase.from(TABLES.alunos).insert(values);

  const { data, error } = await query.select('*').single();
  throwIfError(error);
  return mapAlunoFromDb(data, new Map([[idToString(data.id), aluno.status || 'pendente']]));
};

export const deleteAlunoRecord = async (id) => {
  ensureSupabase();

  const { error: presencasError } = await supabase
    .from(TABLES.presencas)
    .delete()
    .eq('aluno_id', id);
  throwIfError(presencasError);

  const { error } = await supabase
    .from(TABLES.alunos)
    .delete()
    .eq('id', id);
  throwIfError(error);
};

export const saveAttendanceRecords = async ({
  alunos = [],
  turmaId,
  professorId,
  date = getTodayAttendanceDate(),
}) => {
  ensureSupabase();

  const rows = alunos
    .filter((aluno) => aluno?.id)
    .map((aluno) => ({
      aluno_id: aluno.id,
      professor_id: emptyToNull(professorId),
      turma_id: emptyToNull(turmaId || aluno.turmaId),
      data: date,
      status: normalizeStatus(aluno.status),
    }));

  if (rows.length === 0) return [];

  const upsertResult = await supabase
    .from(TABLES.presencas)
    .upsert(rows, { onConflict: 'aluno_id,data' })
    .select('*');

  if (!upsertResult.error) {
    return (upsertResult.data || []).map(mapPresencaFromDb);
  }

  const alunoIds = rows.map((row) => row.aluno_id);
  const { error: deleteError } = await supabase
    .from(TABLES.presencas)
    .delete()
    .eq('data', date)
    .in('aluno_id', alunoIds);
  throwIfError(deleteError);

  const { data, error } = await supabase
    .from(TABLES.presencas)
    .insert(rows)
    .select('*');
  throwIfError(error);

  return (data || []).map(mapPresencaFromDb);
};
