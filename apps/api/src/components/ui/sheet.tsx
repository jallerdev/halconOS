'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '~/lib/utils';

// Atrevida customizado — sheet con glass + stripe gradient violet→teal
// en el borde izquierdo. Width default 460px, `wide` 520px.
// Para meter el stripe agregamos la clase `hx-sheet-stripe` que pinta el
// ::before como una franja gradient.
const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

type SheetVariant = 'default' | 'wide';

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: 'right' | 'left';
    variant?: SheetVariant;
  }
>(({ className, children, side = 'right', variant = 'default', ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[hsl(240_10%_2%/0.55)] backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'hx-sheet-stripe fixed inset-y-0 z-50 flex h-full w-full flex-col bg-card/96 shadow-pop backdrop-blur-[28px] transition-transform ease-[cubic-bezier(.22,.61,.36,1)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-300',
        side === 'right'
          ? 'right-0 border-l border-border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right'
          : 'left-0 border-r border-border data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        variant === 'wide' ? 'sm:max-w-[520px]' : 'sm:max-w-[460px]',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="hx-press absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none">
        <X className="size-4" />
        <span className="sr-only">Cerrar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = 'SheetContent';

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-[18px] font-bold tracking-[-0.02em]', className)}
    {...props}
  />
));
SheetTitle.displayName = 'SheetTitle';

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-[12.5px] leading-[1.5] text-muted-foreground', className)}
    {...props}
  />
));
SheetDescription.displayName = 'SheetDescription';

// Sheet layout helpers — head / body / foot con el spacing del handoff.
const SheetHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-start justify-between gap-3 border-b border-border px-[22px] pb-[18px] pt-5',
        className,
      )}
      {...props}
    />
  ),
);
SheetHeader.displayName = 'SheetHeader';

const SheetBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex-1 overflow-y-auto px-[22px] py-5', className)} {...props} />
  ),
);
SheetBody.displayName = 'SheetBody';

const SheetFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-end gap-2 border-t border-border px-[22px] py-4',
        className,
      )}
      {...props}
    />
  ),
);
SheetFooter.displayName = 'SheetFooter';

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetHeader,
  SheetBody,
  SheetFooter,
};
