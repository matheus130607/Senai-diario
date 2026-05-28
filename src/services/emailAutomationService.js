import { isSupabaseConfigured, supabase } from './supabaseClient';

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

const emptyRemoteAutomationState = {
  automations: [],
  history: [],
};

const isMissingAutomationTableError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('email_automations')
    || message.includes('email_automation_logs')
    || message.includes('schema cache')
    || message.includes('does not exist')
    || message.includes('could not find the table');
};

const mapAutomationFromDb = (row) => ({
  id: row.client_id || row.id,
  name: row.name,
  description: row.description || '',
  status: row.status || 'active',
  periodicity: row.periodicity,
  recipients: row.recipients,
  template: row.template,
  subject: row.subject,
  retryLimit: row.retry_limit || 3,
  queue: row.queue || 'attendance-email-reports',
  nextRunLabel: row.next_run_at ? new Date(row.next_run_at).toLocaleString('pt-BR') : 'Segunda-feira, 05:00',
});

const mapLogFromDb = (row) => ({
  id: row.client_id || row.id,
  automationId: row.automation_client_id || row.automation_id || '',
  automationName: row.automation_name || 'Comunicado automático',
  status: row.status,
  recipients: row.recipients || 0,
  startedAt: row.started_at,
  finishedAt: row.finished_at || '',
  attempts: row.attempts || 1,
  message: row.message || '',
});

export const loadAutomationState = async () => {
  if (!isSupabaseConfigured || !supabase) return readAutomationState();

  const [automationsResult, logsResult] = await Promise.all([
    supabase.from('email_automations').select('*').order('created_at', { ascending: false }),
    supabase.from('email_automation_logs').select('*').order('started_at', { ascending: false }).limit(20),
  ]);

  if (automationsResult.error || logsResult.error) {
    const error = automationsResult.error || logsResult.error;
    if (!isMissingAutomationTableError(error)) {
      console.error('Erro ao carregar automações do Supabase:', error);
    }
    return emptyRemoteAutomationState;
  }

  const automations = (automationsResult.data || []).map(mapAutomationFromDb);
  const history = (logsResult.data || []).map(mapLogFromDb);

  return {
    automations,
    history,
  };
};

export const persistAutomationState = (state) => {
  localStorage.setItem(AUTOMATION_STORAGE_KEY, JSON.stringify(state));

  if (!isSupabaseConfigured || !supabase) return;

  const automationRows = (state.automations || []).map((automation) => ({
    client_id: automation.id,
    name: automation.name,
    description: automation.description,
    status: automation.status,
    periodicity: automation.periodicity,
    recipients: automation.recipients,
    template: automation.template,
    subject: automation.subject,
    retry_limit: Number(automation.retryLimit) || 3,
    queue: automation.queue || 'attendance-email-reports',
    updated_at: new Date().toISOString(),
  }));

  const logRows = (state.history || []).map((log) => ({
    client_id: log.id,
    automation_client_id: log.automationId || null,
    automation_name: log.automationName || null,
    status: log.status,
    recipients: Number(log.recipients) || 0,
    attempts: Number(log.attempts) || 1,
    message: log.message || '',
    started_at: log.startedAt || new Date().toISOString(),
    finished_at: log.finishedAt || null,
  }));

  if (automationRows.length > 0) {
    supabase
      .from('email_automations')
      .upsert(automationRows, { onConflict: 'client_id' })
      .then(({ error }) => {
        if (error && !isMissingAutomationTableError(error)) {
          console.error('Erro ao salvar automações no Supabase:', error);
        }
      });
  }

  if (logRows.length > 0) {
    supabase
      .from('email_automation_logs')
      .upsert(logRows, { onConflict: 'client_id' })
      .then(({ error }) => {
        if (error && !isMissingAutomationTableError(error)) {
          console.error('Erro ao salvar logs de automação no Supabase:', error);
        }
      });
  }
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

