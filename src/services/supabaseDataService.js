import { isSupabaseConfigured, supabase } from './supabaseClient';
import { allowLegacyPasswordLogin } from '../utils/runtimeFlags';

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
const OPTIONAL_ATTENDANCE_COLUMNS = ['atraso', 'observacao', 'justificativa', 'termo', 'periodo'];
const PRESENCE_HISTORY_DAYS = 180;
const PRESENCE_HISTORY_LIMIT = 5000;

const ensureSupabase = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }
};

const throwIfError = (error) => {
  if (error) throw error;
};

const isMissingRelationError = (error, relation) => {
  const message = String(error?.message || '').toLowerCase();
  return message.includes(relation)
    || message.includes('schema cache')
    || message.includes('does not exist')
    || message.includes('could not find the table');
};

const writeAuditLog = (action, entity, entityId, metadata = {}) => {
  if (!isSupabaseConfigured || !supabase) return;

  supabase
    .from('audit_logs')
    .insert({
      action,
      entity,
      entity_id: idToString(entityId),
      metadata,
    })
    .then(({ error }) => {
      if (error && !isMissingRelationError(error, 'audit_logs')) {
        console.error('Erro ao registrar auditoria:', error);
      }
    });
};

const isStatusConstraintError = (error) => /status|check constraint/i.test(error?.message || '');

const isMissingOptionalAttendanceColumnError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return OPTIONAL_ATTENDANCE_COLUMNS.some((column) => (
    message.includes(column)
    && (message.includes('column') || message.includes('schema cache') || message.includes('does not exist'))
  ));
};

const idToString = (value) => (value === null || value === undefined ? '' : String(value));

const emptyToNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  return value;
};

const emptyToDefault = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  return value;
};

const textValue = (value) => (value === undefined || value === null ? '' : String(value));

const firstTextValue = (...values) => {
  const value = values.find((item) => item !== undefined && item !== null && item !== '');
  return textValue(value);
};

const normalizeStatus = (status) => {
  const normalized = textValue(status).trim().toLowerCase();
  if (normalized === 'faltou') return 'falta';
  return VALID_ATTENDANCE_STATUSES.has(normalized) ? normalized : 'pendente';
};

const statusToDbTitle = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized === 'presente') return 'Presente';
  if (normalized === 'falta') return 'Faltou';
  return 'Pendente';
};

