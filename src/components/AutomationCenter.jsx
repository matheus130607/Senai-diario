import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Clock3,
  Edit,
  Mail,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  Send,
  ServerCog,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { Button, EmptyState, IconButton, SectionHeader, StatusBadge } from './ui/DesignSystem';
import EmailComposeWindow from './ui/EmailComposeWindow';
import {
  buildWeeklyReportMetrics,
  createAutomationLog,
  DEFAULT_EMAIL_AUTOMATIONS,
  loadAutomationState,
  PERIODICITY_OPTIONS,
  persistAutomationState,
  readAutomationState,
  TEMPLATE_OPTIONS,
} from '../services/emailAutomationService';

const emptyAutomation = {
  id: '',
  name: '',
  description: '',
  status: 'active',
  periodicity: 'weekly_monday_0500',
  recipients: 'Empresas com aprendizes ativos',
  template: 'weekly-company-summary',
  subject: '',
  bodyHtml: '<p></p>',
  attachments: [],
  retryLimit: 3,
  queue: 'attendance-email-reports',
  nextRunLabel: 'Segunda-feira, 05:00',
};

const statusTone = {
  active: 'success',
  paused: 'warning',
  success: 'success',
  failed: 'danger',
  queued: 'warning',
  retry: 'warning',
};

const statusLabel = {
  active: 'Ativa',
  paused: 'Pausada',
  success: 'Entregue',
  failed: 'Falha',
  queued: 'Na fila',
  retry: 'Retry',
};

