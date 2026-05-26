export const AUTOMATION_STORAGE_KEY = 'senai-diario:email-automations:v1';

export const DEFAULT_EMAIL_AUTOMATIONS = [
  {
    id: 'weekly-company-report',
    name: 'Relatório semanal para empresas',
    description: 'Resumo automático da semana anterior com frequência, faltas, atrasos e indicadores visuais.',
    status: 'active',
    periodicity: 'weekly_monday_0500',
    recipients: 'Empresas com aprendizes ativos',
    template: 'weekly-company-summary',
    subject: 'Relatório semanal de frequência dos aprendizes SENAI',
    retryLimit: 3,
    queue: 'attendance-email-reports',
    lastRunAt: '',
    nextRunLabel: 'Segunda-feira, 05:00',
  },
];

export const DEFAULT_EMAIL_HISTORY = [
  {
    id: 'seed-log-1',
    automationId: 'weekly-company-report',
    automationName: 'Relatório semanal para empresas',
    status: 'success',
    recipients: 1,
    startedAt: '2026-05-25T05:00:00.000Z',
    finishedAt: '2026-05-25T05:01:14.000Z',
    attempts: 1,
    message: 'Relatório semanal entregue para empresas com aprendizes vinculados.',
  },
];

export const PERIODICITY_OPTIONS = [
  { value: 'weekly_monday_0500', label: 'Toda segunda-feira às 05:00' },
  { value: 'daily_0700', label: 'Diariamente às 07:00' },
  { value: 'monthly_first_0600', label: 'Todo dia 1 às 06:00' },
  { value: 'manual', label: 'Execução manual' },
];

export const TEMPLATE_OPTIONS = [
  { value: 'weekly-company-summary', label: 'Resumo semanal da empresa' },
  { value: 'absence-alert', label: 'Alerta de faltas recorrentes' },
  { value: 'late-arrival-summary', label: 'Resumo de atrasos' },
  { value: 'coordination-digest', label: 'Resumo para coordenação' },
];

export const readAutomationState = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(AUTOMATION_STORAGE_KEY) || '{}');
    return {
      automations: Array.isArray(stored.automations) ? stored.automations : DEFAULT_EMAIL_AUTOMATIONS,
      history: Array.isArray(stored.history) ? stored.history : DEFAULT_EMAIL_HISTORY,
    };
  } catch {
    return {
      automations: DEFAULT_EMAIL_AUTOMATIONS,
      history: DEFAULT_EMAIL_HISTORY,
    };
  }
};

export const persistAutomationState = (state) => {
  localStorage.setItem(AUTOMATION_STORAGE_KEY, JSON.stringify(state));
};

export const createAutomationLog = (automation, status = 'queued', message = '') => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  automationId: automation.id,
  automationName: automation.name,
  status,
  recipients: automation.recipientsCount || 0,
  startedAt: new Date().toISOString(),
  finishedAt: status === 'queued' ? '' : new Date().toISOString(),
  attempts: status === 'retry' ? 2 : 1,
  message: message || 'Mensagem adicionada à fila de envio.',
});

export const buildWeeklyReportMetrics = (data) => {
  const presencas = data?.presencas || [];
  const presentes = presencas.filter((item) => item.status === 'presente').length;
  const faltas = presencas.filter((item) => item.status === 'falta').length;
  const atrasos = presencas.filter((item) => item.atraso).length;
  const total = presentes + faltas + atrasos;
  const frequencia = total === 0 ? 0 : Math.round(((presentes + atrasos) / total) * 100);

  return {
    empresas: data?.empresas?.length || 0,
    aprendizes: data?.alunos?.length || 0,
    frequencia,
    presentes,
    faltas,
    atrasos,
  };
};

