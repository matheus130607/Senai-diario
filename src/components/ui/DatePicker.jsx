import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateValue = (value) => {
  const [year, month, day] = String(value || '').split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const startOfMonthGrid = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());
  return gridStart;
};

const isSameDay = (a, b) => (
  a && b
  && a.getFullYear() === b.getFullYear()
  && a.getMonth() === b.getMonth()
  && a.getDate() === b.getDate()
);

const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const buttonFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function DatePicker({
  value,
  min,
  max,
  onChange,
  disabled = false,
  className = '',
  ariaLabel = 'Selecionar data',
}) {
  const rootRef = useRef(null);
  const selectedDate = parseDateValue(value);
  const minDate = parseDateValue(min);
  const maxDate = parseDateValue(max);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(selectedDate || maxDate || new Date());

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const days = useMemo(() => {
    const start = startOfMonthGrid(viewDate);
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [viewDate]);

  const changeMonth = (amount) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const togglePicker = () => {
    if (!isOpen) setViewDate(selectedDate || maxDate || new Date());
    setIsOpen((open) => !open);
  };

  const selectDate = (date) => {
    const nextValue = toDateInputValue(date);
    onChange?.({ target: { value: nextValue } });
    setIsOpen(false);
  };

  const isOutOfRange = (date) => (
    (minDate && date < minDate)
    || (maxDate && date > maxDate)
  );

  const buttonLabel = selectedDate ? buttonFormatter.format(selectedDate) : 'Selecionar data';

  return (
    <div ref={rootRef} className={`date-picker ${className}`}>
      <button
        type="button"
        className="date-picker-trigger ds-input"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={togglePicker}
      >
        <CalendarDays className="h-4 w-4 text-slate-400" />
        <span>{buttonLabel}</span>
      </button>

      {isOpen && (
        <div className="date-picker-popover" role="dialog" aria-label="Calendario">
          <div className="date-picker-header">
            <button type="button" className="date-picker-nav" onClick={() => changeMonth(-1)} aria-label="Mes anterior">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <strong>{monthFormatter.format(viewDate)}</strong>
            <button type="button" className="date-picker-nav" onClick={() => changeMonth(1)} aria-label="Proximo mes">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="date-picker-weekdays" aria-hidden="true">
            {WEEK_DAYS.map((day) => <span key={day}>{day}</span>)}
          </div>

          <div className="date-picker-grid">
            {days.map((day) => {
              const dateKey = toDateInputValue(day);
              const isMuted = day.getMonth() !== viewDate.getMonth();
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const isDisabled = isOutOfRange(day);

              return (
                <button
                  key={dateKey}
                  type="button"
                  className={`date-picker-day ${isMuted ? 'is-muted' : ''} ${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''}`}
                  disabled={isDisabled}
                  onClick={() => selectDate(day)}
                  aria-label={buttonFormatter.format(day)}
                  aria-pressed={isSelected}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
