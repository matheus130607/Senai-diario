// src/components/AdminDashboard.jsx
import { useState } from 'react';
import DashboardShell from './DashboardShell';
import { BookOpen, User, Building, Settings, Edit, Trash2, CheckSquare, Square, Download, FileSpreadsheet, Database, RefreshCw } from 'lucide-react';
import DashboardView from './DashboardView';
import SearchableSelect from './ui/SearchableSelect';
import { useCrudOperations } from '../hooks/useCrudOperations';
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
  saveDataNow,
  reloadData,
}) {
  const [editingTurma, setEditingTurma] = useState(null);
  const [editingProfessor, setEditingProfessor] = useState(null);
  const [editingEmpresa, setEditingEmpresa] = useState(null);
  const [editingAluno, setEditingAluno] = useState(null);
  
  const [formTurma, setFormTurma] = useState({ nome: '' });
  const [formProf, setFormProf] = useState({ nome: '', cpf: '', nif: '', telefone: '', email: '', senha: '', turmas: [] });
  const [formEmpresa, setFormEmpresa] = useState({ nome: '', email: '', senha: '' });
  const [formAluno, setFormAluno] = useState({ nome: '', cpf: '', telefone: '', email: '', turmaId: '', empresaId: '' });

  const crudOps = useCrudOperations(data, setData, showToast, requestConfirm);

  const syncLabels = {
    loading: 'Carregando',
    saving: 'Salvando',
    synced: 'Sincronizado',
    error: 'Erro',
    not_configured: 'Nao configurado',
  };

  const handleManualSync = async () => {
    try {
      await saveDataNow?.(data);
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
        {adminTab === 'dashboard' && <DashboardView disponiveisTurmas={data.turmas} data={data} titleContext="Turma" />}

        {adminTab === 'turmas' && (
          <div className="p-6">
            <form onSubmit={(e) => crudOps.saveTurma(e, editingTurma, formTurma, setEditingTurma, setFormTurma)} className="flex gap-3 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <input type="text" value={formTurma.nome} onChange={e => setFormTurma({nome: e.target.value})} placeholder="Nome da Turma (Ex: Informática Tarde)" className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm" required />
              <button type="submit" className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-900">
                {editingTurma ? 'Guardar' : 'Adicionar'}
              </button>
              {editingTurma && <button type="button" onClick={() => {setEditingTurma(null); setFormTurma({nome:''})}} className="px-4 text-slate-500 text-sm">Cancelar</button>}
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.turmas.map(turma => (
                <div key={turma.id} className="border border-slate-200 p-4 rounded-xl flex justify-between items-center group hover:border-slate-400">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><BookOpen className="w-5 h-5"/></div>
                    <span className="font-semibold text-slate-800">{turma.nome}</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                    <button onClick={() => {setEditingTurma(turma.id); setFormTurma({nome: turma.nome})}} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4"/></button>
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
                <input type="text" placeholder="Nome Completo" value={formProf.nome} onChange={e => setFormProf({...formProf, nome: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" required />
                <input type="text" placeholder="CPF" value={formProf.cpf} onChange={e => setFormProf({...formProf, cpf: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" required />
                <input type="text" placeholder="NIF" value={formProf.nif} onChange={e => setFormProf({...formProf, nif: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" required />
                <input type="text" placeholder="Telefone" value={formProf.telefone} onChange={e => setFormProf({...formProf, telefone: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" required />
                <input type="email" placeholder="E-mail" value={formProf.email} onChange={e => setFormProf({...formProf, email: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" required />
                <input type="text" placeholder="Palavra-passe" value={formProf.senha} onChange={e => setFormProf({...formProf, senha: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" required />
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase mb-2">Vincular Turmas</span>
                <div className="flex flex-wrap gap-2">
                  {data.turmas.length === 0 && <span className="text-sm text-slate-400">Nenhuma turma registada.</span>}
                  {data.turmas.map(t => {
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="Nome da Empresa" value={formEmpresa.nome} onChange={e => setFormEmpresa({...formEmpresa, nome: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" required />
                <input type="email" placeholder="E-mail" value={formEmpresa.email} onChange={e => setFormEmpresa({...formEmpresa, email: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" required />
                <input type="text" placeholder="Palavra-passe" value={formEmpresa.senha} onChange={e => setFormEmpresa({...formEmpresa, senha: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" required />
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <button type="submit" className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-900">{editingEmpresa ? 'Guardar' : 'Registrar'}</button>
                {editingEmpresa && <button type="button" onClick={() => {setEditingEmpresa(null); setFormEmpresa({nome:'', email:'', senha:''})}} className="px-4 text-slate-500 text-sm hover:bg-slate-200 rounded-lg">Cancelar</button>}
              </div>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.empresas && data.empresas.map(emp => (
                <div key={emp.id} className="border border-slate-200 p-4 rounded-xl flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-2"><Building className="w-4 h-4"/> {emp.nome}</div>
                    <div className="text-xs text-slate-500 mt-1">E-mail: {emp.email}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {setEditingEmpresa(emp.id); setFormEmpresa(emp)}} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit className="w-4 h-4"/></button>
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
                <input type="text" placeholder="Nome Completo" value={formAluno.nome} onChange={e => setFormAluno({...formAluno, nome: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" required />
                <input type="text" placeholder="CPF" value={formAluno.cpf} onChange={e => setFormAluno({...formAluno, cpf: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" required />
                <input type="text" placeholder="Telefone" value={formAluno.telefone} onChange={e => setFormAluno({...formAluno, telefone: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" required />
                <input type="email" placeholder="E-mail" value={formAluno.email} onChange={e => setFormAluno({...formAluno, email: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" required />
                <div>
                  <SearchableSelect options={data.turmas} value={formAluno.turmaId} onChange={(v) => setFormAluno({...formAluno, turmaId: v})} optionLabelKey="nome" optionValueKey="id" placeholder="Selecione a Turma..." />
                </div>
                <div>
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
