import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '~/lib/utils';

// Atrevida customizado — no regenerar con shadcn CLI.
// Variants match el design handoff: .btn-primary (violet sólido con shimmer),
// .btn-outline (border-border-strong), .btn-ghost (sin bg, hover accent).
// Todos los buttons llevan `.hx-press` (scale 0.96 on :active).
const buttonVariants = cva(
  'hx-press inline-flex items-center justify-center gap-[7px] whitespace-nowrap rounded-md text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--violet))]/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[15px] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Primario violeta sólido con shadow y barrido shimmer en hover.
        default:
          'hx-btn-shine border border-transparent bg-[hsl(var(--violet))] text-white shadow-[0_1px_2px_hsl(var(--violet)/0.35)] hover:bg-[hsl(var(--violet)/0.92)] hover:shadow-[0_4px_14px_hsl(var(--violet)/0.35)]',
        secondary:
          'border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline:
          'border border-border-strong bg-transparent text-foreground hover:bg-accent',
        ghost: 'border border-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
        destructive: 'border border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link: 'text-[hsl(var(--violet))] underline-offset-4 hover:underline',
        // Mantenido por compat con callers viejos — Atrevida usa whatsapp-button.tsx
        // que ya no pasa por aquí. Eventualmente eliminar.
        whatsapp:
          'border border-transparent bg-[#25d366] text-white shadow-sm shadow-[#25d366]/30 hover:bg-[#1faa56]',
        success:
          'border border-transparent bg-[hsl(var(--teal))] text-white shadow-sm shadow-[hsl(var(--teal))]/30 hover:bg-[hsl(var(--teal)/0.9)]',
      },
      size: {
        default: 'h-9 px-[15px]',
        sm: 'h-8 rounded-md px-3 text-[12.5px]',
        lg: 'h-10 rounded-md px-6',
        icon: 'h-9 w-9 px-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
