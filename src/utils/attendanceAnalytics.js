import { getVisibleStudents, getVisibleTurmas } from './permissions';

export const STATUS_LABELS = {
  presente: 'Presente',
  falta: 'Falta',
  pendente: 'Pendente',
  atraso: 'Atraso',
};

export const STATUS_TONES = {
  presente: 'success',
  falta: 'danger',
  pendente: 'warning',
  atraso: 'warning',
};

export const toDateKey = (date = new Date()) => {
  const value = date instanceof Date ? date : new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDateKey = (value) => {
  const [year, month, day] = String(value || '').split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
};

export const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

export const addMonths = (date, amount) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
};

export const startOfWeek = (date) => {
  const next = new Date(date);
  const day = next.getDay();
  next.setDate(next.getDate() - day);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const endOfWeek = (date) => addDays(startOfWeek(date), 6);

export const formatDate = (date, options = {}) => (
  parseDateKey(toDateKey(date)).toLocaleDateString('pt-BR', options)
);

export const formatDateKey = (value, options = {}) => (
  parseDateKey(value).toLocaleDateString('pt-BR', options)
);

export const getMonthGrid = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstGridDay = startOfWeek(firstDay);

  return Array.from({ length: 42 }, (_, index) => addDays(firstGridDay, index));
};

export const normalizeAttendanceStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'faltou') return 'falta';
  if (normalized === 'atrasado') return 'atraso';
  if (['presente', 'falta', 'pendente', 'atraso'].includes(normalized)) return normalized;
  return 'pendente';
};

export const buildAttendanceEvents = (data, currentUser) => {
  const visibleStudents = getVisibleStudents(data, currentUser);
  const visibleStudentIds = new Set(visibleStudents.map((aluno) => aluno.id));
  const turmasById = new Map((data?.turmas || []).map((turma) => [turma.id, turma]));
  const professoresById = new Map((data?.professores || []).map((professor) => [professor.id, professor]));
  const empresasById = new Map((data?.empresas || []).map((empresa) => [empresa.id, empresa]));

  return (data?.presencas || [])
    .filter((presenca) => visibleStudentIds.has(presenca.alunoId))
    .map((presenca) => {
      const aluno = visibleStudents.find((item) => item.id === presenca.alunoId) || {};
      const turma = turmasById.get(presenca.turmaId || aluno.turmaId) || {};
      const professor = professoresById.get(presenca.professorId) || {};
      const empresa = empresasById.get(aluno.empresaId) || {};
      const status = presenca.atraso ? 'atraso' : normalizeAttendanceStatus(presenca.status);

      return {
        ...presenca,
        status,
        dateKey: presenca.data,
        aluno,
        turma,
        professor,
        empresa,
        termo: presenca.termo || turma.termo || '1º termo',
        periodo: presenca.periodo || turma.periodo || 'Manhã',
        observacao: presenca.observacao || '',
        justificativa: presenca.justificativa || '',
      };
    })
    .sort((a, b) => String(a.data).localeCompare(String(b.data)));
};

export const groupEventsByDate = (events) => (
  events.reduce((acc, event) => {
    const key = event.dateKey || event.data;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {})
);

export const getAttendanceSummary = (events = []) => {
  const total = events.length;
  const presentes = events.filter((event) => event.status === 'presente').length;
  const faltas = events.filter((event) => event.status === 'falta').length;
  const atrasos = events.filter((event) => event.status === 'atraso').length;
  const pendentes = events.filter((event) => event.status === 'pendente').length;
  const computados = presentes + faltas + atrasos;
  const presencaPercentual = computados === 0 ? 0 : Math.round(((presentes + atrasos) / computados) * 100);
  const faltasPercentual = computados === 0 ? 0 : Math.round((faltas / computados) * 100);

  return {
    total,
    presentes,
    faltas,
    atrasos,
    pendentes,
    presencaPercentual,
    faltasPercentual,
  };
};

export const getStudentHistory = (data, alunoId) => {
  const aluno = (data?.alunos || []).find((item) => item.id === alunoId);
  if (!aluno) {
    return {
      aluno: null,
      records: [],
      summary: getAttendanceSummary([]),
      monthlyEvolution: [],
    };
  }

  const turma = (data?.turmas || []).find((item) => item.id === aluno.turmaId);
  const professorById = new Map((data?.professores || []).map((professor) => [professor.id, professor]));
  const records = (data?.presencas || [])
    .filter((presenca) => presenca.alunoId === alunoId)
    .map((presenca) => ({
      ...presenca,
      aluno,
      turma,
      professor: professorById.get(presenca.professorId),
      status: presenca.atraso ? 'atraso' : normalizeAttendanceStatus(presenca.status),
      termo: presenca.termo || turma?.termo || '1º termo',
      periodo: presenca.periodo || turma?.periodo || 'Manhã',
    }))
    .sort((a, b) => String(b.data).localeCompare(String(a.data)));

  const groupedByMonth = records.reduce((acc, record) => {
    const date = parseDateKey(record.data);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(record);
    return acc;
  }, {});

  const monthlyEvolution = Object.entries(groupedByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, monthRecords]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        key,
        label: new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }),
        ...getAttendanceSummary(monthRecords),
      };
    });

  return {
    aluno: { ...aluno, turma },
    records,
    summary: getAttendanceSummary(records),
    monthlyEvolution,
  };
};

export const getCalendarScopeDescription = (data, currentUser) => {
  const turmas = getVisibleTurmas(data, currentUser);
  const alunos = getVisibleStudents(data, currentUser);
  return `${turmas.length} turma(s) e ${alunos.length} aprendiz(es) no seu escopo de acesso.`;
};

