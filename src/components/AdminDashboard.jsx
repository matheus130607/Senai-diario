// src/components/AdminDashboard.jsx
import { useState } from 'react';
import DashboardShell from './DashboardShell';
import { AlertTriangle, BookOpen, Settings, Edit, Trash2, CheckSquare, Square, Download, FileSpreadsheet, FileText, Database, RefreshCw } from 'lucide-react';
import DashboardView from './DashboardView';
import SearchableSelect from './ui/SearchableSelect';
import { AvatarInitial, Button, IconButton, SectionHeader, StatusBadge } from './ui/DesignSystem';
import AcademicCalendar from './AcademicCalendar';
import AccessibilityPanel from './AccessibilityPanel';
import AutomationCenter from './AutomationCenter';
import TicAdminTools from './TicAdminTools';
import UserProfile from './UserProfile';
import { emptyEmpresaForm, emptyTurmaForm, useCrudOperations } from '../hooks/useCrudOperations';
import { getRoleLabel } from '../utils/permissions';
import { exportJSON, exportExcelCSV, exportPDFReport } from '../utils/utils';

export default function AdminDashboard({ 
  data,
  setData,
  currentUser,
  adminTab,
  showToast,
  requestConfirm,
  syncStatus = 'not_configured',
  syncError = '',
  isSupabaseConfigured = false,
  reloadData,
}) {
  const [editingTurma, setEditingTurma] = useState(null);
  const [editingProfessor, setEditingProfessor] = useState(null);
  const [editingEmpresa, setEditingEmpresa] = useState(null);
  const [editingAluno, setEditingAluno] = useState(null);
  
  const [formTurma, setFormTurma] = useState(emptyTurmaForm);
  const [formProf, setFormProf] = useState({ nome: '', cpf: '', nif: '', telefone: '', email: '', senha: '', turmas: [] });
  const [formEmpresa, setFormEmpresa] = useState(emptyEmpresaForm);
  const [formAluno, setFormAluno] = useState({ nome: '', cpf: '', telefone: '', email: '', turmaId: '', empresaId: '' });

  const crudOps = useCrudOperations(data, setData, showToast, requestConfirm);

  const syncLabels = {
    loading: 'Carregando',
    saving: 'Salvando',
    synced: 'Sincronizado',
    error: 'Erro',
    not_configured: 'Nao configurado',
  };
  const labelClass = 'ds-label';
  const inputClass = 'ds-input';
  const parseDateOnly = (value) => {
    const [year, month, day] = String(value || '').split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };
  const todayDateOnly = (() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  })();
  const turmasProximasDoFim = data.turmas
    .map((turma) => {
      const dataFim = parseDateOnly(turma.dataFim);
      if (!dataFim || turma.status === 'Concluido') return null;
      const diasRestantes = Math.ceil((dataFim.getTime() - todayDateOnly.getTime()) / 86400000);
      if (diasRestantes < 0 || diasRestantes > 30) return null;
      return { ...turma, diasRestantes };
    })
    .filter(Boolean);
  const isTurmaVinculavel = (turma) => ['Ativo', 'Pausado'].includes(turma.status);
  const turmasVinculaveis = data.turmas.filter(isTurmaVinculavel);

  const handleManualSync = async () => {
    try {
      await reloadData?.();
      showToast("Dados sincronizados com Supabase!");
    } catch (error) {
      console.error('Erro ao sincronizar manualmente:', error);
      alert('Nao foi possivel sincronizar com o Supabase.');
    }
  };

  const handleReloadData = async () => {
    try {
      await reloadData?.();
      showToast("Dados recarregados do Supabase!");
    } catch (error) {
      console.error('Erro ao recarregar dados:', error);
      alert('Nao foi possivel recarregar os dados do Supabase.');
    }
  };

  const toggleProfTurma = (turmaId) => {
    setFormProf(prev => {
      const turmas = prev.turmas.includes(turmaId) ? prev.turmas.filter(id => id !== turmaId) : [...prev.turmas, turmaId];
      return { ...prev, turmas };
    });
  };

  return (
    <DashboardShell title={`Painel de ${getRoleLabel(currentUser?.role)}`} subtitle="Faça a gestão de turmas, professores, empresas parceiras, alunos, calendário, automações e integrações.">
      

      <div className="workspace-panel min-h-[600px]">
        {turmasProximasDoFim.length > 0 && (
          <div className="m-6 mb-0 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold">Turmas proximas da data final</h3>
                  <p className="text-xs text-amber-800 mt-1">
                    Estas turmas estao a ate 30 dias do encerramento. Apos a data final, o status passa automaticamente para Concluido.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {turmasProximasDoFim.map((turma) => (
                  <span key={turma.id} className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-bold text-amber-800">
                    {turma.nome}: {turma.diasRestantes === 0 ? 'encerra hoje' : `${turma.diasRestantes} dia(s)`}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {adminTab === 'dashboard' && <DashboardView disponiveisTurmas={data.turmas} data={data} titleContext="Turma" />}

        {adminTab === 'calendario' && (
          <AcademicCalendar data={data} currentUser={currentUser} />
        )}

        {adminTab === 'automacoes' && (
          <AutomationCenter data={data} showToast={showToast} />
        )}

        {adminTab === 'acessibilidade' && (
          <AccessibilityPanel />
        )}

        {adminTab === 'perfil' && (
          <UserProfile currentUser={currentUser} showToast={showToast} />
        )}

        {adminTab === 'tic' && currentUser?.role === 'tic' && (
          <TicAdminTools data={data} syncStatus={syncStatus} syncError={syncError} showToast={showToast} />
        )}

        {adminTab === 'turmas' && (
          <div className="p-6">
            <SectionHeader
              eyebrow="Academico"
              title="Turmas"
              description="Organize ciclos, status e carga diaria para orientar chamadas e vinculos."
            />
            <form onSubmit={(e) => crudOps.saveTurma(e, editingTurma, formTurma, setEditingTurma, setFormTurma)} className="ds-form mb-8 space-y-5">
              <h3 className="text-sm font-extrabold text-slate-900">{editingTurma ? 'Editar turma' : 'Nova turma'}</h3>
              <div className="form-grid">
                <label>
                  <span className={labelClass}>Nome da turma</span>
                  <input type="text" value={formTurma.nome} onChange={e => setFormTurma({...formTurma, nome: e.target.value})} placeholder="Ex: Logística A" className={inputClass} required />
                </label>
                <label>
                  <span className={labelClass}>Data de início</span>
                  <input type="date" value={formTurma.dataInicio || ''} onChange={e => setFormTurma({...formTurma, dataInicio: e.target.value})} className={inputClass} />
                </label>
                <label>
                  <span className={labelClass}>Data de fim</span>
                  <input type="date" value={formTurma.dataFim || ''} onChange={e => setFormTurma({...formTurma, dataFim: e.target.value})} className={inputClass} />
                </label>
                <label>
                  <span className={labelClass}>Aulas por dia</span>
                  <input type="number" min="1" value={formTurma.quantidadeAulas || ''} onChange={e => setFormTurma({...formTurma, quantidadeAulas: e.target.value})} placeholder="Ex: 5" className={inputClass} />
                </label>
                <label>
                  <span className={labelClass}>Status</span>
                  <select value={formTurma.status || 'Ativo'} onChange={e => setFormTurma({...formTurma, status: e.target.value})} className={inputClass}>
                    <option value="Ativo">Ativo</option>
                    <option value="Pausado">Pausado</option>
                    <option value="Concluido">Concluido</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </label>
              </div>
              <div className="flex gap-2 border-t border-slate-200 pt-4">
                <Button type="submit" variant="primary">{editingTurma ? 'Guardar' : 'Adicionar'}</Button>
                {editingTurma && <Button type="button" onClick={() => {setEditingTurma(null); setFormTurma(emptyTurmaForm)}}>Cancelar</Button>}
              </div>
            </form>
            <div className="entity-grid">
              {data.turmas.map(turma => (
                <div key={turma.id} className="ds-list-item group flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><BookOpen className="w-5 h-5"/></div>
                    <div>
                      <span className="font-semibold text-slate-800 block">{turma.nome}</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <StatusBadge tone={turma.status === 'Ativo' ? 'success' : turma.status === 'Concluido' ? 'neutral' : 'warning'}>{turma.status || 'Sem status'}</StatusBadge>
                        {turma.quantidadeAulas && <span className="ds-badge">{turma.quantidadeAulas} aulas/dia</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                    <IconButton title="Editar turma" onClick={() => {setEditingTurma(turma.id); setFormTurma({...emptyTurmaForm, ...turma})}} className="text-blue-600 hover:text-blue-700"><Edit className="w-4 h-4"/></IconButton>
                    <IconButton title="Excluir turma" onClick={() => crudOps.deleteTurma(turma.id)} className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4"/></IconButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminTab === 'professores' && (
          <div className="p-6">
            <SectionHeader
              eyebrow="Equipe docente"
              title="Professores"
              description="Gerencie acessos, dados institucionais e turmas vinculadas."
            />
            <form onSubmit={(e) => crudOps.saveProfessor(e, editingProfessor, formProf, setEditingProfessor, setFormProf)} className="ds-form mb-8 space-y-5">
              <h3 className="text-sm font-extrabold text-slate-900">{editingProfessor ? 'Editar professor' : 'Novo professor'}</h3>
              <div className="form-grid">
                <label>
                  <span className={labelClass}>Nome completo</span>
                  <input type="text" placeholder="Ex: Marcelo Silva" value={formProf.nome} onChange={e => setFormProf({...formProf, nome: e.target.value})} className={inputClass} required />
                </label>
                <label>
                  <span className={labelClass}>CPF</span>
                  <input type="text" placeholder="000.000.000-00" value={formProf.cpf} onChange={e => setFormProf({...formProf, cpf: e.target.value})} className={inputClass} required />
                </label>
                <label>
                  <span className={labelClass}>NIF</span>
                  <input type="text" placeholder="Número de identificação" value={formProf.nif} onChange={e => setFormProf({...formProf, nif: e.target.value})} className={inputClass} required />
                </label>
                <label>
                  <span className={labelClass}>Telefone</span>
                  <input type="text" placeholder="(11) 90000-0000" value={formProf.telefone} onChange={e => setFormProf({...formProf, telefone: e.target.value})} className={inputClass} required />
                </label>
                <label>
                  <span className={labelClass}>E-mail institucional</span>
                  <input type="email" placeholder="professor@senaisp.edu.br" value={formProf.email} onChange={e => setFormProf({...formProf, email: e.target.value})} className={inputClass} required />
                </label>
                <label>
                  <span className={labelClass}>Senha</span>
                  <input type="text" placeholder="Senha de acesso" value={formProf.senha} onChange={e => setFormProf({...formProf, senha: e.target.value})} className={inputClass} required />
                </label>
              </div>
              <div>
                <span className="ds-label">Vincular turmas</span>
                <div className="flex flex-wrap gap-2">
                  {turmasVinculaveis.length === 0 && <span className="text-sm text-slate-400">Nenhuma turma ativa ou pausada disponivel.</span>}
                  {turmasVinculaveis.map(t => {
                    const isSelected = formProf.turmas.includes(t.id);
                    return (
                      <button key={t.id} type="button" onClick={() => toggleProfTurma(t.id)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {isSelected ? <CheckSquare className="w-4 h-4"/> : <Square className="w-4 h-4"/>} {t.nome}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 border-t border-slate-200 pt-4">
                <Button type="submit" variant="primary">{editingProfessor ? 'Guardar' : 'Registrar'}</Button>
                {editingProfessor && <Button type="button" onClick={() => {setEditingProfessor(null); setFormProf({nome:'', cpf:'', nif:'', telefone:'', email:'', senha:'', turmas:[]})}}>Cancelar</Button>}
              </div>
            </form>
            <div className="space-y-3">
              {data.professores.map(prof => (
                <div key={prof.id} className="ds-list-item flex items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <AvatarInitial name={prof.nome} tone="red" />
                    <div className="min-w-0">
                      <div className="truncate font-bold text-slate-900">{prof.nome}</div>
                      <div className="mt-1 text-xs text-slate-500">E-mail: {prof.email} | Turmas: {prof.turmas.length}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <IconButton title="Editar professor" onClick={() => {setEditingProfessor(prof.id); setFormProf(prof)}} className="text-blue-600 hover:text-blue-700"><Edit className="w-4 h-4"/></IconButton>
                    <IconButton title="Excluir professor" onClick={() => crudOps.deleteProfessor(prof.id)} className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4"/></IconButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminTab === 'empresas' && (
          <div className="p-6">
            <SectionHeader
              eyebrow="Parcerias"
              title="Empresas"
              description="Centralize empresas parceiras e mantenha acessos de acompanhamento organizados."
            />
            <form onSubmit={(e) => crudOps.saveEmpresa(e, editingEmpresa, formEmpresa, setEditingEmpresa, setFormEmpresa)} className="ds-form mb-8 space-y-5">
              <h3 className="text-sm font-extrabold text-slate-900">{editingEmpresa ? 'Editar empresa' : 'Nova empresa'}</h3>
              <div className="form-grid">
                <label>
                  <span className={labelClass}>Nome da empresa</span>
                  <input type="text" placeholder="Ex: Logística Prime" value={formEmpresa.nome} onChange={e => setFormEmpresa({...formEmpresa, nome: e.target.value})} className={inputClass} required />
                </label>
                <label>
                  <span className={labelClass}>CNPJ</span>
                  <input type="text" placeholder="00.000.000/0000-00" value={formEmpresa.cnpj || ''} onChange={e => setFormEmpresa({...formEmpresa, cnpj: e.target.value})} className={inputClass} />
                </label>
                <label>
                  <span className={labelClass}>E-mail corporativo</span>
                  <input type="email" placeholder="contato@empresa.com.br" value={formEmpresa.email} onChange={e => setFormEmpresa({...formEmpresa, email: e.target.value})} className={inputClass} required />
                </label>
                <label>
                  <span className={labelClass}>Endereço</span>
                  <input type="text" placeholder="Rua, número, bairro e cidade" value={formEmpresa.endereco || ''} onChange={e => setFormEmpresa({...formEmpresa, endereco: e.target.value})} className={inputClass} />
                </label>
                <label>
                  <span className={labelClass}>Senha</span>
                  <input type="text" placeholder="Senha de acesso" value={formEmpresa.senha} onChange={e => setFormEmpresa({...formEmpresa, senha: e.target.value})} className={inputClass} required />
                </label>
              </div>
              <div className="flex gap-2 border-t border-slate-200 pt-4">
                <Button type="submit" variant="primary">{editingEmpresa ? 'Guardar' : 'Registrar'}</Button>
                {editingEmpresa && <Button type="button" onClick={() => {setEditingEmpresa(null); setFormEmpresa(emptyEmpresaForm)}}>Cancelar</Button>}
              </div>
            </form>
            <div className="entity-grid">
              {data.empresas && data.empresas.map(emp => (
                <div key={emp.id} className="ds-list-item flex items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <AvatarInitial name={emp.nome} tone="amber" />
                    <div className="min-w-0">
                      <div className="truncate font-bold text-slate-900">{emp.nome}</div>
                      <div className="mt-1 text-xs text-slate-500">E-mail: {emp.email}{emp.cnpj ? ` | CNPJ: ${emp.cnpj}` : ''}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <IconButton title="Editar empresa" onClick={() => {setEditingEmpresa(emp.id); setFormEmpresa({...emptyEmpresaForm, ...emp})}} className="text-blue-600 hover:text-blue-700"><Edit className="w-4 h-4"/></IconButton>
                    <IconButton title="Excluir empresa" onClick={() => crudOps.deleteEmpresa(emp.id)} className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4"/></IconButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminTab === 'alunos' && (
          <div className="p-6">
            <SectionHeader
              eyebrow="Aprendizes"
              title="Gestao de alunos"
              description="Cadastre alunos, vincule turmas e conecte aprendizes as empresas parceiras."
              actions={(
                <>
                  <Button type="button" variant="success" onClick={() => exportExcelCSV(data.alunos, data, 'admin_alunos')}>
                    <FileSpreadsheet className="w-4 h-4" /> Excel
                  </Button>
                  <Button type="button" onClick={() => exportPDFReport({ alunosParaExportar: data.alunos, data, title: 'Relatorio Geral de Alunos', subtitle: 'Administracao SENAI', prefix: 'admin_alunos' })}>
                    <FileText className="w-4 h-4" /> PDF
                  </Button>
                </>
              )}
            />
            <form onSubmit={(e) => crudOps.saveAluno(e, editingAluno, formAluno, setEditingAluno, setFormAluno)} className="ds-form mb-8 space-y-5">
              <h3 className="text-sm font-extrabold text-slate-900">{editingAluno ? 'Editar aluno' : 'Novo aluno'}</h3>
              <div className="form-grid">
                <label>
                  <span className={labelClass}>Nome completo</span>
                  <input type="text" placeholder="Ex: Lucas Teixeira" value={formAluno.nome} onChange={e => setFormAluno({...formAluno, nome: e.target.value})} className={inputClass} required />
                </label>
                <label>
                  <span className={labelClass}>CPF</span>
                  <input type="text" placeholder="000.000.000-00" value={formAluno.cpf} onChange={e => setFormAluno({...formAluno, cpf: e.target.value})} className={inputClass} required />
                </label>
                <label>
                  <span className={labelClass}>Telefone</span>
                  <input type="text" placeholder="(11) 90000-0000" value={formAluno.telefone} onChange={e => setFormAluno({...formAluno, telefone: e.target.value})} className={inputClass} required />
                </label>
                <label>
                  <span className={labelClass}>E-mail institucional</span>
                  <input type="email" placeholder="aluno@senaisp.edu.br" value={formAluno.email} onChange={e => setFormAluno({...formAluno, email: e.target.value})} className={inputClass} required />
                </label>
                <div>
                  <span className={labelClass}>Turma</span>
                  <SearchableSelect options={turmasVinculaveis} value={formAluno.turmaId} onChange={(v) => setFormAluno({...formAluno, turmaId: v})} optionLabelKey="nome" optionValueKey="id" placeholder="Selecione a Turma..." />
                </div>
                <div>
                  <span className={labelClass}>Empresa vinculada</span>
                  <SearchableSelect options={(data.empresas||[])} value={formAluno.empresaId} onChange={(v) => setFormAluno({...formAluno, empresaId: v})} optionLabelKey="nome" optionValueKey="id" placeholder="Sem vínculo empresarial" />
                </div>
              </div>
              <div className="flex gap-2 border-t border-slate-200 pt-4">
                <Button type="submit" variant="primary">{editingAluno ? 'Guardar' : 'Registrar'}</Button>
                {editingAluno && <Button type="button" onClick={() => {setEditingAluno(null); setFormAluno({nome:'', cpf:'', telefone:'', email:'', turmaId:'', empresaId: ''})}}>Cancelar</Button>}
              </div>
            </form>
            <div className="ds-table overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">E-mail</th><th className="px-4 py-3">Turma & Empresa</th><th className="px-4 py-3 text-right">Ações</th></tr>
                </thead>
                <tbody>
                  {data.alunos.map(aluno => (
                    <tr key={aluno.id}>
                      <td className="px-4 py-3 font-bold text-slate-900">{aluno.nome}</td>
                      <td className="px-4 py-3 text-slate-500">{aluno.email}</td>
                      <td className="px-4 py-3 text-slate-500 space-y-1">
                        <span className="ds-badge">{data.turmas.find(t=>t.id===aluno.turmaId)?.nome || 'Sem Turma'}</span>
                        {aluno.empresaId && <span className="ml-1 text-xs font-semibold text-amber-700">{data.empresas.find(e=>e.id===aluno.empresaId)?.nome}</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <IconButton title="Editar aluno" onClick={() => {setEditingAluno(aluno.id); setFormAluno(aluno)}} className="mr-1 text-blue-600 hover:text-blue-700"><Edit className="w-4 h-4"/></IconButton>
                        <IconButton title="Excluir aluno" onClick={() => crudOps.deleteAluno(aluno.id)} className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4"/></IconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {adminTab === 'config' && (
          <div className="max-w-4xl space-y-8 p-6">
            <SectionHeader
              eyebrow="Sistema"
              title="Integracoes e dados"
              description="Acompanhe conexoes e backups sem acoplar a interface aos servicos externos."
            />
            <div className="ds-panel p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2"><Database className="w-4 h-4"/> Integração Supabase</h3>
              <p className="text-xs text-slate-500 mb-4">Banco principal conectado por variáveis de ambiente do Vite.</p>
              <div className="mb-4 overflow-hidden rounded-lg border border-slate-200">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Estado</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : syncStatus === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {syncLabels[syncStatus] || syncStatus}
                  </span>
                </div>
                <div className="px-4 py-3 text-xs text-slate-600 grid gap-2">
                  <div className="flex justify-between gap-3">
                    <span>URL</span>
                    <span className="font-mono text-slate-500">{isSupabaseConfigured ? 'VITE_SUPABASE_URL configurada' : 'VITE_SUPABASE_URL ausente'}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Chave anônima</span>
                    <span className="font-mono text-slate-500">{isSupabaseConfigured ? 'VITE_SUPABASE_ANON_KEY configurada' : 'VITE_SUPABASE_ANON_KEY ausente'}</span>
                  </div>
                </div>
              </div>
              {syncError && <p className="text-xs text-red-600 mb-4">{syncError}</p>}
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleManualSync} disabled={!isSupabaseConfigured} variant="primary"><Database className="w-4 h-4" /> Sincronizar agora</Button>
                <Button onClick={handleReloadData} disabled={!isSupabaseConfigured}><RefreshCw className="w-4 h-4" /> Recarregar dados</Button>
              </div>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
              <h3 className="text-sm font-bold text-blue-900 mb-1 flex items-center gap-2"><Settings className="w-4 h-4"/> Backup de Dados</h3>
              <p className="text-xs text-blue-700 mb-4">Os dados são sincronizados no Supabase. Mantenha estes ficheiros apenas como cópia de segurança local.</p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => exportJSON(data)}><Download className="w-4 h-4" /> Backup (.json)</Button>
                <Button onClick={() => exportExcelCSV(data.alunos, data, 'relatorio_completo')} variant="success"><FileSpreadsheet className="w-4 h-4" /> Excel (.csv)</Button>
                <Button onClick={() => exportPDFReport({ alunosParaExportar: data.alunos, data, title: 'Relatorio Completo', subtitle: 'Backup visual dos dados principais', prefix: 'relatorio_completo' })}><FileText className="w-4 h-4" /> PDF</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
