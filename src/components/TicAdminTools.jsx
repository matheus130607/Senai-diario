import { useMemo, useState } from 'react';
import {
  Activity,
  Bug,
  Database,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  TerminalSquare,
  Users,
} from 'lucide-react';
import { Button, SectionHeader, StatusBadge } from './ui/DesignSystem';
import { ROLE_DEFINITIONS } from '../utils/permissions';

const readTicLogs = () => {
  try {
    return JSON.parse(localStorage.getItem('senai-diario:tic-access-logs') || '[]');
  } catch {
    return [];
  }
};

export default function TicAdminTools({ data, syncStatus, syncError, showToast }) {
  const [resetTarget, setResetTarget] = useState('');
  const ticLogs = useMemo(() => readTicLogs(), []);
  const people = [
    ...(data?.administradores || []).map((user) => ({ ...user, type: user.perfil || 'coordenacao' })),
    ...(data?.professores || []).map((user) => ({ ...user, type: 'professor' })),
    ...(data?.empresas || []).map((user) => ({ ...user, type: 'empresa' })),
  ];

  const handleReset = () => {
    if (!resetTarget) return;
    showToast?.('Reset de senha registrado para execução administrativa.');
    setResetTarget('');
  };

  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="TIC Super Admin"
        title="Manutenção e monitoramento"
        description="Área técnica protegida para debug, permissões, reset de senhas, logs de acesso e saúde do sistema."
      />

      <div className="tic-grid">
        <div className="tic-card">
          <Activity className="h-5 w-5 text-emerald-600" />
          <span>Sincronização</span>
          <strong>{syncStatus || 'local'}</strong>
          {syncError && <small className="text-red-600">{syncError}</small>}
        </div>
        <div className="tic-card">
          <Database className="h-5 w-5 text-slate-500" />
          <span>Registros acadêmicos</span>
          <strong>{(data.alunos || []).length + (data.presencas || []).length}</strong>
        </div>
        <div className="tic-card">
          <Users className="h-5 w-5 text-blue-600" />
          <span>Usuários gerenciáveis</span>
          <strong>{people.length}</strong>
        </div>
        <div className="tic-card">
          <LockKeyhole className="h-5 w-5 text-red-600" />
          <span>Rota oculta</span>
          <strong>/sesisenaisp72</strong>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="tic-panel">
          <div className="mb-5 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-red-600" />
            <h3 className="text-base font-semibold text-slate-950">Reset de senhas</h3>
          </div>
          <label>
            <span className="ds-label">Usuário</span>
            <select value={resetTarget} onChange={(event) => setResetTarget(event.target.value)} className="ds-input">
              <option value="">Selecione um usuário</option>
              {people.map((person) => (
                <option key={`${person.type}-${person.id}`} value={person.id}>
                  {person.nome} · {ROLE_DEFINITIONS[person.type]?.label || person.type}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleReset} disabled={!resetTarget} variant="primary">
              <RefreshCw className="h-4 w-4" />
              Registrar reset
            </Button>
          </div>
        </section>

        <section className="tic-panel">
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-red-600" />
            <h3 className="text-base font-semibold text-slate-950">Matriz de permissões</h3>
          </div>
          <div className="permission-matrix">
            {Object.entries(ROLE_DEFINITIONS).filter(([role]) => role !== 'admin').map(([role, definition]) => (
              <div key={role} className="permission-matrix-row">
                <div>
                  <strong>{definition.label}</strong>
                  <small>{definition.scope}</small>
                </div>
                <StatusBadge tone={role === 'tic' ? 'warning' : 'success'}>
                  {definition.permissions.length} permissões
                </StatusBadge>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="tic-panel">
          <div className="mb-5 flex items-center gap-2">
            <TerminalSquare className="h-5 w-5 text-red-600" />
            <h3 className="text-base font-semibold text-slate-950">Logs de acesso TIC</h3>
          </div>
          {ticLogs.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum login TIC registrado neste navegador.</p>
          ) : (
            <div className="space-y-3">
              {ticLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="access-log-row">
                  <strong>{log.event}</strong>
                  <span>{new Date(log.at).toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="tic-panel">
          <div className="mb-5 flex items-center gap-2">
            <Bug className="h-5 w-5 text-red-600" />
            <h3 className="text-base font-semibold text-slate-950">Debug operacional</h3>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="ds-muted-panel p-3">
              <strong className="block text-slate-900">Ambiente</strong>
              <span>SPA Vite integrado ao Supabase configurado no ambiente.</span>
            </div>
            <div className="ds-muted-panel p-3">
              <strong className="block text-slate-900">Segurança</strong>
              <span>Token TIC validado no acesso oculto. Em produção, validar exclusivamente no backend.</span>
            </div>
            <div className="ds-muted-panel p-3">
              <strong className="block text-slate-900">Observabilidade</strong>
              <span>Logs locais preparados para auditoria e futura persistência em tabela dedicada.</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

