// src/components/ProfessorDashboard.jsx
import { useEffect, useMemo, useState } from 'react';
import DashboardShell from './DashboardShell';
import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Search,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  FileText,
  Loader2,
  Send,
  Users,
} from 'lucide-react';
import DashboardView from './DashboardView';
import SearchableSelect from './ui/SearchableSelect';
import { AvatarInitial, Button, EmptyState, SectionHeader, StatusBadge } from './ui/DesignSystem';
import AcademicCalendar from './AcademicCalendar';
import AccessibilityPanel from './AccessibilityPanel';
import UserProfile from './UserProfile';
import { exportExcelCSV, exportPDFReport } from '../utils/utils';

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getSemesterBounds = () => {
  const today = new Date();
  const year = today.getFullYear();
  const isFirstSemester = today.getMonth() < 6;
  const semesterStart = new Date(year, isFirstSemester ? 0 : 6, 1);
  const semesterEnd = new Date(year, isFirstSemester ? 5 : 11, isFirstSemester ? 30 : 31);
  const maxDate = semesterEnd > today ? today : semesterEnd;

  return {
    min: toDateInputValue(semesterStart),
    max: toDateInputValue(maxDate),
  };
};

const formatAttendanceDate = (value) => {
  const [year, month, day] = String(value || '').split('-').map(Number);
  if (!year || !month || !day) return '';

  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export default function ProfessorDashboard({
  data,
  setData,
  currentUser,
  profTab,
  profActiveTurma,
  setProfActiveTurma,
  showToast,
  requestConfirm,
  saveAttendance,
  isSupabaseConfigured,
  reloadData,
  selectedAttendanceDate,
  setSelectedAttendanceDate,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isChangingDate, setIsChangingDate] = useState(false);
  const [dateError, setDateError] = useState('');
  const currentUserTurmas = useMemo(() => (
    Array.isArray(currentUser.turmas) ? currentUser.turmas : []
  ), [currentUser.turmas]);
  const semesterBounds = getSemesterBounds();

  useEffect(() => {
    if (!profActiveTurma && currentUserTurmas.length > 0) {
      setProfActiveTurma(currentUserTurmas[0]);
    }
  }, [currentUserTurmas, profActiveTurma, setProfActiveTurma]);

  const turmasDoProfessor = useMemo(() => (
    data.turmas.filter(turma => currentUserTurmas.includes(turma.id))
  ), [currentUserTurmas, data.turmas]);

  const alunosTurmaAtual = useMemo(() => (
    data.alunos.filter(aluno => aluno.turmaId === profActiveTurma)
  ), [data.alunos, profActiveTurma]);

  const turmaAtual = useMemo(() => (
    data.turmas.find(turma => turma.id === profActiveTurma)
  ), [data.turmas, profActiveTurma]);

  const turmasById = useMemo(() => (
    new Map((data.turmas || []).map(turma => [turma.id, turma]))
  ), [data.turmas]);

  const empresasById = useMemo(() => (
    new Map((data.empresas || []).map(empresa => [empresa.id, empresa]))
  ), [data.empresas]);

  const alunosProfessor = useMemo(() => (
    data.alunos.filter(aluno => currentUserTurmas.includes(aluno.turmaId))
  ), [currentUserTurmas, data.alunos]);

  const alunosPorTurma = useMemo(() => {
    const grouped = new Map();
    turmasDoProfessor.forEach(turma => grouped.set(turma.id, []));
    alunosProfessor.forEach((aluno) => {
      const turmaAlunos = grouped.get(aluno.turmaId) || [];
      turmaAlunos.push(aluno);
      grouped.set(aluno.turmaId, turmaAlunos);
    });
    return grouped;
  }, [alunosProfessor, turmasDoProfessor]);

  const alunosProfessorFiltrados = useMemo(() => {
    const term = studentSearchTerm.trim().toLowerCase();
    if (!term) return alunosProfessor;

    return alunosProfessor.filter((aluno) => {
      const turmaNome = turmasById.get(aluno.turmaId)?.nome || '';
      const empresaNome = empresasById.get(aluno.empresaId)?.nome || '';
      return [aluno.nome, aluno.email, turmaNome, empresaNome]
        .some(value => String(value || '').toLowerCase().includes(term));
    });
  }, [alunosProfessor, empresasById, studentSearchTerm, turmasById]);

  const presencasTurmaAtual = useMemo(() => {
    const alunoIds = new Set(alunosTurmaAtual.map(aluno => aluno.id));
    return data.presencas.filter(presenca => (
      alunoIds.has(presenca.alunoId) && presenca.data === selectedAttendanceDate
    ));
  }, [alunosTurmaAtual, data.presencas, selectedAttendanceDate]);

  const alunosFiltrados = useMemo(() => (
    alunosTurmaAtual.filter(aluno => aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [alunosTurmaAtual, searchTerm]);

  const totalAlunos = alunosTurmaAtual.length;
  const presentes = alunosTurmaAtual.filter(aluno => aluno.status === 'presente').length;
  const faltas = alunosTurmaAtual.filter(aluno => aluno.status === 'falta').length;
  const pendentes = alunosTurmaAtual.filter(aluno => aluno.status === 'pendente').length;
  const totalAlunosProfessor = alunosProfessor.length;
  const presentesProfessor = alunosProfessor.filter(aluno => aluno.status === 'presente').length;
  const faltasProfessor = alunosProfessor.filter(aluno => aluno.status === 'falta').length;
  const pendentesProfessor = alunosProfessor.filter(aluno => aluno.status === 'pendente').length;
  const chamadaIniciada = presencasTurmaAtual.length > 0;
  const chamadaConcluida = totalAlunos > 0 && pendentes === 0 && presencasTurmaAtual.length >= totalAlunos;

  const handleAttendanceDateChange = async (event) => {
    const nextDate = event.target.value;

    if (nextDate < semesterBounds.min || nextDate > semesterBounds.max) {
      setDateError('Selecione uma data deste semestre que não seja futura.');
      return;
    }

    setDateError('');
    setSelectedAttendanceDate(nextDate);

    if (!isSupabaseConfigured) return;

    setIsChangingDate(true);
    try {
      await reloadData?.({ attendanceDate: nextDate });
    } catch (error) {
      console.error('Erro ao carregar chamada da data selecionada:', error);
      setDateError('Não foi possível carregar a chamada desta data.');
    } finally {
      setIsChangingDate(false);
    }
  };

  const setPresenceLocal = (alunoId, status) => {
    setData(prev => ({
      ...prev,
      alunos: prev.alunos.map(aluno => aluno.id === alunoId ? { ...aluno, status } : aluno),
    }));
  };

  const executarEnvioSupabase = async (alunosParaEnviar) => {
    setIsSending(true);
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase não configurado.');
      }

      const alunosComContexto = alunosParaEnviar.map(aluno => ({
        ...aluno,
        turmaNome: turmaAtual?.nome || '',
        empresaNome: empresasById.get(aluno.empresaId)?.nome || '',
        aulaNumero: 1,
        totalAulasDia: turmaAtual?.quantidadeAulas || turmaAtual?.quantidade_aulas || 1,
      }));

      await saveAttendance({
        alunos: alunosComContexto,
        turmaId: profActiveTurma,
        professorId: currentUser.id,
        date: selectedAttendanceDate,
      });

      showToast(`Chamada sincronizada em ${formatAttendanceDate(selectedAttendanceDate)}! (${alunosParaEnviar.length} alunos)`);
    } catch (err) {
      console.error('Erro ao sincronizar chamada:', err);
      alert(`Erro ao sincronizar com o Supabase: ${err.message || 'verifique o console para mais detalhes.'}`);
    } finally {
      setIsSending(false);
    }
  };

  const submitChamada = () => {
    if (!isSupabaseConfigured) {
      alert('Supabase não configurado pelo Administrador.');
      return;
    }

    if (alunosTurmaAtual.length === 0) {
      alert('Não há alunos nesta turma.');
      return;
    }

    if (pendentes > 0) {
      requestConfirm(
        'Chamada Incompleta',
        `Existem ${pendentes} alunos pendentes. Enviar mesmo assim?`,
        () => executarEnvioSupabase(alunosTurmaAtual),
      );
    } else {
      executarEnvioSupabase(alunosTurmaAtual);
    }
  };

  return (
    <DashboardShell title="Portal do Professor" subtitle="Faça a gestão da assiduidade das suas turmas.">
      <div className="workspace-panel flex min-h-[600px] flex-col">
        {profTab === 'dashboard' && (
          <DashboardView disponiveisTurmas={turmasDoProfessor} data={data} titleContext="Turma" />
        )}

        {profTab === 'calendario' && (
          <AcademicCalendar data={data} currentUser={currentUser} />
        )}

        {profTab === 'acessibilidade' && (
          <AccessibilityPanel />
        )}

        {profTab === 'perfil' && (
          <UserProfile currentUser={currentUser} showToast={showToast} />
        )}

        {profTab === 'chamada' && (
          <div className="flex h-full flex-1 flex-col bg-slate-50">
            {currentUserTurmas.length === 0 ? (
              <div className="p-8">
                <EmptyState icon={BookOpen} title="Sem turmas vinculadas" description="Quando a Secretaria vincular uma turma ao professor, a chamada ficará disponível aqui." />
              </div>
            ) : (
              <>
                <div className="border-b border-slate-200 bg-white px-6 py-5">
                  <div className="attendance-toolbar-grid">
                    <div className="attendance-field-with-icon">
                      <div className="hidden h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600 sm:flex">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="ds-label">Turma ativa</span>
                        <SearchableSelect
                          options={turmasDoProfessor}
                          value={profActiveTurma}
                          onChange={(value) => setProfActiveTurma(value)}
                          optionLabelKey="nome"
                          optionValueKey="id"
                          placeholder="Selecionar Turma"
                        />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <label className="ds-label">Data da chamada</label>
                      <input
                        type="date"
                        value={selectedAttendanceDate}
                        min={semesterBounds.min}
                        max={semesterBounds.max}
                        onChange={handleAttendanceDateChange}
                        disabled={isChangingDate}
                        className="date-input ds-input"
                      />
                    </div>

                    <Button
                      onClick={() => exportExcelCSV(alunosTurmaAtual, data, 'chamada_turma')}
                      variant="success"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Excel
                    </Button>

                    <Button
                      onClick={() => exportPDFReport({
                        alunosParaExportar: alunosTurmaAtual,
                        data,
                        title: 'Relatorio de Chamada',
                        subtitle: 'Portal do Professor',
                        prefix: 'chamada_turma',
                        context: turmaAtual?.nome || '',
                      })}
                    >
                      <FileText className="w-4 h-4" /> PDF
                    </Button>

                    <div className="relative min-w-0">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Pesquisar aluno..."
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        className="ds-input ds-input-icon-left w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3 bg-white border-b border-slate-200">
                  <div className="ds-muted-panel flex flex-col justify-between gap-3 px-4 py-3 lg:flex-row lg:items-center">
                    <div>
                      <div className="text-sm font-semibold text-slate-800 capitalize">
                        {formatAttendanceDate(selectedAttendanceDate)}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {chamadaConcluida
                          ? 'Chamada concluida para esta turma.'
                          : chamadaIniciada
                            ? 'Chamada iniciada, ainda com pendências.'
                            : 'Chamada ainda não concluída nesta data.'}
                      </div>
                      {dateError && <div className="text-xs text-red-600 mt-1">{dateError}</div>}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="ds-badge">Total: {totalAlunos}</span>
                      <StatusBadge tone="success">Presentes: {presentes}</StatusBadge>
                      <StatusBadge tone="danger">Faltas: {faltas}</StatusBadge>
                      <StatusBadge tone="warning">Pendentes: {pendentes}</StatusBadge>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-auto bg-white">
                  {isChangingDate && (
                    <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Carregando chamada...
                    </div>
                  )}

                  {!isChangingDate && alunosFiltrados.map(aluno => (
                    <div key={aluno.id} className="flex flex-col justify-between gap-4 border-b border-slate-100 p-4 transition-colors hover:bg-slate-50 md:flex-row md:items-center">
                      <div className="flex items-center gap-4">
                        <AvatarInitial name={aluno.nome} tone={aluno.status === 'presente' ? 'emerald' : aluno.status === 'falta' ? 'red' : 'slate'} className="h-11 w-11" />
                        <div>
                          <div className="font-semibold text-slate-800 text-base">{aluno.nome}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{aluno.email}</div>
                        </div>
                      </div>

                      <div className="flex gap-2 self-end md:self-auto">
                        <button
                          onClick={() => setPresenceLocal(aluno.id, 'presente')}
                          className={`ds-button ${aluno.status === 'presente' ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm' : 'ds-button-neutral hover:text-emerald-700'}`}
                        >
                          <CheckCircle2 className="w-4 h-4" /> Presente
                        </button>
                        <button
                          onClick={() => setPresenceLocal(aluno.id, 'falta')}
                          className={`ds-button ${aluno.status === 'falta' ? 'border-red-600 bg-red-600 text-white shadow-sm' : 'ds-button-neutral hover:text-red-700'}`}
                        >
                          <XCircle className="w-4 h-4" /> Falta
                        </button>
                      </div>
                    </div>
                  ))}

                  {!isChangingDate && alunosTurmaAtual.length === 0 && (
                    <div className="p-8">
                      <EmptyState title="Nenhum aluno registrado" description="Esta turma ainda não possui alunos para chamada." />
                    </div>
                  )}
                </div>

                {alunosTurmaAtual.length > 0 && (
                  <div className="border-t border-slate-200 bg-white p-4">
                    <div className="flex justify-end">
                      <button
                        onClick={submitChamada}
                        disabled={isSending || isChangingDate}
                        className={`ds-button w-full md:w-auto ${isSending || isChangingDate ? 'bg-slate-400 text-white cursor-not-allowed' : 'ds-button-primary'}`}
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Sincronizando...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" /> {chamadaConcluida ? 'Atualizar Chamada' : 'Concluir Chamada'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {profTab === 'turmas' && (
          <div className="flex-1 bg-white p-6">
            <SectionHeader
              eyebrow="Planejamento"
              title="Minhas turmas"
              description="Acompanhe rapidamente o tamanho da turma, andamento da chamada e pendências antes de entrar em sala."
            />

            {turmasDoProfessor.length === 0 ? (
              <EmptyState icon={BookOpen} title="Sem turmas vinculadas" description="As turmas atribuídas pela Secretaria vão aparecer neste painel." />
            ) : (
              <div className="entity-grid">
                {turmasDoProfessor.map((turma) => {
                  const turmaAlunos = alunosPorTurma.get(turma.id) || [];
                  const turmaPresentes = turmaAlunos.filter(aluno => aluno.status === 'presente').length;
                  const turmaFaltas = turmaAlunos.filter(aluno => aluno.status === 'falta').length;
                  const turmaPendentes = turmaAlunos.filter(aluno => aluno.status === 'pendente').length;
                  const isActive = turma.id === profActiveTurma;

                  return (
                    <article key={turma.id} className="ds-list-item p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="section-kicker mb-2">Turma</div>
                          <h3 className="truncate text-base font-semibold text-slate-950">{turma.nome}</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {turma.quantidadeAulas || turma.quantidade_aulas || 1} aulas/dia
                          </p>
                        </div>
                        <StatusBadge tone={isActive ? 'success' : 'neutral'}>
                          {isActive ? 'Ativa' : 'Disponivel'}
                        </StatusBadge>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="ds-muted-panel p-3">
                          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Alunos</div>
                          <div className="mt-1 text-2xl font-semibold text-slate-950">{turmaAlunos.length}</div>
                        </div>
                        <div className="ds-muted-panel p-3">
                          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Pendencias</div>
                          <div className="mt-1 text-2xl font-semibold text-slate-950">{turmaPendentes}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <StatusBadge tone="success">Presentes: {turmaPresentes}</StatusBadge>
                        <StatusBadge tone="danger">Faltas: {turmaFaltas}</StatusBadge>
                        <StatusBadge tone="warning">Pendentes: {turmaPendentes}</StatusBadge>
                      </div>

                      <Button
                        className="mt-5 w-full"
                        onClick={() => setProfActiveTurma(turma.id)}
                        variant={isActive ? 'success' : 'neutral'}
                      >
                        <BookOpen className="h-4 w-4" />
                        {isActive ? 'Selecionada' : 'Usar na chamada'}
                      </Button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {profTab === 'aprendizes' && (
          <div className="flex-1 bg-white p-6">
            <SectionHeader
              eyebrow="Acompanhamento"
              title="Aprendizes"
              description="Consulte os aprendizes das suas turmas com turma, empresa parceira e status atual da chamada."
              actions={(
                <div className="relative min-w-[16rem]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar aprendiz..."
                    value={studentSearchTerm}
                    onChange={event => setStudentSearchTerm(event.target.value)}
                    className="ds-input ds-input-icon-left w-full"
                  />
                </div>
              )}
            />

            {alunosProfessor.length === 0 ? (
              <EmptyState icon={Users} title="Nenhum aprendiz encontrado" description="Quando houver alunos vinculados as suas turmas, eles aparecerao aqui." />
            ) : alunosProfessorFiltrados.length === 0 ? (
              <EmptyState icon={Search} title="Nenhum resultado" description="Tente buscar por nome, e-mail, turma ou empresa." />
            ) : (
              <div className="space-y-3">
                {alunosProfessorFiltrados.map((aluno) => {
                  const turma = turmasById.get(aluno.turmaId);
                  const empresa = empresasById.get(aluno.empresaId);
                  const tone = aluno.status === 'presente' ? 'success' : aluno.status === 'falta' ? 'danger' : 'warning';

                  return (
                    <article key={aluno.id} className="ds-list-item flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <AvatarInitial name={aluno.nome} tone={aluno.status === 'presente' ? 'emerald' : aluno.status === 'falta' ? 'red' : 'amber'} className="h-11 w-11" />
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-slate-900">{aluno.nome}</h3>
                          <p className="truncate text-sm text-slate-500">{aluno.email}</p>
                        </div>
                      </div>

                      <div className="grid min-w-0 gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:w-[34rem]">
                        <div className="flex min-w-0 items-center gap-2">
                          <BookOpen className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{turma?.nome || 'Turma não informada'}</span>
                        </div>
                        <div className="flex min-w-0 items-center gap-2">
                          <BriefcaseBusiness className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{empresa?.nome || 'Empresa não informada'}</span>
                        </div>
                      </div>

                      <StatusBadge tone={tone}>
                        {aluno.status === 'presente' ? 'Presente' : aluno.status === 'falta' ? 'Falta' : 'Pendente'}
                      </StatusBadge>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {profTab === 'relatorios' && (
          <div className="flex-1 bg-white p-6">
            <SectionHeader
              eyebrow="Relatórios"
              title="Exportacoes e resumos"
              description="Gere arquivos para acompanhamento pedagogico sem depender de configuracoes externas nesta etapa."
              actions={(
                <>
                  <Button
                    onClick={() => exportExcelCSV(alunosProfessor, data, 'relatorio_professor')}
                    variant="success"
                  >
                    <FileSpreadsheet className="h-4 w-4" /> Excel geral
                  </Button>
                  <Button
                    onClick={() => exportPDFReport({
                      alunosParaExportar: alunosProfessor,
                      data,
                      title: 'Relatório do Professor',
                      subtitle: 'Resumo consolidado das turmas',
                      prefix: 'relatorio_professor',
                      context: currentUser?.nome || currentUser?.name || 'Professor',
                    })}
                  >
                    <FileText className="h-4 w-4" /> PDF geral
                  </Button>
                </>
              )}
            />

            <div className="dashboard-metrics-grid">
              <div className="metric-card ds-surface p-5">
                <div className="metric-card-header">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Turmas</div>
                    <div className="mt-3 text-3xl font-semibold text-slate-950">{turmasDoProfessor.length}</div>
                  </div>
                  <BookOpen className="h-5 w-5 text-red-500" />
                </div>
              </div>
              <div className="metric-card ds-surface p-5">
                <div className="metric-card-header">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Aprendizes</div>
                    <div className="mt-3 text-3xl font-semibold text-slate-950">{totalAlunosProfessor}</div>
                  </div>
                  <Users className="h-5 w-5 text-slate-500" />
                </div>
              </div>
              <div className="metric-card ds-surface p-5">
                <div className="metric-card-header">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Presentes</div>
                    <div className="mt-3 text-3xl font-semibold text-slate-950">{presentesProfessor}</div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div className="metric-card ds-surface p-5">
                <div className="metric-card-header">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Faltas</div>
                    <div className="mt-3 text-3xl font-semibold text-slate-950">{faltasProfessor}</div>
                  </div>
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="metric-card ds-surface p-5">
                <div className="metric-card-header">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Pendentes</div>
                    <div className="mt-3 text-3xl font-semibold text-slate-950">{pendentesProfessor}</div>
                  </div>
                  <CalendarDays className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
              <div className="ds-surface p-5">
                <div className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-950">
                  <BarChart3 className="h-5 w-5 text-red-600" />
                  Relatórios por turma
                </div>
                <div className="space-y-3">
                  {turmasDoProfessor.map((turma) => {
                    const turmaAlunos = alunosPorTurma.get(turma.id) || [];
                    return (
                      <div key={turma.id} className="ds-muted-panel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-slate-900">{turma.nome}</h3>
                          <p className="mt-1 text-xs text-slate-500">{turmaAlunos.length} aprendizes vinculados</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => exportExcelCSV(turmaAlunos, data, `turma_${turma.id}`)}
                            variant="success"
                          >
                            <FileSpreadsheet className="h-4 w-4" /> Excel
                          </Button>
                          <Button
                            onClick={() => exportPDFReport({
                              alunosParaExportar: turmaAlunos,
                              data,
                              title: 'Relatório da Turma',
                              subtitle: turma.nome,
                              prefix: `turma_${turma.id}`,
                              context: turma.nome,
                            })}
                          >
                            <FileText className="h-4 w-4" /> PDF
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <aside className="ds-surface p-5">
                <div className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-950">
                  <CalendarDays className="h-5 w-5 text-red-600" />
                  Chamada atual
                </div>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="ds-muted-panel p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Data selecionada</div>
                    <div className="mt-1 font-semibold text-slate-900 capitalize">{formatAttendanceDate(selectedAttendanceDate)}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="ds-badge">Total: {totalAlunos}</span>
                    <StatusBadge tone="success">Presentes: {presentes}</StatusBadge>
                    <StatusBadge tone="danger">Faltas: {faltas}</StatusBadge>
                    <StatusBadge tone="warning">Pendentes: {pendentes}</StatusBadge>
                  </div>
                  <p className="leading-6">
                    Use os relatórios por turma para compartilhar indicadores simples de assiduidade com coordenação, empresas parceiras e administração.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
