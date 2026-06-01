import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '~/lib/utils';

// Atrevida customizado — match con LeadStatusBadge: height 24, padding 0
// 10px, rounded-pill, gap 6. Para badges con dot, usar `LeadStatusBadge`
// que tiene la lógica de status; Badge es para casos genéricos (outline,
// secondary, success/teal, warning/amber).
const badgeVariants = cva(
  'inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[11.5px] font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border-strong bg-transparent text-foreground',
        success: 'border-[hsl(var(--teal))]/30 bg-[hsl(var(--teal))]/15 text-[hsl(var(--teal))]',
        warning: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
        violet: 'border-[hsl(var(--violet))]/30 bg-[hsl(var(--violet))]/15 text-[hsl(var(--violet))]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
