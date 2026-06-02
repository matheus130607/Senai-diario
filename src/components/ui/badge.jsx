import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-zinc-900 text-zinc-50',
        secondary: 'border-transparent bg-zinc-100 text-zinc-900',
        outline: 'border-zinc-200 text-zinc-700',
        muted: 'border-zinc-200 bg-zinc-50 text-zinc-600',
      },
    },
    defaultVariants: {
      variant: 'muted',
    },
  },
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