const formatLogDate = (value) => {
  if (!value) return 'Em processamento';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const createEmptyForm = () => ({
  ...emptyAutomation,
  id: '',
  name: '',
  subject: '',
  description: '',
  bodyHtml: '<p></p>',
  attachments: [],
});

export default function AutomationCenter({ data, showToast }) {
  const initialState = useMemo(() => readAutomationState(), []);
  const [automations, setAutomations] = useState(initialState.automations);
  const [history, setHistory] = useState(initialState.history);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({ ...emptyAutomation, ...DEFAULT_EMAIL_AUTOMATIONS[0], id: '' });
  const [composeState, setComposeState] = useState({
    isOpen: false,
    mode: 'create',
    isMinimized: false,
    isMaximized: false,
  });

  const metrics = useMemo(() => buildWeeklyReportMetrics(data), [data]);
  const activeAutomations = automations.filter((automation) => automation.status === 'active').length;
  const queuedMessages = history.filter((item) => item.status === 'queued' || item.status === 'retry').length;
  const failureCount = history.filter((item) => item.status === 'failed').length;

  useEffect(() => {
    let isMounted = true;

    const loadRemoteState = async () => {
      const remoteState = await loadAutomationState();
      if (!isMounted) return;
      setAutomations(remoteState.automations);
      setHistory(remoteState.history);
    };

    loadRemoteState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    persistAutomationState({ automations, history });
  }, [automations, history]);

  const resetForm = () => {
    setEditingId('');
    setForm(createEmptyForm());
  };

  const openCreateCompose = () => {
    resetForm();
    setComposeState({
      isOpen: true,
      mode: 'create',
      isMinimized: false,
      isMaximized: false,
    });
  };

  const closeCompose = () => {
    resetForm();
    setComposeState((prev) => ({ ...prev, isOpen: false, isMinimized: false, isMaximized: false }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      id: editingId || `automation-${Date.now()}`,
      bodyHtml: form.bodyHtml || `<p>${form.description || ''}</p>`,
      attachments: Array.isArray(form.attachments) ? form.attachments : [],
      retryLimit: Number(form.retryLimit) || 3,
    };

    setAutomations((prev) => (
      editingId
        ? prev.map((automation) => (automation.id === editingId ? payload : automation))
        : [payload, ...prev]
    ));
    showToast?.(editingId ? 'Comunicado atualizado.' : 'Comunicado criado.');
    closeCompose();
  };

  const editAutomation = (automation) => {
    setEditingId(automation.id);
    setForm({
      ...automation,
      bodyHtml: automation.bodyHtml || `<p>${automation.description || ''}</p>`,
      attachments: Array.isArray(automation.attachments) ? automation.attachments : [],
    });
    setComposeState({
      isOpen: true,
      mode: 'edit',
      isMinimized: false,
      isMaximized: false,
    });
  };

  const toggleAutomation = (automation) => {
    const nextStatus = automation.status === 'active' ? 'paused' : 'active';
    setAutomations((prev) => prev.map((item) => (
      item.id === automation.id ? { ...item, status: nextStatus } : item
    )));
    showToast?.(nextStatus === 'active' ? 'Comunicado ativado.' : 'Comunicado pausado.');
  };

  const deleteAutomation = (automationId) => {
    setAutomations((prev) => prev.filter((automation) => automation.id !== automationId));
    showToast?.('Comunicado removido.');
  };

  const enqueueAutomation = (automation, status = 'queued') => {
    const log = createAutomationLog(
      {
        ...automation,
        recipientsCount: metrics.empresas,
      },
      status,
      status === 'retry'
        ? 'Reenvio solicitado pelo painel administrativo.'
        : 'Mensagem adicionada a fila com tolerancia a falhas e retry automatico.',
    );
    setHistory((prev) => [log, ...prev].slice(0, 20));
    showToast?.('Envio adicionado a fila.');
  };

  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Comunicados automaticos"
        title="Relatorios e alertas por e-mail"
        description="Painel para relatorios semanais, templates, filas, logs, reenvio e historico de comunicacao com empresas."
      />

      <div className="automation-metrics-grid">
        <div className="automation-kpi">
          <Mail className="h-5 w-5 text-red-600" />
          <span>Comunicados ativos</span>
          <strong>{activeAutomations}</strong>
        </div>
        <div className="automation-kpi">
          <Activity className="h-5 w-5 text-emerald-600" />
          <span>Frequencia semanal</span>
          <strong>{metrics.frequencia}%</strong>
        </div>
        <div className="automation-kpi">
          <Clock3 className="h-5 w-5 text-amber-600" />
          <span>Fila atual</span>
          <strong>{queuedMessages}</strong>
        </div>
        <div className="automation-kpi">
          <ShieldAlert className="h-5 w-5 text-red-600" />
          <span>Falhas recentes</span>
          <strong>{failureCount}</strong>
        </div>
      </div>

      <div className="automation-layout automation-layout-single">
        <section className="automation-panel">
          <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h3 className="text-base font-semibold text-slate-950">Comunicados programados</h3>
              <p className="mt-1 text-sm text-slate-500">Relatorio principal: toda segunda-feira as 05:00.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="success" icon={ServerCog}>
                Fila preparada
              </StatusBadge>
              <Button type="button" variant="primary" onClick={openCreateCompose}>
                <Plus className="h-4 w-4" />
                Criar novo comunicado
              </Button>
            </div>
          </div>

          {automations.length === 0 ? (
            <EmptyState icon={Mail} title="Nenhum comunicado criado" description="Crie relatorios automaticos para empresas, coordenacao ou secretaria." />
          ) : (
            <div className="space-y-3">
              {automations.map((automation) => (
                <article key={automation.id} className="automation-card">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-sm font-semibold text-slate-950">{automation.name}</h4>
                      <StatusBadge tone={statusTone[automation.status] || 'neutral'}>
                        {statusLabel[automation.status] || automation.status}
                      </StatusBadge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{automation.description}</p>
                    <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-2">
                      <span>Periodicidade: {PERIODICITY_OPTIONS.find((item) => item.value === automation.periodicity)?.label}</span>
                      <span>Destinatarios: {automation.recipients}</span>
                      <span>Template: {TEMPLATE_OPTIONS.find((item) => item.value === automation.template)?.label}</span>
                      <span>Retry: {automation.retryLimit} tentativa(s)</span>
                      <span>Anexos: {automation.attachments?.length || 0}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <IconButton title="Executar agora" onClick={() => enqueueAutomation(automation)}>
                      <Send className="h-4 w-4" />
                    </IconButton>
                    <IconButton title={automation.status === 'active' ? 'Pausar' : 'Ativar'} onClick={() => toggleAutomation(automation)}>
                      {automation.status === 'active' ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                    </IconButton>
                    <IconButton title="Editar" onClick={() => editAutomation(automation)}>
                      <Edit className="h-4 w-4" />
                    </IconButton>
                    <IconButton title="Excluir" onClick={() => deleteAutomation(automation.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="automation-panel mt-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Historico de envios e logs</h3>
            <p className="mt-1 text-sm text-slate-500">Registros preparados para auditoria, reenviar mensagens e investigar falhas.</p>
          </div>
          <StatusBadge tone="warning" icon={RefreshCw}>
            Retry automatico ativo
          </StatusBadge>
        </div>

        <div className="ds-table overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Comunicado</th>
                <th>Status</th>
                <th>Destinatarios</th>
                <th>Inicio</th>
                <th>Tentativas</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {history.map((log) => (
                <tr key={log.id}>
                  <td className="font-semibold text-slate-900">{log.automationName}</td>
                  <td><StatusBadge tone={statusTone[log.status] || 'neutral'}>{statusLabel[log.status] || log.status}</StatusBadge></td>
                  <td>{log.recipients}</td>
                  <td>{formatLogDate(log.startedAt)}</td>
                  <td>{log.attempts}</td>
                  <td>
                    <Button
                      type="button"
                      onClick={() => {
                        const automation = automations.find((item) => item.id === log.automationId) || automations[0];
                        if (automation) enqueueAutomation(automation, 'retry');
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reenviar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {composeState.isOpen && (
        <EmailComposeWindow
          mode={composeState.mode}
          form={form}
          isMinimized={composeState.isMinimized}
          isMaximized={composeState.isMaximized}
          uploadContextId={editingId || form.id || form.name || 'draft'}
          onChangeForm={setForm}
          onSubmit={handleSubmit}
          onClose={closeCompose}
          onMinimize={() => setComposeState((prev) => ({ ...prev, isMinimized: !prev.isMinimized }))}
          onMaximize={() => setComposeState((prev) => ({ ...prev, isMaximized: !prev.isMaximized, isMinimized: false }))}
        />
      )}
    </div>
  );
}
