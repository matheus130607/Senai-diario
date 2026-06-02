import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  XCircle,
} from 'lucide-react';
import { Button as ShadButton } from './button';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

const toneClass = {
  neutral: 'border-zinc-200 bg-zinc-50 text-zinc-700',
  success: 'border-zinc-200 bg-white text-zinc-800',
  danger: 'border-zinc-200 bg-white text-zinc-800',
  warning: 'border-zinc-200 bg-white text-zinc-800',
};

export function SectionHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 text-left">
        {eyebrow && <div className="section-kicker mb-2">{eyebrow}</div>}
        <h2 className="m-0 text-xl font-semibold tracking-[-0.01em] text-zinc-950">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Button({ children, variant = 'neutral', className = '', ...props }) {
  const variantMap = {
    primary: 'default',
    neutral: 'outline',
    success: 'success',
  };

  return (
    <ShadButton variant={variantMap[variant] || variant} className={className} {...props}>
      {children}
    </ShadButton>
  );
}

export function IconButton({ children, className = '', title, ...props }) {
  return (
    <ShadButton
      type="button"
      variant="ghost"
      size="icon"
      className={cn('text-zinc-500 hover:text-zinc-950', className)}
      title={title}
      aria-label={title}
      {...props}
    >
      {children}
    </ShadButton>
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
    <Badge variant="outline" className={toneClass[tone] || toneClass.neutral}>
      {Icon && <Icon size={14} />}
      {children}
    </Badge>
  );
}

export function EmptyState({ icon: Icon = Database, title, description }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-10 text-center">
      <Icon className="mb-4 h-10 w-10 text-zinc-300" />
      <h3 className="text-base font-semibold text-zinc-950">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{description}</p>}
    </div>
  );
}

export function AvatarInitial({ name, className = '' }) {
  return (
    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-sm font-semibold text-zinc-700', className)}>
      {String(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}