const parseDateOnly = (value) => {
  const [year, month, day] = textValue(value).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const getTodayDateOnly = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysToDateKey = (value, amount) => {
  const parsed = parseDateOnly(value) || getTodayDateOnly();
  parsed.setDate(parsed.getDate() + amount);
  return toDateKey(parsed);
};

const resolveTurmaStatus = (status, dataFim) => {
  const endDate = parseDateOnly(dataFim);
  if (endDate && endDate < getTodayDateOnly()) return 'Concluido';
  return textValue(status || 'Ativo');
};

export const getTodayAttendanceDate = () => {
  return toDateKey(new Date());
};

const mapTurmaFromDb = (turma) => {
  const dataFim = textValue(turma.data_fim ?? turma.dataFim);

  return {
    id: idToString(turma.id),
    nome: textValue(turma.nome),
    dataInicio: textValue(turma.data_inicio ?? turma.dataInicio),
    dataFim,
    status: resolveTurmaStatus(turma.status, dataFim),
    quantidadeAulas: turma.quantidade_aulas ?? turma.quantidadeAulas ?? null,
  };
};

const mapEmpresaFromDb = (empresa) => ({
  id: idToString(empresa.id),
  nome: textValue(empresa.nome),
  cnpj: textValue(empresa.cnpj),
  endereco: textValue(empresa.endereco),
  email: textValue(empresa.email),
});

const mapAdministradorFromDb = (admin) => ({
  id: idToString(admin.id),
  nome: textValue(admin.nome || 'Administrador'),
  email: textValue(admin.email),
  perfil: textValue(admin.perfil || admin.role || 'coordenacao'),
});

const mapPresencaFromDb = (presenca) => ({
  id: idToString(presenca.id),
  alunoId: idToString(presenca.aluno_id ?? presenca.alunoId),
  professorId: idToString(presenca.professor_id ?? presenca.professorId),
  turmaId: idToString(presenca.turma_id ?? presenca.turmaId),
  data: textValue(presenca.data),
  status: normalizeStatus(presenca.status),
  atraso: Boolean(presenca.atraso),
  observacao: textValue(presenca.observacao),
  justificativa: textValue(presenca.justificativa),
  termo: textValue(presenca.termo),
  periodo: textValue(presenca.periodo),
});

const mapProfessorFromDb = (professor, turmas = []) => ({
  id: idToString(professor.id),
  nome: textValue(professor.nome),
  cpf: textValue(professor.cpf),
  nif: textValue(professor.nif),
  telefone: textValue(professor.telefone),
  email: firstTextValue(professor.email, professor.email_institucional),
  turmas,
});

const sanitizeProfessor = (professor, turmas = []) => {
  const mapped = mapProfessorFromDb(professor, turmas);
  delete mapped.senha;
  return mapped;
};

const sanitizeEmpresa = (empresa) => {
  const mapped = mapEmpresaFromDb(empresa);
  delete mapped.senha;
  return mapped;
};

const sanitizeAdministrador = (admin) => {
  const mapped = mapAdministradorFromDb(admin);
  delete mapped.senha;
  return {
    ...mapped,
    role: admin.perfil || admin.role || 'coordenacao',
  };
};

const mapAlunoFromDb = (aluno, presencaByAlunoId) => {
  const alunoId = idToString(aluno.id);
  const selectedPresenca = presencaByAlunoId.get(alunoId);
  const selectedStatus = typeof selectedPresenca === 'string' ? selectedPresenca : selectedPresenca?.status;

  return {
    id: alunoId,
    nome: textValue(aluno.nome),
    cpf: textValue(aluno.cpf),
    telefone: textValue(aluno.telefone),
    email: firstTextValue(aluno.email, aluno.email_institucional),
    turmaId: idToString(aluno.turma_id ?? aluno.turmaId),
    empresaId: idToString(aluno.empresa_id ?? aluno.empresaId),
    status: selectedStatus || normalizeStatus(aluno.status),
    observacao: textValue(selectedPresenca?.observacao),
    justificativa: textValue(selectedPresenca?.justificativa),
  };
};

const professorPayloadFromForm = (professor) => ({
  nome: textValue(professor.nome).trim(),
  cpf: textValue(professor.cpf).trim(),
  nif: textValue(professor.nif).trim(),
  telefone: textValue(professor.telefone).trim(),
  email_institucional: textValue(professor.email).trim(),
  ...(textValue(professor.senha).trim() ? { senha_hash: textValue(professor.senha) } : {}),
});

const turmaPayloadFromForm = (turma) => ({
  nome: textValue(turma.nome).trim(),
  data_inicio: emptyToNull(turma.dataInicio),
  data_fim: emptyToNull(turma.dataFim),
  status: emptyToNull(resolveTurmaStatus(turma.status, turma.dataFim)),
  quantidade_aulas: turma.quantidadeAulas ? Number(turma.quantidadeAulas) : null,
});

const empresaPayloadFromForm = (empresa) => ({
  nome: textValue(empresa.nome).trim(),
  cnpj: textValue(empresa.cnpj).trim(),
  endereco: textValue(empresa.endereco).trim(),
  email: textValue(empresa.email).trim(),
  ...(textValue(empresa.senha).trim() ? { senha_hash: textValue(empresa.senha) } : {}),
});

const alunoPayloadFromForm = (aluno) => ({
  nome: textValue(aluno.nome).trim(),
  cpf: textValue(aluno.cpf).trim(),
  telefone: textValue(aluno.telefone).trim(),
  email_institucional: textValue(aluno.email).trim(),
  turma_id: emptyToNull(aluno.turmaId),
  empresa_id: emptyToNull(aluno.empresaId),
});

const loadUserProfile = async (authUserId, email) => {
  const { data: claimedProfile, error: rpcError } = await supabase
    .rpc('get_current_user_profile');

  if (!rpcError && claimedProfile) return claimedProfile;
  if (rpcError && !isMissingRelationError(rpcError, 'get_current_user_profile')) {
    console.error('Erro ao vincular perfil Auth:', rpcError);
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .or(`auth_user_id.eq.${authUserId},email.eq.${email}`)
    .maybeSingle();

  if (error) {
    const message = String(error.message || '').toLowerCase();
    if (message.includes('user_profiles') || message.includes('schema cache') || message.includes('does not exist')) {
      return null;
    }
    throw error;
  }

  return data;
};

const hydrateAuthenticatedUser = async (profile, fallbackEmail) => {
  const role = textValue(profile?.role).trim().toLowerCase();
  const email = firstTextValue(profile?.email, fallbackEmail).trim().toLowerCase();

  if (role === 'professor') {
    const { data: professor, error } = await supabase
      .from(TABLES.professores)
      .select('*')
      .eq('email_institucional', email)
      .maybeSingle();
    throwIfError(error);

    if (!professor) {
      return {
        role,
        profileId: idToString(profile.id),
        id: idToString(profile.id || profile.auth_user_id),
        nome: textValue(profile.nome || 'Professor'),
        email,
        turmas: [],
      };
    }

    const { data: relations, error: relationsError } = await supabase
      .from(TABLES.professoresTurmas)
      .select('turma_id')
      .eq('professor_id', professor.id);
    throwIfError(relationsError);

    const turmas = (relations || []).map((relation) => idToString(relation.turma_id)).filter(Boolean);
    return { role, profileId: idToString(profile.id), ...sanitizeProfessor(professor, turmas) };
  }

  if (role === 'empresa') {
    const { data: empresa, error } = await supabase
      .from(TABLES.empresas)
      .select('*')
      .eq('email', email)
      .maybeSingle();
    throwIfError(error);

    if (!empresa) {
      return {
        role,
        profileId: idToString(profile.id),
        id: idToString(profile.id || profile.auth_user_id),
        nome: textValue(profile.nome || 'Empresa Parceira'),
        email,
      };
    }

    return { role, profileId: idToString(profile.id), ...sanitizeEmpresa(empresa) };
  }

  return {
    role,
    profileId: idToString(profile.id),
    id: idToString(profile.id || profile.auth_user_id),
    nome: textValue(profile.nome || (role === 'secretaria' ? 'Secretaria' : 'Coordenação')),
    email,
  };
};

const loadPresencasForWindow = async (attendanceDate, historyDays = PRESENCE_HISTORY_DAYS) => {
  const endDate = attendanceDate || getTodayAttendanceDate();
  const startDate = addDaysToDateKey(endDate, -Math.max(1, Number(historyDays) || PRESENCE_HISTORY_DAYS));

  const { data, error } = await supabase
    .from(TABLES.presencas)
    .select('*')
    .gte('data', startDate)
    .lte('data', endDate)
    .order('data', { ascending: false })
    .limit(PRESENCE_HISTORY_LIMIT);

  throwIfError(error);

  return {
    startDate,
    endDate,
    limit: PRESENCE_HISTORY_LIMIT,
    rows: (data || []).map(mapPresencaFromDb),
  };
};

export const loadSupabaseData = async (attendanceDate = getTodayAttendanceDate(), options = {}) => {
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
    loadPresencasForWindow(attendanceDate, options.presenceHistoryDays),
  ]);

  [
    turmasResult,
    professoresResult,
    empresasResult,
    alunosResult,
    administradoresResult,
    professoresTurmasResult,
  ].forEach(({ error }) => throwIfError(error));

  const presencas = presencasResult.rows;
  const selectedDatePresencas = presencas.filter((presenca) => presenca.data === attendanceDate);
  const presencaByAlunoId = new Map(
    selectedDatePresencas.map((presenca) => [presenca.alunoId, presenca]),
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
    alunos: (alunosResult.data || []).map((aluno) => mapAlunoFromDb(aluno, presencaByAlunoId)),
    administradores: (administradoresResult.data || []).map(mapAdministradorFromDb),
    presencas,
    config: {
      provider: 'supabase',
      attendanceDate,
      presenceHistoryStart: presencasResult.startDate,
      presenceHistoryEnd: presencasResult.endDate,
      presenceHistoryLimit: presencasResult.limit,
    },
  };
};

