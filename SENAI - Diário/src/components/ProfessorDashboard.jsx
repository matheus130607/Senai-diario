// src/components/ProfessorDashboard.jsx
import React, { useState } from 'react';
import DashboardShell from './DashboardShell';
import { PieChart, ListChecks, Calendar, BookOpen, Search, CheckCircle2, XCircle, Clock, FileSpreadsheet, Loader2, Send } from 'lucide-react';
import DashboardView from './DashboardView';
import SearchableSelect from './ui/SearchableSelect';
import { exportExcelCSV } from '../utils/utils';

export default function ProfessorDashboard({ 
  data, setData, currentUser, profTab, setProfTab, 
  profActiveTurma, setProfActiveTurma, showToast, requestConfirm, dataFormatada
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);

  const setPresenceLocal = (alunoId, status) => {
    setData(prev => ({
      ...prev,
      alunos: prev.alunos.map(a => a.id === alunoId ? { ...a, status } : a)
    }));
  };

  const executarEnvioGoogle = async (alunosTurmaAtual) => {
    setIsSending(true);
    try {
      let sucessos = 0;
      for (const aluno of alunosTurmaAtual) {
        const params = new URLSearchParams({
          evento: 'registro_presenca',
          alunoId: aluno.id,
          alunoNome: aluno.nome,
          alunoEmail: aluno.email,
          turma: data.turmas.find(t => t.id === aluno.turmaId)?.nome || 'Desconhecida',
          presente: aluno.status === 'presente' 
        });

        const finalUrl = `${data.config.webhookUrl}?${params.toString()}`;
        await fetch(finalUrl, { method: 'GET', mode: 'no-cors' });
        sucessos++;
      }
      showToast(`Chamada enviada! (${sucessos} alunos)`);
    } catch (err) {
      console.error("Erro ao enviar:", err);
      alert("Erro de conexão.");
    } finally {
      setIsSending(false);
    }
  };

  const submitChamada = () => {
    if (!data.config.webhookUrl) {
      alert("Webhook não configurado pelo Administrador.");
      return;
    }
    const alunosTurmaAtual = data.alunos.filter(a => a.turmaId === profActiveTurma);
    if (alunosTurmaAtual.length === 0) return alert("Não há alunos nesta turma.");

    const pendentes = alunosTurmaAtual.filter(a => a.status === 'pendente').length;
    if (pendentes > 0) {
      requestConfirm("Chamada Incompleta", `Existem ${pendentes} alunos pendentes. Enviar mesmo assim?`, () => executarEnvioGoogle(alunosTurmaAtual));
    } else {
      executarEnvioGoogle(alunosTurmaAtual);
    }
  };

  return (
    <DashboardShell title="Portal do Professor" subtitle={`Faça a gestão da assiduidade das suas turmas. ${dataFormatada ? dataFormatada : ''}`}>
      
      <div className="bg-white border border-t-0 border-slate-200 rounded-b-2xl shadow-sm min-h-[600px] flex flex-col overflow-hidden">
        {profTab === 'dashboard' && (
          <DashboardView disponiveisTurmas={data.turmas.filter(t => currentUser.turmas.includes(t.id))} data={data} titleContext="Turma" />
        )}
        {profTab === 'chamada' && (
          <div className="flex flex-col h-full bg-slate-50 flex-1">
            {currentUser.turmas.length === 0 ? (
              <div className="p-12 text-center text-slate-500">Não está vinculado a nenhuma turma neste momento.</div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-slate-200 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-slate-500" />
                    <div className="w-full md:w-64">
                      <SearchableSelect options={data.turmas.filter(t => currentUser.turmas.includes(t.id))} value={profActiveTurma} onChange={(v) => setProfActiveTurma(v)} optionLabelKey="nome" optionValueKey="id" placeholder="Selecionar Turma" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={() => exportExcelCSV(data.alunos.filter(a => a.turmaId === profActiveTurma), data, 'chamada_turma')} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 border border-emerald-300"><FileSpreadsheet className="w-4 h-4" /> Excel</button>
                    <div className="relative w-full md:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input type="text" placeholder="Pesquisar aluno..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500 outline-none" />
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-200 bg-white flex-1 overflow-auto"> 
                  {data.alunos.filter(a => a.turmaId === profActiveTurma).filter(a => a.nome.toLowerCase().includes(searchTerm.toLowerCase())).map(aluno => (
                    <div key={aluno.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-slate-50 gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ${aluno.status === 'presente' ? 'bg-emerald-500' : aluno.status === 'falta' ? 'bg-red-500' : 'bg-slate-300'}`}>{aluno.nome.charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="font-semibold text-slate-800 text-base">{aluno.nome}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{aluno.email}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 self-end md:self-auto">
                        <button onClick={() => setPresenceLocal(aluno.id, 'presente')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm border ${aluno.status === 'presente' ? 'bg-emerald-500 text-white border-emerald-600 ring-2 ring-emerald-500 ring-offset-1' : 'bg-white text-slate-500 border-slate-200 hover:bg-emerald-50'}`}><CheckCircle2 className="w-4 h-4" /> Presente</button>
                        <button onClick={() => setPresenceLocal(aluno.id, 'falta')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm border ${aluno.status === 'falta' ? 'bg-red-500 text-white border-red-600 ring-2 ring-red-500 ring-offset-1' : 'bg-white text-slate-500 border-slate-200 hover:bg-red-50'}`}><XCircle className="w-4 h-4" /> Falta</button>
                      </div>
                    </div>
                  ))}
                  {data.alunos.filter(a => a.turmaId === profActiveTurma).length === 0 && <div className="p-12 text-center text-slate-500">Nenhum aluno registado nesta turma.</div>}
                </div>

                {data.alunos.filter(a => a.turmaId === profActiveTurma).length > 0 && (
                  <div className="bg-white border-t border-slate-200 p-4">
                    <div className="flex justify-end">
                      <button onClick={submitChamada} disabled={isSending} className={`w-full md:w-auto py-3 px-5 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors text-base ${isSending ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                        {isSending ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</> : <><Send className="w-5 h-5" /> Submeter Chamada</>}</button>
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
