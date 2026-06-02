// src/components/DashboardView.jsx
import { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import SearchableSelect from './ui/SearchableSelect';

function Metric({ label, value, detail, icon: Icon, tone = 'slate', progress = 0 }) {
  const toneMap = {
    slate: 'text-slate-500 bg-slate-100',
    green: 'text-zinc-600 bg-zinc-100',
    red: 'text-zinc-600 bg-zinc-100',
    amber: 'text-zinc-600 bg-zinc-100',
  };

  const barMap = {
    slate: 'bg-zinc-900',
    green: 'bg-zinc-900',
    red: 'bg-zinc-900',
    amber: 'bg-zinc-900',
  };

  return (
    <div className="metric-card rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="metric-card-header">
        <div className="min-w-0">
          <p className="truncate text-[0.72rem] font-medium uppercase tracking-[0.08em] text-zinc-500">{label}</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-[-0.03em] text-zinc-950">{value}</span>
            {detail && <span className="text-sm font-medium text-zinc-500">{detail}</span>}
          </div>
        </div>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-5 h-1 overflow-hidden rounded-full bg-zinc-100">
        <div className={`h-full rounded-full ${barMap[tone]}`} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
      </div>
    </div>
  );
}

export default function DashboardView({ disponiveisTurmas, data, titleContext = 'Turma' }) {
  const [selectedTurmaDashboard, setSelectedTurmaDashboard] = useState('');
  const selectedTurmaId = disponiveisTurmas.some(t => t.id === selectedTurmaDashboard)
    ? selectedTurmaDashboard
    : disponiveisTurmas[0]?.id || '';

  if (disponiveisTurmas.length === 0) {
    return (
      <div className="p-8">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-12 text-center">
          <BookOpen className="mb-4 h-10 w-10 text-zinc-300" />
          <h3 className="text-lg font-medium text-zinc-900">Nenhuma {titleContext} disponivel</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500">Assim que houver dados cadastrados, os indicadores aparecem aqui.</p>
        </div>
      </div>
    );
  }

  const turmaAtual = disponiveisTurmas.find(t => t.id === selectedTurmaId);
  const turmaNome = turmaAtual?.nome || titleContext;
  const alunosDaTurma = selectedTurmaId === 'all_empresa'
    ? data.alunos
    : data.alunos.filter(a => a.turmaId === selectedTurmaId);

  const total = alunosDaTurma.length;
  const presentes = alunosDaTurma.filter(a => a.status === 'presente').length;
  const faltas = alunosDaTurma.filter(a => a.status === 'falta').length;
  const pendentes = alunosDaTurma.filter(a => a.status === 'pendente').length;

  const percentualPresente = total === 0 ? 0 : Math.round((presentes / total) * 100);
  const percentualFaltas = total === 0 ? 0 : Math.round((faltas / total) * 100);
  const percentualPendentes = total === 0 ? 0 : Math.round((pendentes / total) * 100);

  const radius = 72;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentualPresente / 100) * circumference;

  const META_SENAI = 75;
  const isAbaixoMeta = percentualPresente < META_SENAI && total > 0;

  return (
    <div className="space-y-6 p-5 sm:p-6">
      <section className="dashboard-overview-grid">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="dashboard-card-header">
            <div className="max-w-2xl">
              <p className="section-kicker mb-3">Assiduidade</p>
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-zinc-950">Panorama operacional</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Visão consolidada de presenças, faltas e pendências para apoiar acompanhamento pedagógico e decisão rápida.
              </p>
            </div>
            <div className="w-full justify-self-stretch md:justify-self-end">
              <span className="ds-label">Recorte</span>
              <SearchableSelect
                options={disponiveisTurmas}
                value={selectedTurmaId}
                onChange={(v) => setSelectedTurmaDashboard(v)}
                optionLabelKey="nome"
                optionValueKey="id"
                placeholder={`Selecionar ${titleContext}`}
              />
            </div>
          </div>

          <div className="dashboard-metrics-grid mt-6">
            <Metric label="Total" value={total} icon={Users} progress={100} />
            <Metric label="Presentes" value={presentes} detail={`${percentualPresente}%`} icon={UserCheck} tone="green" progress={percentualPresente} />
            <Metric label="Faltas" value={faltas} detail={`${percentualFaltas}%`} icon={XCircle} tone="red" progress={percentualFaltas} />
            <Metric label="Pendentes" value={pendentes} detail={`${percentualPendentes}%`} icon={Clock3} tone="amber" progress={percentualPendentes} />
          </div>
        </div>

        <div className="self-start rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-zinc-950">Indice global</h3>
              <p className="mt-1 text-xs leading-5 text-zinc-500">Meta SENAI: {META_SENAI}%</p>
            </div>
            <span className={`ds-badge ${isAbaixoMeta ? 'ds-badge-danger' : 'ds-badge-success'}`}>
              {isAbaixoMeta ? 'Atenção' : 'Saudável'}
            </span>
          </div>

          <div className="relative my-7 flex items-center justify-center">
            <svg height={radius * 2} width={radius * 2} className="-rotate-90">
              <circle stroke="#eef0f3" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
              <circle
                stroke="#18181b"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="transition-all duration-200"
              />
            </svg>
            <div className="absolute text-center">
              <div className="text-4xl font-semibold tracking-[-0.04em] text-zinc-950">{percentualPresente}%</div>
              <div className="mt-1 text-xs text-zinc-500">presenca</div>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-600">
            {total > 0
              ? isAbaixoMeta
                ? 'A turma está abaixo da meta e merece acompanhamento.'
                : 'A turma esta dentro da meta esperada.'
              : 'Sem registros suficientes para analise.'}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-zinc-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-zinc-950">
              <AlertTriangle className="h-4 w-4 text-zinc-700" /> Alunos ausentes
            </h3>
            <p className="mt-1 text-xs text-zinc-500">Acompanhamento de risco em {turmaNome}</p>
          </div>
          <span className="ds-badge">{faltas} registro(s)</span>
        </div>

        {faltas === 0 && total > 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-12 text-center">
            <CheckCircle2 className="mb-4 h-10 w-10 text-zinc-500" />
            <h4 className="text-base font-medium text-zinc-950">Nenhuma falta registrada</h4>
            <p className="mt-2 text-sm text-zinc-500">A turma esta sem alertas de ausencia nesta data.</p>
          </div>
        ) : faltas === 0 && total === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center p-10 text-sm text-zinc-400">
            Sem dados para mostrar.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {alunosDaTurma.filter(a => a.status === 'falta').map(aluno => (
              <div key={`falta-${aluno.id}`} className="grid gap-4 px-6 py-4 transition-colors duration-150 hover:bg-zinc-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-950">{aluno.nome}</p>
                  <p className="truncate text-xs text-zinc-500">{aluno.email}</p>
                </div>
                <span className="ds-badge ds-badge-danger justify-self-start sm:justify-self-end">
                  <XCircle className="h-3.5 w-3.5" /> Ausente
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
