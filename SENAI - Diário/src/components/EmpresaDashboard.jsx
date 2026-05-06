// src/components/EmpresaDashboard.jsx
import React, { useState } from 'react';
import { PieChart, Users, Calendar, CheckCircle2, XCircle, Clock, FileSpreadsheet } from 'lucide-react';
import DashboardView from './DashboardView';
import { exportExcelCSV } from '../utils/utils';

export default function EmpresaDashboard({ 
  data, currentUser, empresaTab, setEmpresaTab, dataFormatada
}) {
  const alunosEmpresa = data.alunos.filter(a => a.empresaId === currentUser.id);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">Portal do Parceiro</h1>
            <span className="flex items-center gap-1.5 bg-slate-200/70 text-slate-700 px-3 py-1 rounded-full text-xs font-medium border border-slate-300 shadow-sm"><Calendar className="w-3.5 h-3.5" />{dataFormatada}</span>
          </div>
          <p className="text-sm text-slate-500">Acompanhe a assiduidade dos seus aprendizes.</p>
        </div>
      </div>
      
      <div className="bg-white rounded-t-2xl border-x border-t border-slate-200 px-2 pt-2">
        <nav className="flex space-x-2 overflow-x-auto">
          {[
            { id: 'dashboard', icon: PieChart, label: 'Visão Geral' },
            { id: 'alunos', icon: Users, label: 'Meus Aprendizes' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setEmpresaTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-xl transition-colors whitespace-nowrap ${empresaTab === tab.id ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white border border-t-0 border-slate-200 rounded-b-2xl shadow-sm min-h-[600px]">
        {empresaTab === 'dashboard' && (
          <DashboardView disponiveisTurmas={[{ id: 'all_empresa', nome: 'Todos os Alunos' }]} data={data} titleContext="Aprendizes" />
        )}
        {empresaTab === 'alunos' && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-slate-800">Aprendizes Registados</h2>
              <button onClick={() => exportExcelCSV(alunosEmpresa, data, 'empresa_alunos')} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-emerald-300"><FileSpreadsheet className="w-4 h-4" /> Exportar</button>
            </div>
            {alunosEmpresa.length === 0 ? (
              <div className="p-12 text-center text-slate-500 border border-slate-200 rounded-xl">Nenhum aluno está atualmente vinculado à sua empresa.</div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {alunosEmpresa.map(aluno => (
                  <div key={aluno.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-slate-50 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-amber-600 bg-amber-100 font-bold text-sm shadow-sm">{aluno.nome.charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="font-semibold text-slate-800">{aluno.nome}</div>
                        <div className="text-xs text-slate-500 mt-0.5"><span className="font-medium">{data.turmas.find(t=>t.id===aluno.turmaId)?.nome || 'Sem Turma'}</span> • {aluno.email}</div>
                      </div>
                    </div>
                    <div className="flex self-end md:self-auto">
                      {aluno.status === 'presente' && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-4 h-4" /> Presente</span>}
                      {aluno.status === 'falta' && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-50 text-red-700 border border-red-200"><XCircle className="w-4 h-4" /> Faltou</span>}
                      {aluno.status === 'pendente' && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-slate-50 text-slate-500 border border-slate-200"><Clock className="w-4 h-4" /> Pendente</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
