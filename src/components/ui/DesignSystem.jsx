import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  XCircle,
} from 'lucide-react';

const toneClass = {
  neutral: 'ds-badge',
  success: 'ds-badge ds-badge-success',
  danger: 'ds-badge ds-badge-danger',
  warning: 'ds-badge ds-badge-warning',
};

export function SectionHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 text-left">
        {eyebrow && <div className="section-kicker mb-2">{eyebrow}</div>}
        <h2 className="m-0 text-xl font-medium tracking-[-0.01em] text-slate-950">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Button({ children, variant = 'neutral', className = '', ...props }) {
  const variantClass = {
    primary: 'ds-button-primary',
    neutral: 'ds-button-neutral',
    success: 'ds-button-success',
  }[variant] || 'ds-button-neutral';

  return (
    <button className={`ds-button ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function IconButton({ children, className = '', title, ...props }) {
  return (
    <button className={`ds-icon-button ${className}`} title={title} aria-label={title} {...props}>
      {children}
    </button>
  );
}

export function StatusBadge({ tone = 'neutral', icon, children }) {
  const Icon = icon || {
    neutral: Clock3,
    success: CheckCircle2,
    danger: XCircle,
    warning: AlertTriangle,
  }[tone];

  return (
    <span className={toneClass[tone] || toneClass.neutral}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon = Database, title, description }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <Icon className="mb-4 h-10 w-10 text-slate-300" />
      <h3 className="text-base font-medium text-slate-900">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export function AvatarInitial({ name, tone = 'slate', className = '' }) {
  const toneClassName = {
    slate: 'bg-slate-100 text-slate-700',
    red: 'bg-red-50 text-red-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  }[tone] || 'bg-slate-100 text-slate-700';

  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${toneClassName} ${className}`}>
      {String(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}