export const authenticateSupabaseUser = async ({ role, email, password }) => {
  ensureSupabase();

  const normalizedRole = textValue(role).trim().toLowerCase() === 'admin'
    ? 'coordenacao'
    : textValue(role).trim().toLowerCase();
  const normalizedEmail = textValue(email).trim().toLowerCase();
  const normalizedPassword = textValue(password).trim();

  if (!normalizedEmail || !normalizedPassword) {
    throw new Error('Informe e-mail e senha.');
  }

  const authResult = await supabase.auth?.signInWithPassword?.({
    email: normalizedEmail,
    password: normalizedPassword,
  });

  if (authResult && !authResult.error && authResult.data?.user) {
    const profile = await loadUserProfile(authResult.data.user.id, normalizedEmail);
    const profileRole = textValue(profile?.role).trim().toLowerCase();

    if (profile && profile.status !== 'inactive' && profileRole === normalizedRole) {
      return hydrateAuthenticatedUser(profile, normalizedEmail);
    }

    if (profile && profileRole !== normalizedRole) {
      await supabase.auth.signOut?.();
      throw new Error('Esta conta não possui permissão para o perfil selecionado.');
    }

    await supabase.auth.signOut?.();
    if (!allowLegacyPasswordLogin) {
      throw new Error('Conta autenticada, mas sem perfil ativo vinculado em user_profiles.');
    }
  } else if (!allowLegacyPasswordLogin) {
    throw new Error('E-mail ou senha incorretos no Supabase Auth.');
  }

  const tableByRole = {
    professor: TABLES.professores,
    empresa: TABLES.empresas,
    coordenacao: TABLES.administradores,
    secretaria: TABLES.administradores,
  };

  const emailColumnByRole = {
    professor: 'email_institucional',
    empresa: 'email',
    coordenacao: 'email',
    secretaria: 'email',
  };

  const table = tableByRole[normalizedRole];
  const emailColumn = emailColumnByRole[normalizedRole];

  if (!table || !emailColumn) {
    throw new Error('Perfil de login invalido.');
  }

  const { data: user, error } = await supabase
    .from(table)
    .select('*')
    .eq(emailColumn, normalizedEmail)
    .maybeSingle();

  throwIfError(error);

  const storedPassword = firstTextValue(user?.senha_hash, user?.senha);
  if (!user || storedPassword !== normalizedPassword) {
    throw new Error('E-mail ou senha incorretos.');
  }

  if (normalizedRole === 'professor') {
    const { data: relations, error: relationsError } = await supabase
      .from(TABLES.professoresTurmas)
      .select('turma_id')
      .eq('professor_id', user.id);

    throwIfError(relationsError);

    const turmas = (relations || []).map((relation) => idToString(relation.turma_id)).filter(Boolean);
    return { role: 'professor', ...sanitizeProfessor(user, turmas) };
  }

  if (normalizedRole === 'empresa') {
    return { role: 'empresa', ...sanitizeEmpresa(user) };
  }

  const admin = sanitizeAdministrador(user);
  if (admin.role !== normalizedRole) {
    throw new Error('Esta conta não possui permissão para o perfil selecionado.');
  }

  return {
    role: admin.role,
    id: admin.id,
    nome: admin.nome || 'Administrador',
    email: admin.email,
  };
};

