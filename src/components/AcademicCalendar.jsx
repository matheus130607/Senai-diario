import { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  GraduationCap,
  Search,
  Users,
} from 'lucide-react';
import { Button, EmptyState, SectionHeader, StatusBadge } from './ui/DesignSystem';
import {
  addDays,
  addMonths,
  buildAttendanceEvents,
  endOfWeek,
  formatDateKey,
  getAttendanceSummary,
  getCalendarScopeDescription,
  getMonthGrid,
  groupEventsByDate,
  STATUS_LABELS,
  STATUS_TONES,
  startOfWeek,
  toDateKey,
} from '../utils/attendanceAnalytics';
import { getRoleLabel, getVisibleTurmas } from '../utils/permissions';

const VIEW_OPTIONS = [
  { id: 'year', label: 'Ano' },
  { id: 'month', label: 'Mês' },
  { id: 'week', label: 'Semana' },
  { id: 'day', label: 'Dia' },
];

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });

const normalizeText = (value) => String(value || '').toLowerCase();

function CalendarMetric({ icon: Icon, label, value, detail }) {
  return (
    <div className="calendar-metric">
      <Icon className="h-4 w-4 text-slate-500" />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {detail && <small>{detail}</small>}
      </div>
    </div>
  );
}

function EventPills({ events }) {
  const summary = getAttendanceSummary(events);
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {summary.presentes > 0 && <span className="calendar-dot bg-zinc-700" title={`${summary.presentes} presença(s)`} />}
      {summary.faltas > 0 && <span className="calendar-dot bg-zinc-500" title={`${summary.faltas} falta(s)`} />}
      {summary.atrasos > 0 && <span className="calendar-dot bg-zinc-400" title={`${summary.atrasos} atraso(s)`} />}
      {summary.pendentes > 0 && <span className="calendar-dot bg-slate-400" title={`${summary.pendentes} pendência(s)`} />}
    </div>
  );
}

