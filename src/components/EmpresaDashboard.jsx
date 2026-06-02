// src/components/EmpresaDashboard.jsx
import { useMemo, useState } from 'react';
import DashboardShell from './DashboardShell';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileSpreadsheet,
  FileText,
  Loader2,
} from 'lucide-react';
import DashboardView from './DashboardView';
import DatePicker from './ui/DatePicker';
import { Button, EmptyState, SectionHeader, StatusBadge } from './ui/DesignSystem';
import PersonAvatar from './ui/PersonAvatar';
import AcademicCalendar from './AcademicCalendar';
import AttendanceHistory from './AttendanceHistory';
import UserProfile from './UserProfile';
import { exportExcelCSV, exportPDFReport } from '../utils/utils';
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
  showToast,
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
      setDateError('Não é possível visualizar uma data futura.');
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
      setDateError('Não foi possível carregar esta data.');
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
  <title>Relatório de Assiduidade - ${escapeHtml(currentUser.nome)}</title>
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
        <h1>Relatório de Assiduidade</h1>
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
    Este relatório consolida os registros de chamada enviados pelos professores no período selecionado.
    Dias sem chamada registrada não entram no cálculo da taxa.
  </div>
  <div class="footer">
    <span>SENAI - Diário Digital</span>
    <span>Documento gerado automaticamente</span>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
  };

  const generateReport = async () => {
    if (!isSupabaseConfigured) {
      alert('Supabase não configurado.');
      return;
    }
    if (alunosEmpresa.length === 0) {
      alert('Não há aprendizes vinculados a esta empresa.');
      return;
    }

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      alert('Permita pop-ups para gerar o relatório em PDF.');
      return;
    }
    reportWindow.document.open();
    reportWindow.document.write('<p style="font-family: Arial, sans-serif; padding: 24px;">Gerando relatório...</p>');
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
      alert(`Não foi possível gerar o relatório: ${error.message || 'verifique o console.'}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <DashboardShell title="Portal da Empresa Parceira" subtitle={`Acompanhe a assiduidade dos seus aprendizes vinculados. ${dataFormatada ? dataFormatada : ''}`}>
      <div className="workspace-panel min-h-[600px]">
        <div className="border-b border-slate-200 bg-white p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div className="toolbar-grid">
              <label>
                <span className="ds-label">Data de visualizacao</span>
                <DatePicker
                  value={selectedAttendanceDate}
                  max={today}
                  onChange={handleAttendanceDateChange}
                  disabled={isChangingDate}
                  className="date-input"
                />
              </label>
              <label>
                <span className="ds-label">Período do relatório</span>
                <select
                  value={reportPeriod}
                  onChange={(event) => setReportPeriod(Number(event.target.value))}
                  className="ds-input w-full"
                >
                  <option value={15}>Ultimos 15 dias</option>
                  <option value={30}>Ultimos 30 dias</option>
                </select>
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => exportExcelCSV(alunosEmpresa, data, 'empresa_alunos')}
                variant="success"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </Button>
              <Button
                onClick={() => exportPDFReport({
                  alunosParaExportar: alunosEmpresa,
                  data,
                  title: 'Relatório de Aprendizes',
                  subtitle: currentUser.nome || 'Empresa parceira',
                  prefix: 'empresa_alunos',
                  context: `Status em ${formatDate(selectedAttendanceDate)}`,
                })}
              >
                <FileText className="w-4 h-4" /> PDF
              </Button>
              <Button
                onClick={generateReport}
                disabled={isGeneratingReport}
                variant="primary"
              >
                {isGeneratingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                PDF periodo
              </Button>
            </div>
          </div>
          {dateError && <p className="text-xs text-red-600 mt-2">{dateError}</p>}
        </div>

        {empresaTab === 'dashboard' && (
          <DashboardView disponiveisTurmas={[{ id: 'all_empresa', nome: 'Todos os Aprendizes' }]} data={dataEmpresa} titleContext="Aprendizes" />
        )}

        {empresaTab === 'historico' && (
          <AttendanceHistory data={data} currentUser={currentUser} />
        )}

        {empresaTab === 'calendario' && (
          <AcademicCalendar data={data} currentUser={currentUser} />
        )}

        {empresaTab === 'perfil' && (
          <UserProfile currentUser={currentUser} showToast={showToast} />
        )}

        {empresaTab === 'alunos' && (
          <div className="p-6 space-y-4">
            <SectionHeader
              eyebrow="Acompanhamento"
              title="Aprendizes registrados"
              description={`Status referente a ${formatDate(selectedAttendanceDate)}.`}
              actions={isChangingDate && <span className="ds-badge"><Loader2 className="w-4 h-4 animate-spin" /> Carregando</span>}
            />
            {alunosEmpresa.length === 0 ? (
              <EmptyState title="Nenhum aprendiz vinculado" description="Quando a Secretaria vincular alunos a esta empresa, eles aparecerão aqui." />
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                {alunosEmpresa.map(aluno => (
                  <div key={aluno.id} className="flex flex-col justify-between gap-4 border-b border-slate-100 p-4 transition-colors last:border-b-0 hover:bg-slate-50 md:flex-row md:items-center">
                    <div className="flex items-center gap-4">
                      <PersonAvatar person={aluno} size={44} />
                      <div>
                        <div className="font-bold text-slate-900">{aluno.nome}</div>
                        <div className="text-xs text-slate-500 mt-0.5"><span className="font-medium">{data.turmas.find(t=>t.id===aluno.turmaId)?.nome || 'Sem Turma'}</span> - {aluno.email}</div>
                      </div>
                    </div>
                    <div className="flex self-end md:self-auto">
                      {aluno.status === 'presente' && <StatusBadge tone="success" icon={CheckCircle2}>{statusLabel(aluno.status)}</StatusBadge>}
                      {aluno.status === 'falta' && <StatusBadge tone="danger" icon={XCircle}>{statusLabel(aluno.status)}</StatusBadge>}
                      {aluno.status === 'pendente' && <StatusBadge icon={Clock}>{statusLabel(aluno.status)}</StatusBadge>}
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