export const updateSupabasePassword = async ({ currentPassword, nextPassword, email }) => {
  ensureSupabase();

  const normalizedEmail = textValue(email).trim().toLowerCase();
  const current = textValue(currentPassword).trim();
  const next = textValue(nextPassword).trim();

  if (!next || next.length < 6) {
    throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
  }

  if (current && normalizedEmail) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: current,
    });
    if (signInError) throw new Error('Senha atual incorreta.');
  }

  const { error } = await supabase.auth.updateUser({ password: next });
  throwIfError(error);
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

  const values = turmaPayloadFromForm(turma);
  const query = turma.id
    ? supabase.from(TABLES.turmas).update(values).eq('id', turma.id)
    : supabase.from(TABLES.turmas).insert(values);

  const { data, error } = await query.select('*').single();
  throwIfError(error);
  writeAuditLog(turma.id ? 'turma_update' : 'turma_create', TABLES.turmas, data.id, { nome: data.nome });
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
  writeAuditLog('turma_delete', TABLES.turmas, id);
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

  writeAuditLog(professor.id ? 'professor_update' : 'professor_create', TABLES.professores, data.id, { turmas });
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
  writeAuditLog('professor_delete', TABLES.professores, id);
};

export const saveEmpresaRecord = async (empresa) => {
  ensureSupabase();

  const values = empresaPayloadFromForm(empresa);
  const query = empresa.id
    ? supabase.from(TABLES.empresas).update(values).eq('id', empresa.id)
    : supabase.from(TABLES.empresas).insert(values);

  const { data, error } = await query.select('*').single();
  throwIfError(error);
  writeAuditLog(empresa.id ? 'empresa_update' : 'empresa_create', TABLES.empresas, data.id, { nome: data.nome });
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
  writeAuditLog('empresa_delete', TABLES.empresas, id);
};

