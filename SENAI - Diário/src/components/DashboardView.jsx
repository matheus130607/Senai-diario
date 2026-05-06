// src/components/DashboardView.jsx
import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, BookOpen, Users, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

export default function DashboardView({ disponiveisTurmas, data, titleContext = "Turma" }) {
  const [selectedTurmaDashboard, setSelectedTurmaDashboard] = useState('');

  useEffect(() => {
    if (disponiveisTurmas.length > 0 && !selectedTurmaDashboard) {
      setSelectedTurmaDashboard(disponiveisTurmas[0].id);
    }
  }, [disponiveisTurmas, selectedTurmaDashboard]);

  if (disponiveisTurmas.length === 0) {
    return (
      <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
        <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700">Nenhuma {titleContext} Disponível</h3>
        <p className="text-sm mt-1">Não há dados registados para apresentar os gráficos.</p>
      </div>
    );
  }

  const turmaAtual = disponiveisTurmas.find(t => t.id === selectedTurmaDashboard);
  const turmaNome = turmaAtual?.nome || titleContext;
  const alunosDaTurma = selectedTurmaDashboard === 'all_empresa' 
    ? data.alunos 
    : data.alunos.filter(a => a.turmaId === selectedTurmaDashboard);
  
  const total = alunosDaTurma.length;
  const presentes = alunosDaTurma.filter(a => a.status === 'presente').length;
  const faltas = alunosDaTurma.filter(a => a.status === 'falta').length;
  const pendentes = alunosDaTurma.filter(a => a.status === 'pendente').length;
  
  const percentualPresente = total === 0 ? 0 : Math.round((presentes / total) * 100);
  const percentualFaltas = total === 0 ? 0 : Math.round((faltas / total) * 100);

  const radius = 70;
  const stroke = 14;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentualPresente / 100) * circumference;

  const META_SENAI = 75;
  const isAbaixoMeta = percentualPresente < META_SENAI && total > 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-red-50 p-3 rounded-xl">
            <Activity className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Desempenho de Assiduidade</h3>
            <p className="text-sm text-slate-500">Selecione a turma para visualizar relatórios detalhados.</p>
          </div>
        </div>
        <select 
          value={selectedTurmaDashboard} 
          onChange={(e) => setSelectedTurmaDashboard(e.target.value)}
          className="w-full md:w-80 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-red-500 outline-none transition-all cursor-pointer"
        >
          {disponiveisTurmas.map(t => (
            <option key={`dash-${t.id}`} value={t.id}>{t.nome}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total de Alunos</p>
          <span className="text-4xl font-bold text-slate-800">{total}</span>
          <div className="w-full bg-slate-100 h-1.5 mt-4 rounded-full"><div className="bg-slate-400 h-full w-full"></div></div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Presentes</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-emerald-600">{presentes}</span>
            <span className="text-sm font-medium text-emerald-500 mb-1">({percentualPresente}%)</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 mt-4 rounded-full"><div className="bg-emerald-500 h-full" style={{ width: `${percentualPresente}%` }}></div></div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Faltas Registadas</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-red-600">{faltas}</span>
            <span className="text-sm font-medium text-red-500 mb-1">({percentualFaltas}%)</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 mt-4 rounded-full"><div className="bg-red-500 h-full" style={{ width: `${percentualFaltas}%` }}></div></div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Pendentes</p>
          <span className="text-4xl font-bold text-amber-500">{pendentes}</span>
          <div className="w-full bg-slate-100 h-1.5 mt-4 rounded-full">
            <div className="bg-amber-400 h-full" style={{ width: total > 0 ? `${(pendentes/total)*100}%` : '0%' }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="w-full flex justify-between items-start mb-4">
            <h4 className="font-bold text-slate-800">Índice Global</h4>
            <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded font-medium">Hoje</span>
          </div>
          
          <div className="relative flex items-center justify-center my-6">
            <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
              <circle stroke="#f1f5f9" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
              <circle 
                stroke={isAbaixoMeta ? "#ef4444" : "#10b981"} 
                fill="transparent" strokeWidth={stroke} 
                strokeDasharray={circumference + ' ' + circumference} 
                style={{ strokeDashoffset }} strokeLinecap="round" 
                r={normalizedRadius} cx={radius} cy={radius} 
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute">
              <span className={`text-4xl font-black ${isAbaixoMeta ? 'text-red-600' : 'text-emerald-600'}`}>{percentualPresente}%</span>
            </div>
          </div>

          <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Meta SENAI</span>
              <span className="font-bold text-slate-800">75%</span>
            </div>
            {total > 0 && (
              <div className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${isAbaixoMeta ? 'text-red-600' : 'text-emerald-600'}`}>
                {isAbaixoMeta ? 'Abaixo do esperado' : 'Meta alcançada'}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Alunos Ausentes (Hoje)
            </h4>
            <p className="text-xs text-slate-500 mt-1">Acompanhamento de risco na {turmaNome}</p>
          </div>
          
          <div className="flex-1 p-0 overflow-y-auto max-h-[320px]">
            {faltas === 0 && total > 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h5 className="font-bold text-slate-800">Nenhuma falta registada!</h5>
                <p className="text-sm text-slate-500 mt-1">Excelente! 100% dos alunos marcados estão presentes.</p>
              </div>
            ) : faltas === 0 && total === 0 ? (
              <div className="h-full flex items-center justify-center p-12 text-slate-400 text-sm">
                Sem dados para mostrar.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {alunosDaTurma.filter(a => a.status === 'falta').map(aluno => (
                  <div key={`falta-${aluno.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">
                        {aluno.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{aluno.nome}</p>
                        <p className="text-xs text-slate-500">{aluno.email}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-600 px-2.5 py-1 rounded-md border border-red-100">
                      <XCircle className="w-3.5 h-3.5" /> Ausente
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {faltas > 0 && (
            <div className="p-4 bg-red-50/50 border-t border-red-100 text-xs text-red-600 font-medium text-center">
              Atenção: {faltas} aluno(s) requerem acompanhamento pedagógico.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
