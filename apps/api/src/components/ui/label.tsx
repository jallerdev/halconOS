import * as React from 'react';

import { cn } from '~/lib/utils';

// Atrevida customizado — labels normales de formulario (12.5px, font-weight
// 550 medio). Si se necesita una eyebrow uppercase, usar `text-[11px]
// font-semibold uppercase tracking-[0.06em]` directamente o `<span className="hx-eyebrow">`.
const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-[12.5px] font-medium text-foreground', className)}
      {...props}
    />
  ),
);
Label.displayName = 'Label';

export { Label };
