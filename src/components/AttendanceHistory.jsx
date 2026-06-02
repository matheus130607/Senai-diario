import { useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarRange,
  CheckCircle2,
  FileText,
  Search,
  TrendingUp,
  UserRound,
  XCircle,
} from 'lucide-react';
import { EmptyState, SectionHeader, StatusBadge } from './ui/DesignSystem';
import {
  formatDateKey,
  getStudentHistory,
  parseDateKey,
  STATUS_LABELS,
  STATUS_TONES,
} from '../utils/attendanceAnalytics';
import { getVisibleStudents, getVisibleTurmas } from '../utils/permissions';

const PERIOD_OPTIONS = [
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: '180', label: 'Últimos 180 dias' },
  { value: 'all', label: 'Histórico completo' },
];

const normalizeText = (value) => String(value || '').toLowerCase();

function MetricBox({ label, value, icon: Icon, tone = 'slate' }) {
  const toneClass = {
    slate: 'text-slate-500 bg-slate-100',
    green: 'text-zinc-600 bg-zinc-100',
    red: 'text-zinc-600 bg-zinc-100',
    amber: 'text-zinc-600 bg-zinc-100',
  }[tone];

  return (
    <div className="history-metric">
      <div className={`history-metric-icon ${toneClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function AttendanceHistory({ data, currentUser }) {
  const visibleStudents = useMemo(() => getVisibleStudents(data, currentUser), [data, currentUser]);
  const visibleTurmas = useMemo(() => getVisibleTurmas(data, currentUser), [data, currentUser]);
  const [selectedAlunoId, setSelectedAlunoId] = useState(visibleStudents[0]?.id || '');
  const [period, setPeriod] = useState('90');
  const [turmaFilter, setTurmaFilter] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');

  const effectiveSelectedAlunoId = visibleStudents.some((aluno) => aluno.id === selectedAlunoId)
    ? selectedAlunoId
    : visibleStudents[0]?.id || '';

  const filteredStudents = useMemo(() => {
    const search = normalizeText(searchTerm);
    return visibleStudents.filter((aluno) => {
      const turma = data.turmas.find((item) => item.id === aluno.turmaId);
      const matchesTurma = turmaFilter === 'todas' || aluno.turmaId === turmaFilter;
      const matchesSearch = !search || [aluno.nome, aluno.email, turma?.nome]
        .some((value) => normalizeText(value).includes(search));
      return matchesTurma && matchesSearch;
    });
  }, [data.turmas, searchTerm, turmaFilter, visibleStudents]);

  const history = useMemo(() => getStudentHistory(data, effectiveSelectedAlunoId), [data, effectiveSelectedAlunoId]);

  const filteredRecords = useMemo(() => {
    if (period === 'all') return history.records;

    const days = Number(period);
    const limit = new Date();
    limit.setDate(limit.getDate() - days);

    return history.records.filter((record) => parseDateKey(record.data) >= limit);
  }, [history.records, period]);

  const filteredSummary = useMemo(() => {
    const total = filteredRecords.length;
    const presentes = filteredRecords.filter((record) => record.status === 'presente').length;
    const faltas = filteredRecords.filter((record) => record.status === 'falta').length;
    const atrasos = filteredRecords.filter((record) => record.status === 'atraso').length;
    const computados = presentes + faltas + atrasos;
    return {
      total,
      presentes,
      faltas,
      atrasos,
      percentualPresenca: computados === 0 ? 0 : Math.round(((presentes + atrasos) / computados) * 100),
      percentualFaltas: computados === 0 ? 0 : Math.round((faltas / computados) * 100),
    };
  }, [filteredRecords]);

  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Histórico completo"
        title="Presença por aprendiz"
        description="Consulte frequência geral, justificativas, observações, gráficos simples e evolução mensal."
      />

      {visibleStudents.length === 0 ? (
        <EmptyState icon={UserRound} title="Nenhum aprendiz no escopo" description="Empresas visualizam apenas aprendizes vinculados; professores visualizam apenas suas turmas." />
      ) : (
        <div className="history-layout">
          <aside className="history-sidebar">
            <div className="space-y-3">
              <label>
                <span className="ds-label">Turma</span>
                <select value={turmaFilter} onChange={(event) => setTurmaFilter(event.target.value)} className="ds-input">
                  <option value="todas">Todas</option>
                  {visibleTurmas.map((turma) => <option key={turma.id} value={turma.id}>{turma.nome}</option>)}
                </select>
              </label>
              <label>
                <span className="ds-label">Pesquisar aprendiz</span>
                <span className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="ds-input ds-input-icon-left"
                    placeholder="Nome, e-mail ou turma"
                  />
                </span>
              </label>
            </div>

            <div className="mt-5 space-y-2">
              {filteredStudents.map((aluno) => {
                const turma = data.turmas.find((item) => item.id === aluno.turmaId);
                const isSelected = aluno.id === effectiveSelectedAlunoId;

                return (
                  <button
                    key={aluno.id}
                    type="button"
                    className={`history-student-button ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedAlunoId(aluno.id)}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
                      {aluno.nome.charAt(0)}
                    </span>
                    <span className="min-w-0 text-left">
                      <strong>{aluno.nome}</strong>
                      <small>{turma?.nome || 'Turma não informada'}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="history-detail">
            {!history.aluno ? (
              <EmptyState icon={Search} title="Selecione um aprendiz" description="Clique em um aluno para consultar o histórico completo de presença." />
            ) : (
              <>
                <div className="history-hero">
                  <div className="min-w-0">
                    <p className="section-kicker mb-2">Aprendiz selecionado</p>
                    <h3>{history.aluno.nome}</h3>
                    <p>{history.aluno.email} · {history.aluno.turma?.nome || 'Sem turma'}</p>
                  </div>
                  <label className="min-w-[13rem]">
                    <span className="ds-label">Período</span>
                    <select value={period} onChange={(event) => setPeriod(event.target.value)} className="ds-input">
                      {PERIOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                </div>

                <div className="history-metrics-grid">
                  <MetricBox icon={CalendarRange} label="Registros" value={filteredSummary.total} />
                  <MetricBox icon={CheckCircle2} label="Presença" value={`${filteredSummary.percentualPresenca}%`} tone="green" />
                  <MetricBox icon={XCircle} label="Faltas" value={`${filteredSummary.percentualFaltas}%`} tone="red" />
                  <MetricBox icon={TrendingUp} label="Atrasos" value={filteredSummary.atrasos} tone="amber" />
                </div>

                <div className="history-chart-panel">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="flex items-center gap-2 text-base font-semibold text-slate-950">
                        <BarChart3 className="h-4 w-4 text-zinc-600" />
                        Evolução mensal
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">Percentual de presença por mês com base nos registros disponíveis.</p>
                    </div>
                  </div>
                  <div className="history-bars">
                    {history.monthlyEvolution.length === 0 ? (
                      <span className="text-sm text-slate-500">Sem dados mensais suficientes.</span>
                    ) : history.monthlyEvolution.map((month) => (
                      <div key={month.key} className="history-bar-item">
                        <div className="history-bar-track">
                          <span style={{ height: `${Math.max(8, month.presencaPercentual)}%` }} />
                        </div>
                        <strong>{month.presencaPercentual}%</strong>
                        <small>{month.label}</small>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="history-table-panel">
                  <div className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-950">
                    <FileText className="h-4 w-4 text-zinc-600" />
                    Histórico completo
                  </div>

                  <div className="ds-table overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Status</th>
                          <th>Turma</th>
                          <th>Professor</th>
                          <th>Observações e justificativas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center text-slate-500">Nenhum registro no período selecionado.</td>
                          </tr>
                        ) : filteredRecords.map((record) => (
                          <tr key={record.id || `${record.alunoId}-${record.data}`}>
                            <td className="font-semibold text-slate-900">{formatDateKey(record.data)}</td>
                            <td>
                              <StatusBadge tone={STATUS_TONES[record.status] || 'neutral'}>
                                {STATUS_LABELS[record.status] || record.status}
                              </StatusBadge>
                            </td>
                            <td>{record.turma?.nome || 'Sem turma'}</td>
                            <td>{record.professor?.nome || 'Não informado'}</td>
                            <td>
                              <div className="max-w-xl text-xs leading-5 text-slate-600">
                                {record.observacao || 'Sem observação.'}
                                {record.justificativa && <span className="block font-semibold text-slate-800">Justificativa: {record.justificativa}</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
