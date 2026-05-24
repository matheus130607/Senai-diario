// src/components/EmpresaDashboard.jsx
import { useMemo, useState } from 'react';
import DashboardShell from './DashboardShell';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileSpreadsheet,
  FileText,
  Loader2,
} from 'lucide-react';
import DashboardView from './DashboardView';
import { exportExcelCSV } from '../utils/utils';
import { loadAttendanceRange } from '../services/supabaseDataService';

const SENAI_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/8/8c/SENAI_S%C3%A3o_Paulo_logo.png';

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (dateValue, amount) => {
  const [year, month, day] = String(dateValue).split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return toDateInputValue(date);
};

const formatDate = (value) => {
  const [year, month, day] = String(value || '').split('-').map(Number);
  if (!year || !month || !day) return '';
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
};

const statusLabel = (status) => {
  if (status === 'presente') return 'Presente';
  if (status === 'falta') return 'Faltou';
  return 'Pendente';
};

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export default function EmpresaDashboard({
  data,
  currentUser,
  empresaTab,
  dataFormatada,
  isSupabaseConfigured,
  reloadData,
  selectedAttendanceDate,
  setSelectedAttendanceDate,
}) {
  const [isChangingDate, setIsChangingDate] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportPeriod, setReportPeriod] = useState(15);
  const [dateError, setDateError] = useState('');

  const today = toDateInputValue(new Date());
  const alunosEmpresa = useMemo(() => (
    data.alunos.filter(aluno => aluno.empresaId === currentUser.id)
  ), [currentUser.id, data.alunos]);

  const dataEmpresa = useMemo(() => ({
    ...data,
    alunos: alunosEmpresa,
  }), [alunosEmpresa, data]);

  const handleAttendanceDateChange = async (event) => {
    const nextDate = event.target.value;
    if (nextDate > today) {
      setDateError('Nao e possivel visualizar uma data futura.');
      return;
    }

    setDateError('');
    setSelectedAttendanceDate(nextDate);
    if (!isSupabaseConfigured) return;

    setIsChangingDate(true);
    try {
      await reloadData?.({ attendanceDate: nextDate });
    } catch (error) {
      console.error('Erro ao carregar presencas da empresa:', error);
      setDateError('Nao foi possivel carregar esta data.');
    } finally {
      setIsChangingDate(false);
    }
  };

  const buildReportHtml = ({ startDate, endDate, presencas }) => {
    const presencasByAlunoId = new Map();
    presencas.forEach((presenca) => {
      if (!presencasByAlunoId.has(presenca.alunoId)) presencasByAlunoId.set(presenca.alunoId, []);
      presencasByAlunoId.get(presenca.alunoId).push(presenca);
    });

    const rows = alunosEmpresa.map((aluno) => {
      const registros = presencasByAlunoId.get(aluno.id) || [];
      const presentes = registros.filter(registro => registro.status === 'presente').length;
      const faltas = registros.filter(registro => registro.status === 'falta').length;
      const total = presentes + faltas;
      const taxa = total === 0 ? 0 : Math.round((presentes / total) * 100);
      const diasFalta = registros
        .filter(registro => registro.status === 'falta')
        .map(registro => formatDate(registro.data));

      return {
        aluno,
        presentes,
        faltas,
        total,
        taxa,
        diasFalta,
      };
    });

    const totalPresentes = rows.reduce((sum, row) => sum + row.presentes, 0);
    const totalFaltas = rows.reduce((sum, row) => sum + row.faltas, 0);
    const totalRegistros = totalPresentes + totalFaltas;
    const taxaGeral = totalRegistros === 0 ? 0 : Math.round((totalPresentes / totalRegistros) * 100);

    const tableRows = rows.map((row) => `
      <tr>
        <td>
          <strong>${escapeHtml(row.aluno.nome)}</strong>
          <span>${escapeHtml(row.aluno.email)}</span>
        </td>
        <td>${escapeHtml(data.turmas.find(turma => turma.id === row.aluno.turmaId)?.nome || 'Sem turma')}</td>
        <td>${row.presentes}</td>
        <td>${row.faltas}</td>
        <td>${row.taxa}%</td>
        <td>${row.diasFalta.length > 0 ? escapeHtml(row.diasFalta.join(', ')) : 'Sem faltas registradas'}</td>
      </tr>
    `).join('');

    return `
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatorio de Assiduidade - ${escapeHtml(currentUser.nome)}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #dc2626; padding-bottom: 18px; margin-bottom: 22px; }
    .brand { display: flex; gap: 16px; align-items: center; }
    .brand img { height: 48px; object-fit: contain; }
    .title h1 { margin: 0; font-size: 22px; letter-spacing: 0; }
    .title p { margin: 5px 0 0; color: #64748b; font-size: 12px; }
    .meta { text-align: right; font-size: 12px; color: #475569; line-height: 1.5; }
    .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 22px; }
    .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
    .card span { display: block; color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700; }
    .card strong { display: block; font-size: 24px; margin-top: 6px; }
    .section-title { font-size: 13px; text-transform: uppercase; color: #334155; margin: 22px 0 10px; letter-spacing: .04em; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { text-align: left; background: #111827; color: #fff; padding: 9px; font-size: 10px; text-transform: uppercase; }
    td { border-bottom: 1px solid #e2e8f0; padding: 9px; vertical-align: top; }
    td span { display: block; color: #64748b; margin-top: 3px; font-size: 10px; }
    .note { margin-top: 18px; padding: 12px; border-left: 4px solid #dc2626; background: #fef2f2; font-size: 11px; color: #7f1d1d; line-height: 1.5; }
    .footer { margin-top: 28px; display: flex; justify-content: space-between; color: #64748b; font-size: 10px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <img src="${SENAI_LOGO_URL}" alt="SENAI" />
      <div class="title">
        <h1>Relatorio de Assiduidade</h1>
        <p>Aprendizes vinculados a empresa parceira</p>
      </div>
    </div>
    <div class="meta">
      <strong>${escapeHtml(currentUser.nome)}</strong><br />
      Periodo: ${formatDate(startDate)} a ${formatDate(endDate)}<br />
      Emitido em: ${new Date().toLocaleDateString('pt-BR')}
    </div>
  </div>

  <div class="cards">
    <div class="card"><span>Aprendizes</span><strong>${rows.length}</strong></div>
    <div class="card"><span>Taxa geral</span><strong>${taxaGeral}%</strong></div>
    <div class="card"><span>Presencas</span><strong>${totalPresentes}</strong></div>
    <div class="card"><span>Faltas</span><strong>${totalFaltas}</strong></div>
  </div>

  <h2 class="section-title">Resumo por aprendiz</h2>
  <table>
    <thead>
      <tr>
        <th>Aprendiz</th>
        <th>Turma</th>
        <th>Presencas</th>
        <th>Faltas</th>
        <th>Taxa</th>
        <th>Dias de falta</th>
      </tr>
    </thead>
    <tbody>${tableRows || '<tr><td colspan="6">Nenhum aprendiz encontrado para este periodo.</td></tr>'}</tbody>
  </table>

  <div class="note">
    Este relatorio consolida os registros de chamada enviados pelos professores no periodo selecionado.
    Dias sem chamada registrada nao entram no calculo da taxa.
  </div>
  <div class="footer">
    <span>SENAI - Portal de Gestao Escolar Somativa</span>
    <span>Documento gerado automaticamente</span>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
  };

  const generateReport = async () => {
    if (!isSupabaseConfigured) {
      alert('Supabase nao configurado.');
      return;
    }
    if (alunosEmpresa.length === 0) {
      alert('Nao ha aprendizes vinculados a esta empresa.');
      return;
    }

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      alert('Permita pop-ups para gerar o relatorio em PDF.');
      return;
    }
    reportWindow.document.open();
    reportWindow.document.write('<p style="font-family: Arial, sans-serif; padding: 24px;">Gerando relatorio...</p>');
    reportWindow.document.close();

    setIsGeneratingReport(true);
    try {
      const endDate = selectedAttendanceDate || today;
      const startDate = addDays(endDate, -(Number(reportPeriod) - 1));
      const presencas = await loadAttendanceRange({
        startDate,
        endDate,
        alunoIds: alunosEmpresa.map(aluno => aluno.id),
      });
      reportWindow.document.open();
      reportWindow.document.write(buildReportHtml({ startDate, endDate, presencas }));
      reportWindow.document.close();
    } catch (error) {
      console.error('Erro ao gerar relatorio da empresa:', error);
      alert(`Nao foi possivel gerar o relatorio: ${error.message || 'verifique o console.'}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <DashboardShell title="Portal do Parceiro" subtitle={`Acompanhe a assiduidade dos seus aprendizes. ${dataFormatada ? dataFormatada : ''}`}>
      <div className="bg-white border border-t-0 border-slate-200 rounded-b-2xl shadow-sm min-h-[600px]">
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label>
                <span className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Data de visualizacao</span>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="date"
                    value={selectedAttendanceDate}
                    max={today}
                    onChange={handleAttendanceDateChange}
                    disabled={isChangingDate}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </label>
              <label>
                <span className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Periodo do relatorio</span>
                <select
                  value={reportPeriod}
                  onChange={(event) => setReportPeriod(Number(event.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                >
                  <option value={15}>Ultimos 15 dias</option>
                  <option value={30}>Ultimos 30 dias</option>
                </select>
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => exportExcelCSV(alunosEmpresa, data, 'empresa_alunos')}
                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border border-emerald-300"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button
                onClick={generateReport}
                disabled={isGeneratingReport}
                className="bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                {isGeneratingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Relatorio PDF
              </button>
            </div>
          </div>
          {dateError && <p className="text-xs text-red-600 mt-2">{dateError}</p>}
        </div>

        {empresaTab === 'dashboard' && (
          <DashboardView disponiveisTurmas={[{ id: 'all_empresa', nome: 'Todos os Aprendizes' }]} data={dataEmpresa} titleContext="Aprendizes" />
        )}
        {empresaTab === 'alunos' && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-semibold text-slate-800">Aprendizes Registrados</h2>
                <p className="text-xs text-slate-500 mt-1">Status referente a {formatDate(selectedAttendanceDate)}.</p>
              </div>
              {isChangingDate && <span className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando</span>}
            </div>
            {alunosEmpresa.length === 0 ? (
              <div className="p-12 text-center text-slate-500 border border-slate-200 rounded-xl">Nenhum aluno esta atualmente vinculado a sua empresa.</div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {alunosEmpresa.map(aluno => (
                  <div key={aluno.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-slate-50 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-amber-600 bg-amber-100 font-bold text-sm shadow-sm">{aluno.nome.charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="font-semibold text-slate-800">{aluno.nome}</div>
                        <div className="text-xs text-slate-500 mt-0.5"><span className="font-medium">{data.turmas.find(t=>t.id===aluno.turmaId)?.nome || 'Sem Turma'}</span> - {aluno.email}</div>
                      </div>
                    </div>
                    <div className="flex self-end md:self-auto">
                      {aluno.status === 'presente' && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-4 h-4" /> {statusLabel(aluno.status)}</span>}
                      {aluno.status === 'falta' && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-50 text-red-700 border border-red-200"><XCircle className="w-4 h-4" /> {statusLabel(aluno.status)}</span>}
                      {aluno.status === 'pendente' && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-slate-50 text-slate-500 border border-slate-200"><Clock className="w-4 h-4" /> {statusLabel(aluno.status)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
