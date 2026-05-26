import { Moon, Sun, Sunrise, Sunset } from 'lucide-react';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return { label: 'Bom dia', Icon: Sunrise };
  if (hour >= 11 && hour < 17) return { label: 'Boa tarde', Icon: Sun };
  if (hour >= 17 && hour < 20) return { label: 'Boa noite', Icon: Sunset };
  return { label: 'Boa noite', Icon: Moon };
}

function formatFullDate() {
  try {
    return new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function DashboardShell({ children, title = 'Painel', subtitle = '' }) {
  const greeting = getGreeting();
  const GreetingIcon = greeting.Icon;
  const fullDate = formatFullDate();

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-100 bg-white/70 px-3 py-1.5 text-[0.72rem] font-medium uppercase tracking-[0.08em] text-red-600">
            <GreetingIcon className="h-3.5 w-3.5" />
            {greeting.label}
          </div>
          <h1 className="m-0 text-[2rem] font-semibold leading-[1.08] tracking-[-0.02em] text-slate-950 sm:text-[2.45rem]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-3xl text-[0.95rem] leading-6 text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        <div className="justify-self-start px-0 py-1 text-left lg:justify-self-end">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400">Hoje</p>
          <p className="mt-1 text-sm font-medium capitalize text-slate-700">{fullDate}</p>
        </div>
      </header>

      {children}
    </div>
  );
}