export const saveAlunoRecord = async (aluno) => {
  ensureSupabase();

  const values = alunoPayloadFromForm(aluno);
  const query = aluno.id
    ? supabase.from(TABLES.alunos).update(values).eq('id', aluno.id)
    : supabase.from(TABLES.alunos).insert(values);

  const { data, error } = await query.select('*').single();
  throwIfError(error);
  writeAuditLog(aluno.id ? 'aluno_update' : 'aluno_create', TABLES.alunos, data.id, {
    turmaId: aluno.turmaId || '',
    empresaId: aluno.empresaId || '',
  });
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
  writeAuditLog('aluno_delete', TABLES.alunos, id);
};

export const saveAttendanceRecords = async ({
  alunos = [],
  turmaId,
  professorId,
  date = getTodayAttendanceDate(),
}) => {
  ensureSupabase();

  const buildRows = (formatStatus = normalizeStatus, includeOptionalColumns = true) => alunos
    .filter((aluno) => aluno?.id)
    .filter((aluno) => normalizeStatus(aluno.status) !== 'pendente')
    .map((aluno) => {
      const row = {
        aluno_id: aluno.id,
        professor_id: emptyToNull(professorId),
        turma_id: emptyToNull(turmaId || aluno.turmaId),
        data: date,
        status: formatStatus(aluno.status),
        aluno: emptyToDefault(aluno.nome, 'Aluno sem nome'),
        email: textValue(aluno.email),
        turma: textValue(aluno.turmaNome),
        empresa: textValue(aluno.empresaNome),
        aula_numero: aluno.aulaNumero || 1,
        total_aulas_dia: aluno.totalAulasDia || 1,
      };

      if (includeOptionalColumns) {
        row.atraso = Boolean(aluno.atraso);
        row.observacao = textValue(aluno.observacao);
        row.justificativa = textValue(aluno.justificativa);
        row.termo = textValue(aluno.termo);
        row.periodo = textValue(aluno.periodo);
      }

      return row;
    });

  const rows = buildRows();
  if (rows.length === 0) return [];

  const persistWithFallback = async (persistRows, includeOptionalColumns = true) => {
    let result = await persistRows(buildRows(normalizeStatus, includeOptionalColumns));

    if (!result.error) return result;

    if (isStatusConstraintError(result.error)) {
      result = await persistRows(buildRows(statusToDbTitle, includeOptionalColumns));
      if (!result.error) return result;
    }

    if (includeOptionalColumns && isMissingOptionalAttendanceColumnError(result.error)) {
      return persistWithFallback(persistRows, false);
    }

    return result;
  };

  const upsertAttendance = async (values) => (
    supabase
      .from(TABLES.presencas)
      .upsert(values, { onConflict: 'aluno_id,data' })
      .select('*')
  );

  const upsertResult = await persistWithFallback(upsertAttendance);

  if (!upsertResult.error) {
    writeAuditLog('presencas_upsert', TABLES.presencas, turmaId || 'sem_turma', { date, total: rows.length });
    return (upsertResult.data || []).map(mapPresencaFromDb);
  }

  const alunoIds = rows.map((row) => row.aluno_id);
  const { error: deleteError } = await supabase
    .from(TABLES.presencas)
    .delete()
    .eq('data', date)
    .in('aluno_id', alunoIds);
  throwIfError(deleteError);

  const insertResult = await persistWithFallback((values) => (
    supabase
      .from(TABLES.presencas)
      .insert(values)
      .select('*')
  ));

  throwIfError(insertResult.error);

  writeAuditLog('presencas_insert', TABLES.presencas, turmaId || 'sem_turma', { date, total: rows.length });
  return (insertResult.data || []).map(mapPresencaFromDb);
};

export const loadAttendanceRange = async ({ startDate, endDate, alunoIds = [] }) => {
  ensureSupabase();

  if (!startDate || !endDate || alunoIds.length === 0) return [];

  const { data, error } = await supabase
    .from(TABLES.presencas)
    .select('*')
    .gte('data', startDate)
    .lte('data', endDate)
    .in('aluno_id', alunoIds)
    .order('data', { ascending: true });

  throwIfError(error);
  return (data || []).map(mapPresencaFromDb);
};
