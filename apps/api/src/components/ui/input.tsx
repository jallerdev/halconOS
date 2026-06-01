import * as React from 'react';

import { cn } from '~/lib/utils';

// Atrevida customizado — h-[38px], bg-card-2/60, border-border-strong,
// rounded-md, focus ring violet 14%.
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-[38px] w-full rounded-md border border-border-strong bg-card-2/60 px-3 text-[13.5px] text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-[hsl(var(--violet))] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[hsl(var(--violet))]/14 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
