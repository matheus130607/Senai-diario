// src/components/ProfessorDashboard.jsx
import { useEffect, useMemo, useState } from 'react';
import DashboardShell from './DashboardShell';
import {
  BookOpen,
  Search,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Loader2,
  Send,
  Calendar,
} from 'lucide-react';
import DashboardView from './DashboardView';
import SearchableSelect from './ui/SearchableSelect';
import { exportExcelCSV } from '../utils/utils';

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
  dataFormatada,
  saveAttendance,
  isSupabaseConfigured,
  reloadData,
  selectedAttendanceDate,
  setSelectedAttendanceDate,
}) {
  const [searchTerm, setSearchTerm] = useState('');
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

  const empresasById = useMemo(() => (
    new Map((data.empresas || []).map(empresa => [empresa.id, empresa]))
  ), [data.empresas]);

  const presencasTurmaAtual = useMemo(() => {
    const alunoIds = new Set(alunosTurmaAtual.map(aluno => aluno.id));
    return data.presencas.filter(presenca => alunoIds.has(presenca.alunoId));
  }, [alunosTurmaAtual, data.presencas]);

  const alunosFiltrados = useMemo(() => (
    alunosTurmaAtual.filter(aluno => aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [alunosTurmaAtual, searchTerm]);

  const totalAlunos = alunosTurmaAtual.length;
  const presentes = alunosTurmaAtual.filter(aluno => aluno.status === 'presente').length;
  const faltas = alunosTurmaAtual.filter(aluno => aluno.status === 'falta').length;
  const pendentes = alunosTurmaAtual.filter(aluno => aluno.status === 'pendente').length;
  const chamadaIniciada = presencasTurmaAtual.length > 0;
  const chamadaConcluida = totalAlunos > 0 && pendentes === 0 && presencasTurmaAtual.length >= totalAlunos;

  const handleAttendanceDateChange = async (event) => {
    const nextDate = event.target.value;

    if (nextDate < semesterBounds.min || nextDate > semesterBounds.max) {
      setDateError('Selecione uma data deste semestre que nao seja futura.');
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
      setDateError('Nao foi possivel carregar a chamada desta data.');
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
        throw new Error('Supabase nao configurado.');
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
      alert('Supabase nao configurado pelo Administrador.');
      return;
    }

    if (alunosTurmaAtual.length === 0) {
      alert('Nao ha alunos nesta turma.');
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
    <DashboardShell title="Portal do Professor" subtitle={`Faca a gestao da assiduidade das suas turmas. ${dataFormatada ? dataFormatada : ''}`}>
      <div className="bg-white border border-t-0 border-slate-200 rounded-b-2xl shadow-sm min-h-[600px] flex flex-col overflow-hidden">
        {profTab === 'dashboard' && (
          <DashboardView disponiveisTurmas={turmasDoProfessor} data={data} titleContext="Turma" />
        )}

        {profTab === 'chamada' && (
          <div className="flex flex-col h-full bg-slate-50 flex-1">
            {currentUserTurmas.length === 0 ? (
              <div className="p-12 text-center text-slate-500">Nao esta vinculado a nenhuma turma neste momento.</div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-slate-200 bg-white flex flex-col xl:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2 w-full xl:w-auto">
                    <BookOpen className="w-5 h-5 text-slate-500" />
                    <div className="w-full md:w-64">
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

                  <div className="flex flex-col md:flex-row md:items-end gap-3 w-full xl:w-auto">
                    <div className="flex flex-col gap-1 w-full md:w-auto">
                      <label className="text-[11px] font-semibold uppercase text-slate-500">Data da chamada</label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          type="date"
                          value={selectedAttendanceDate}
                          min={semesterBounds.min}
                          max={semesterBounds.max}
                          onChange={handleAttendanceDateChange}
                          disabled={isChangingDate}
                          className="w-full md:w-44 pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 outline-none transition focus:ring-2 focus:ring-red-100 focus:border-red-500 disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => exportExcelCSV(alunosTurmaAtual, data, 'chamada_turma')}
                      className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border border-emerald-300"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Excel
                    </button>

                    <div className="relative w-full md:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Pesquisar aluno..."
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3 bg-white border-b border-slate-200">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-800 capitalize">
                        {formatAttendanceDate(selectedAttendanceDate)}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {chamadaConcluida
                          ? 'Chamada concluida para esta turma.'
                          : chamadaIniciada
                            ? 'Chamada iniciada, ainda com pendencias.'
                            : 'Chamada ainda nao concluida nesta data.'}
                      </div>
                      {dateError && <div className="text-xs text-red-600 mt-1">{dateError}</div>}
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600">Total: {totalAlunos}</span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">Presentes: {presentes}</span>
                      <span className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700">Faltas: {faltas}</span>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">Pendentes: {pendentes}</span>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-200 bg-white flex-1 overflow-auto">
                  {isChangingDate && (
                    <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Carregando chamada...
                    </div>
                  )}

                  {!isChangingDate && alunosFiltrados.map(aluno => (
                    <div key={aluno.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-slate-50 gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ${aluno.status === 'presente' ? 'bg-emerald-500' : aluno.status === 'falta' ? 'bg-red-500' : 'bg-slate-300'}`}>
                          {aluno.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-base">{aluno.nome}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{aluno.email}</div>
                        </div>
                      </div>

                      <div className="flex gap-2 self-end md:self-auto">
                        <button
                          onClick={() => setPresenceLocal(aluno.id, 'presente')}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm border ${aluno.status === 'presente' ? 'bg-emerald-500 text-white border-emerald-600 ring-2 ring-emerald-500 ring-offset-1' : 'bg-white text-slate-500 border-slate-200 hover:bg-emerald-50'}`}
                        >
                          <CheckCircle2 className="w-4 h-4" /> Presente
                        </button>
                        <button
                          onClick={() => setPresenceLocal(aluno.id, 'falta')}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm border ${aluno.status === 'falta' ? 'bg-red-500 text-white border-red-600 ring-2 ring-red-500 ring-offset-1' : 'bg-white text-slate-500 border-slate-200 hover:bg-red-50'}`}
                        >
                          <XCircle className="w-4 h-4" /> Falta
                        </button>
                      </div>
                    </div>
                  ))}

                  {!isChangingDate && alunosTurmaAtual.length === 0 && (
                    <div className="p-12 text-center text-slate-500">Nenhum aluno registado nesta turma.</div>
                  )}
                </div>

                {alunosTurmaAtual.length > 0 && (
                  <div className="bg-white border-t border-slate-200 p-4">
                    <div className="flex justify-end">
                      <button
                        onClick={submitChamada}
                        disabled={isSending || isChangingDate}
                        className={`w-full md:w-auto py-3 px-5 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors text-base ${isSending || isChangingDate ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
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
      </div>
    </DashboardShell>
  );
}
