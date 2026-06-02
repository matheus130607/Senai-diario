import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
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

export default function AutomationCenter({ data, showToast }) {
  const initialState = useMemo(() => readAutomationState(), []);
  const [automations, setAutomations] = useState(initialState.automations);
  const [history, setHistory] = useState(initialState.history);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({ ...emptyAutomation, ...DEFAULT_EMAIL_AUTOMATIONS[0], id: '' });

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
    setForm({ ...emptyAutomation, id: '', name: '', subject: '', description: '' });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      id: editingId || `automation-${Date.now()}`,
      retryLimit: Number(form.retryLimit) || 3,
    };

    setAutomations((prev) => (
      editingId
        ? prev.map((automation) => (automation.id === editingId ? payload : automation))
        : [payload, ...prev]
    ));
    showToast?.(editingId ? 'Comunicado atualizado.' : 'Comunicado criado.');
    resetForm();
  };

  const editAutomation = (automation) => {
    setEditingId(automation.id);
    setForm(automation);
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
        : 'Mensagem adicionada à fila com tolerância a falhas e retry automático.',
    );
    setHistory((prev) => [log, ...prev].slice(0, 20));
    showToast?.('Envio adicionado à fila.');
  };

  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Comunicados automáticos"
        title="Relatórios e alertas por e-mail"
        description="Painel para relatórios semanais, templates, filas, logs, reenvio e histórico de comunicação com empresas."
      />

      <div className="automation-metrics-grid">
        <div className="automation-kpi">
          <Mail className="h-5 w-5 text-zinc-500" />
          <span>Comunicados ativos</span>
          <strong>{activeAutomations}</strong>
        </div>
        <div className="automation-kpi">
<<<<<<< HEAD
          <Activity className="h-5 w-5 text-emerald-600" />
          <span>Frequência semanal</span>
=======
          <Activity className="h-5 w-5 text-zinc-500" />
          <span>Frequencia semanal</span>
>>>>>>> d194492 (test-design)
          <strong>{metrics.frequencia}%</strong>
        </div>
        <div className="automation-kpi">
          <Clock3 className="h-5 w-5 text-zinc-500" />
          <span>Fila atual</span>
          <strong>{queuedMessages}</strong>
        </div>
        <div className="automation-kpi">
          <ShieldAlert className="h-5 w-5 text-zinc-500" />
          <span>Falhas recentes</span>
          <strong>{failureCount}</strong>
        </div>
      </div>

      <div className="automation-layout">
        <section className="automation-panel">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-950">Comunicados programados</h3>
              <p className="mt-1 text-sm text-slate-500">Relatório principal: toda segunda-feira às 05:00.</p>
            </div>
            <StatusBadge tone="success" icon={ServerCog}>
              Fila preparada
            </StatusBadge>
          </div>

          {automations.length === 0 ? (
            <EmptyState icon={Mail} title="Nenhum comunicado criado" description="Crie relatórios automáticos para empresas, coordenação ou secretaria." />
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
                      <span>Destinatários: {automation.recipients}</span>
                      <span>Template: {TEMPLATE_OPTIONS.find((item) => item.value === automation.template)?.label}</span>
                      <span>Retry: {automation.retryLimit} tentativa(s)</span>
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
                    <IconButton title="Excluir" onClick={() => deleteAutomation(automation.id)} className="text-zinc-500 hover:text-zinc-950">
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="automation-panel">
          <div className="mb-5 flex items-center gap-2">
            <Plus className="h-5 w-5 text-red-600" />
            <h3 className="text-base font-semibold text-slate-950">{editingId ? 'Editar comunicado' : 'Novo comunicado'}</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label>
              <span className="ds-label">Nome</span>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="ds-input" required />
            </label>
            <label>
              <span className="ds-label">Assunto</span>
              <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} className="ds-input" required />
            </label>
            <label>
              <span className="ds-label">Descrição</span>
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="ds-input min-h-[6rem]" required />
            </label>
            <label>
              <span className="ds-label">Periodicidade</span>
              <select value={form.periodicity} onChange={(event) => setForm({ ...form, periodicity: event.target.value })} className="ds-input">
                {PERIODICITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span className="ds-label">Destinatários</span>
              <input value={form.recipients} onChange={(event) => setForm({ ...form, recipients: event.target.value })} className="ds-input" />
            </label>
            <label>
              <span className="ds-label">Template</span>
              <select value={form.template} onChange={(event) => setForm({ ...form, template: event.target.value })} className="ds-input">
                {TEMPLATE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span className="ds-label">Retry automático</span>
              <input type="number" min="1" max="10" value={form.retryLimit} onChange={(event) => setForm({ ...form, retryLimit: event.target.value })} className="ds-input" />
            </label>

            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              <Button type="submit" variant="primary">
                <CheckCircle2 className="h-4 w-4" />
                {editingId ? 'Salvar' : 'Criar'}
              </Button>
              {editingId && <Button type="button" onClick={resetForm}>Cancelar</Button>}
            </div>
          </form>
        </aside>
      </div>

      <section className="automation-panel mt-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Histórico de envios e logs</h3>
            <p className="mt-1 text-sm text-slate-500">Registros preparados para auditoria, reenviar mensagens e investigar falhas.</p>
          </div>
          <StatusBadge tone="warning" icon={RefreshCw}>
            Retry automático ativo
          </StatusBadge>
        </div>

        <div className="ds-table overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Comunicado</th>
                <th>Status</th>
                <th>Destinatários</th>
                <th>Início</th>
                <th>Tentativas</th>
                <th>Ações</th>
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
    </div>
  );
}