function EventList({ events, compact = false }) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
        Nenhum registro de chamada para este recorte.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <article key={event.id || `${event.alunoId}-${event.data}`} className="calendar-event-card">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="truncate text-sm font-semibold text-slate-950">{event.aluno?.nome || event.aluno || 'Aluno'}</h4>
              <StatusBadge tone={STATUS_TONES[event.status] || 'neutral'}>
                {STATUS_LABELS[event.status] || event.status}
              </StatusBadge>
            </div>
            <div className="mt-2 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
              <span>Turma: {event.turma?.nome || event.turma || 'Não informada'}</span>
              <span>Termo: {event.termo}</span>
              <span>Período: {event.periodo}</span>
              <span>Professor: {event.professor?.nome || 'Não informado'}</span>
            </div>
            {!compact && (event.observacao || event.justificativa) && (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                {event.observacao && <p><strong>Observação:</strong> {event.observacao}</p>}
                {event.justificativa && <p><strong>Justificativa:</strong> {event.justificativa}</p>}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

export default function AcademicCalendar({ data, currentUser }) {
  const [view, setView] = useState('month');
  const [cursorDate, setCursorDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [statusFilter, setStatusFilter] = useState('todos');
  const [turmaFilter, setTurmaFilter] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');

  const visibleTurmas = useMemo(() => getVisibleTurmas(data, currentUser), [data, currentUser]);
  const allEvents = useMemo(() => buildAttendanceEvents(data, currentUser), [data, currentUser]);

  const filteredEvents = useMemo(() => {
    const search = normalizeText(searchTerm);
    return allEvents.filter((event) => {
      const matchesStatus = statusFilter === 'todos' || event.status === statusFilter;
      const matchesTurma = turmaFilter === 'todas' || event.turma?.id === turmaFilter || event.turmaId === turmaFilter;
      const matchesSearch = !search || [
        event.aluno?.nome,
        event.aluno?.email,
        event.turma?.nome,
        event.professor?.nome,
        event.observacao,
        event.justificativa,
      ].some((value) => normalizeText(value).includes(search));

      return matchesStatus && matchesTurma && matchesSearch;
    });
  }, [allEvents, searchTerm, statusFilter, turmaFilter]);

  const eventsByDate = useMemo(() => groupEventsByDate(filteredEvents), [filteredEvents]);
  const selectedEvents = eventsByDate[selectedDate] || [];
  const globalSummary = getAttendanceSummary(filteredEvents);
  const selectedSummary = getAttendanceSummary(selectedEvents);

  const navigate = (direction) => {
    const amount = direction === 'next' ? 1 : -1;
    const nextDate = view === 'year'
      ? new Date(cursorDate.getFullYear() + amount, cursorDate.getMonth(), 1)
      : view === 'month'
        ? addMonths(cursorDate, amount)
        : addDays(cursorDate, view === 'week' ? amount * 7 : amount);

    setCursorDate(nextDate);
    setSelectedDate(toDateKey(nextDate));
  };

  const calendarTitle = view === 'year'
    ? String(cursorDate.getFullYear())
    : view === 'week'
      ? `${formatDateKey(toDateKey(startOfWeek(cursorDate)), { day: '2-digit', month: 'short' })} - ${formatDateKey(toDateKey(endOfWeek(cursorDate)), { day: '2-digit', month: 'short' })}`
      : view === 'day'
        ? formatDateKey(toDateKey(cursorDate), { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
        : monthFormatter.format(cursorDate);

  const renderYearView = () => (
    <div className="calendar-year-grid">
      {Array.from({ length: 12 }, (_, monthIndex) => {
        const monthDate = new Date(cursorDate.getFullYear(), monthIndex, 1);
        const monthKey = `${monthDate.getFullYear()}-${String(monthIndex + 1).padStart(2, '0')}`;
        const monthEvents = filteredEvents.filter((event) => String(event.data || '').startsWith(monthKey));
        const summary = getAttendanceSummary(monthEvents);

        return (
          <button
            key={monthKey}
            type="button"
            className="calendar-month-card text-left"
            onClick={() => {
              setView('month');
              setCursorDate(monthDate);
              setSelectedDate(toDateKey(monthDate));
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold capitalize text-slate-950">{monthDate.toLocaleDateString('pt-BR', { month: 'long' })}</span>
              <span className="ds-badge">{monthEvents.length}</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-zinc-900" style={{ width: `${summary.presencaPercentual}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-500">
              <span>{summary.presentes} pres.</span>
              <span>{summary.faltas} faltas</span>
              <span>{summary.atrasos} atrasos</span>
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderMonthView = () => {
    const days = getMonthGrid(cursorDate);
    return (
      <div className="calendar-grid-shell">
        <div className="calendar-week-header">
          {WEEK_DAYS.map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="calendar-month-grid">
          {days.map((day) => {
            const dateKey = toDateKey(day);
            const isCurrentMonth = day.getMonth() === cursorDate.getMonth();
            const isSelected = dateKey === selectedDate;
            const dayEvents = eventsByDate[dateKey] || [];

            return (
              <button
                key={dateKey}
                type="button"
                className={`calendar-day-cell ${isSelected ? 'is-selected' : ''} ${!isCurrentMonth ? 'is-muted' : ''}`}
                onClick={() => {
                  setSelectedDate(dateKey);
                  setCursorDate(day);
                }}
                aria-label={`Ver registros de ${formatDateKey(dateKey)}`}
              >
                <span className="calendar-day-number">{day.getDate()}</span>
                <span className="mt-2 text-xs font-medium text-slate-500">{dayEvents.length ? `${dayEvents.length} registro(s)` : 'Sem chamada'}</span>
                <EventPills events={dayEvents} />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const start = startOfWeek(cursorDate);
    const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));

    return (
      <div className="calendar-week-grid">
        {days.map((day) => {
          const dateKey = toDateKey(day);
          const dayEvents = eventsByDate[dateKey] || [];
          const summary = getAttendanceSummary(dayEvents);
          return (
            <button
              key={dateKey}
              type="button"
              className={`calendar-week-column ${dateKey === selectedDate ? 'is-selected' : ''}`}
              onClick={() => {
                setSelectedDate(dateKey);
                setCursorDate(day);
              }}
            >
              <div className="text-left">
                <span className="text-xs font-semibold uppercase text-slate-400">{WEEK_DAYS[day.getDay()]}</span>
                <strong className="mt-1 block text-2xl text-slate-950">{day.getDate()}</strong>
              </div>
              <div className="mt-4 space-y-2 text-left">
                <StatusBadge tone="success">P {summary.presentes}</StatusBadge>
                <StatusBadge tone="danger">F {summary.faltas}</StatusBadge>
                <StatusBadge tone="warning">A {summary.atrasos}</StatusBadge>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => (
    <div className="calendar-day-view">
      <div className="calendar-time-rail" aria-hidden="true">
        {['07:00', '09:00', '11:00', '13:00', '15:00', '17:00'].map((hour) => (
          <span key={hour}>{hour}</span>
        ))}
      </div>
      <div className="calendar-day-agenda">
        <EventList events={eventsByDate[toDateKey(cursorDate)] || []} />
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Agenda Acadêmica"
        title="Calendário"
        description={`Visual inspirado em agenda profissional. Perfil: ${getRoleLabel(currentUser?.role)}. ${getCalendarScopeDescription(data, currentUser)}`}
      />

      <div className="calendar-toolbar">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => navigate('previous')} aria-label="Período anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button onClick={() => navigate('next')} aria-label="Próximo período">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <button
            type="button"
            className="ds-button ds-button-neutral"
            onClick={() => {
              const today = new Date();
              setCursorDate(today);
              setSelectedDate(toDateKey(today));
            }}
          >
            Hoje
          </button>
        </div>

        <h3 className="min-w-0 text-lg font-semibold capitalize text-slate-950">{calendarTitle}</h3>

        <div className="calendar-segmented" role="group" aria-label="Visualização do calendário">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={view === option.id ? 'is-active' : ''}
              onClick={() => setView(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="calendar-filters">
        <label>
          <span className="ds-label">Turma</span>
          <select value={turmaFilter} onChange={(event) => setTurmaFilter(event.target.value)} className="ds-input">
            <option value="todas">Todas as turmas</option>
            {visibleTurmas.map((turma) => <option key={turma.id} value={turma.id}>{turma.nome}</option>)}
          </select>
        </label>
        <label>
          <span className="ds-label">Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="ds-input">
            <option value="todos">Todos</option>
            <option value="presente">Presentes</option>
            <option value="falta">Faltas</option>
            <option value="atraso">Atrasos</option>
            <option value="pendente">Pendentes</option>
          </select>
        </label>
        <label>
          <span className="ds-label">Busca</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Aluno, turma, professor ou observação"
              className="ds-input ds-input-icon-left"
            />
          </span>
        </label>
      </div>

      {filteredEvents.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Sem eventos no escopo atual" description="Ajuste os filtros ou registre chamadas para popular a agenda acadêmica." />
      ) : (
        <div className="calendar-layout">
          <section className="calendar-main-panel" aria-label="Visualização do calendário">
            {view === 'year' && renderYearView()}
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}
          </section>

          <aside className="calendar-detail-panel">
            <div className="mb-5">
              <p className="section-kicker mb-2">Dia selecionado</p>
              <h3 className="text-lg font-semibold capitalize text-slate-950">
                {formatDateKey(selectedDate, { weekday: 'long', day: '2-digit', month: 'long' })}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{selectedEvents.length} registro(s) encontrados</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CalendarMetric icon={Users} label="Presentes" value={selectedSummary.presentes} />
              <CalendarMetric icon={GraduationCap} label="Faltas" value={selectedSummary.faltas} />
              <CalendarMetric icon={Clock3} label="Atrasos" value={selectedSummary.atrasos} />
              <CalendarMetric icon={Eye} label="Presença" value={`${selectedSummary.presencaPercentual}%`} />
            </div>

            <div className="my-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-zinc-600" />
                Resumo do período filtrado
              </div>
              <p className="text-sm leading-6 text-slate-600">
                {globalSummary.total} registros, {globalSummary.presencaPercentual}% de presença e {globalSummary.faltasPercentual}% de faltas.
              </p>
            </div>

            <EventList events={selectedEvents} compact />
          </aside>
        </div>
      )}
    </div>
  );
}
