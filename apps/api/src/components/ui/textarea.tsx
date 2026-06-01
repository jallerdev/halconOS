import * as React from 'react';

import { cn } from '~/lib/utils';

// Atrevida customizado — match Input + min-height.
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full resize-y rounded-md border border-border-strong bg-card-2/60 px-3 py-2.5 text-[13.5px] text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-[hsl(var(--violet))] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[hsl(var(--violet))]/14 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export { Textarea };
