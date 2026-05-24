// src/components/AdminDashboard.jsx
import { useState } from 'react';
import DashboardShell from './DashboardShell';
import { AlertTriangle, BookOpen, User, Building, Settings, Edit, Trash2, CheckSquare, Square, Download, FileSpreadsheet, Database, RefreshCw } from 'lucide-react';
import DashboardView from './DashboardView';
import SearchableSelect from './ui/SearchableSelect';
import { emptyEmpresaForm, emptyTurmaForm, useCrudOperations } from '../hooks/useCrudOperations';
import { exportJSON, exportExcelCSV } from '../utils/utils';

export default function AdminDashboard({ 
  data,
  setData,
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
  const labelClass = 'block text-[11px] font-semibold uppercase text-slate-500 mb-1';
  const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100';
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
    <DashboardShell title="Painel de Administração" subtitle="Faça a gestão de turmas, professores, empresas parceiras, alunos e integrações.">
      

      <div className="bg-white border border-t-0 border-slate-200 rounded-b-2xl shadow-sm min-h-[600px]">
        {turmasProximasDoFim.length > 0 && (
          <div className="m-6 mb-0 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
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
                  <span key={turma.id} className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800">
                    {turma.nome}: {turma.diasRestantes === 0 ? 'encerra hoje' : `${turma.diasRestantes} dia(s)`}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {adminTab === 'dashboard' && <DashboardView disponiveisTurmas={data.turmas} data={data} titleContext="Turma" />}

        {adminTab === 'turmas' && (
          <div className="p-6">
            <form onSubmit={(e) => crudOps.saveTurma(e, editingTurma, formTurma, setEditingTurma, setFormTurma)} className="mb-8 bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 mb-2">{editingTurma ? 'Editar Turma' : 'Nova Turma'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <label className="lg:col-span-2">
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
              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <button type="submit" className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-900">
                  {editingTurma ? 'Guardar' : 'Adicionar'}
                </button>
                {editingTurma && <button type="button" onClick={() => {setEditingTurma(null); setFormTurma(emptyTurmaForm)}} className="px-4 text-slate-500 text-sm hover:bg-slate-200 rounded-lg">Cancelar</button>}
              </div>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.turmas.map(turma => (
                <div key={turma.id} className="border border-slate-200 p-4 rounded-xl flex justify-between items-center group hover:border-slate-400">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><BookOpen className="w-5 h-5"/></div>
                    <div>
                      <span className="font-semibold text-slate-800 block">{turma.nome}</span>
                      <span className="text-xs text-slate-500">{turma.status || 'Sem status'} {turma.quantidadeAulas ? `| ${turma.quantidadeAulas} aulas/dia` : ''}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                    <button onClick={() => {setEditingTurma(turma.id); setFormTurma({...emptyTurmaForm, ...turma})}} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4"/></button>
                    <button onClick={() => crudOps.deleteTurma(turma.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminTab === 'professores' && (
          <div className="p-6">
            <form onSubmit={(e) => crudOps.saveProfessor(e, editingProfessor, formProf, setEditingProfessor, setFormProf)} className="mb-8 bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 mb-2">{editingProfessor ? 'Editar Professor' : 'Novo Professor'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <span className="block text-xs font-semibold text-slate-500 uppercase mb-2">Vincular Turmas</span>
                <div className="flex flex-wrap gap-2">
                  {turmasVinculaveis.length === 0 && <span className="text-sm text-slate-400">Nenhuma turma ativa ou pausada disponivel.</span>}
                  {turmasVinculaveis.map(t => {
                    const isSelected = formProf.turmas.includes(t.id);
                    return (
                      <button key={t.id} type="button" onClick={() => toggleProfTurma(t.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                        {isSelected ? <CheckSquare className="w-4 h-4"/> : <Square className="w-4 h-4"/>} {t.nome}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <button type="submit" className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-900">{editingProfessor ? 'Guardar' : 'Registrar'}</button>
                {editingProfessor && <button type="button" onClick={() => {setEditingProfessor(null); setFormProf({nome:'', cpf:'', nif:'', telefone:'', email:'', senha:'', turmas:[]})}} className="px-4 text-slate-500 text-sm hover:bg-slate-200 rounded-lg">Cancelar</button>}
              </div>
            </form>
            <div className="space-y-3">
              {data.professores.map(prof => (
                <div key={prof.id} className="border border-slate-200 p-4 rounded-xl flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-2"><User className="w-4 h-4"/> {prof.nome}</div>
                    <div className="text-xs text-slate-500 mt-1">E-mail: {prof.email} | Turmas: {prof.turmas.length}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {setEditingProfessor(prof.id); setFormProf(prof)}} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit className="w-4 h-4"/></button>
                    <button onClick={() => crudOps.deleteProfessor(prof.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminTab === 'empresas' && (
          <div className="p-6">
            <form onSubmit={(e) => crudOps.saveEmpresa(e, editingEmpresa, formEmpresa, setEditingEmpresa, setFormEmpresa)} className="mb-8 bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 mb-2">{editingEmpresa ? 'Editar Empresa' : 'Nova Empresa'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <label className="lg:col-span-2">
                  <span className={labelClass}>Endereço</span>
                  <input type="text" placeholder="Rua, número, bairro e cidade" value={formEmpresa.endereco || ''} onChange={e => setFormEmpresa({...formEmpresa, endereco: e.target.value})} className={inputClass} />
                </label>
                <label>
                  <span className={labelClass}>Senha</span>
                  <input type="text" placeholder="Senha de acesso" value={formEmpresa.senha} onChange={e => setFormEmpresa({...formEmpresa, senha: e.target.value})} className={inputClass} required />
                </label>
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <button type="submit" className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-900">{editingEmpresa ? 'Guardar' : 'Registrar'}</button>
                {editingEmpresa && <button type="button" onClick={() => {setEditingEmpresa(null); setFormEmpresa(emptyEmpresaForm)}} className="px-4 text-slate-500 text-sm hover:bg-slate-200 rounded-lg">Cancelar</button>}
              </div>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.empresas && data.empresas.map(emp => (
                <div key={emp.id} className="border border-slate-200 p-4 rounded-xl flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-2"><Building className="w-4 h-4"/> {emp.nome}</div>
                    <div className="text-xs text-slate-500 mt-1">E-mail: {emp.email}{emp.cnpj ? ` | CNPJ: ${emp.cnpj}` : ''}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {setEditingEmpresa(emp.id); setFormEmpresa({...emptyEmpresaForm, ...emp})}} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit className="w-4 h-4"/></button>
                    <button onClick={() => crudOps.deleteEmpresa(emp.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminTab === 'alunos' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">Gestão de Alunos</h2>
              <button onClick={() => exportExcelCSV(data.alunos, data, 'admin_alunos')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
            </div>
            <form onSubmit={(e) => crudOps.saveAluno(e, editingAluno, formAluno, setEditingAluno, setFormAluno)} className="mb-8 bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 mb-2">{editingAluno ? 'Editar Aluno' : 'Novo Aluno'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <button type="submit" className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-900">{editingAluno ? 'Guardar' : 'Registrar'}</button>
                {editingAluno && <button type="button" onClick={() => {setEditingAluno(null); setFormAluno({nome:'', cpf:'', telefone:'', email:'', turmaId:'', empresaId: ''})}} className="px-4 text-slate-500 text-sm hover:bg-slate-200 rounded-lg">Cancelar</button>}
              </div>
            </form>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">E-mail</th><th className="px-4 py-3">Turma & Empresa</th><th className="px-4 py-3 text-right">Ações</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.alunos.map(aluno => (
                    <tr key={aluno.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{aluno.nome}</td>
                      <td className="px-4 py-3 text-slate-500">{aluno.email}</td>
                      <td className="px-4 py-3 text-slate-500 space-y-1">
                        <span className="inline-block bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">{data.turmas.find(t=>t.id===aluno.turmaId)?.nome || 'Sem Turma'}</span>
                        {aluno.empresaId && <span className="text-amber-700">{data.empresas.find(e=>e.id===aluno.empresaId)?.nome}</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => {setEditingAluno(aluno.id); setFormAluno(aluno)}} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded mr-1"><Edit className="w-4 h-4"/></button>
                        <button onClick={() => crudOps.deleteAluno(aluno.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4"/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {adminTab === 'config' && (
          <div className="space-y-8 max-w-3xl p-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2"><Database className="w-4 h-4"/> Integração Supabase</h3>
              <p className="text-xs text-slate-500 mb-4">Banco principal conectado por variáveis de ambiente do Vite.</p>
              <div className="rounded-xl border border-slate-200 overflow-hidden mb-4">
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
                <button onClick={handleManualSync} disabled={!isSupabaseConfigured} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><Database className="w-4 h-4" /> Sincronizar agora</button>
                <button onClick={handleReloadData} disabled={!isSupabaseConfigured} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Recarregar dados</button>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-blue-900 mb-1 flex items-center gap-2"><Settings className="w-4 h-4"/> Backup de Dados</h3>
              <p className="text-xs text-blue-700 mb-4">Os dados são sincronizados no Supabase. Mantenha estes ficheiros apenas como cópia de segurança local.</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => exportJSON(data)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"><Download className="w-4 h-4" /> Backup (.json)</button>
                <button onClick={() => exportExcelCSV(data.alunos, data, 'relatorio_completo')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> Excel (.csv)</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
