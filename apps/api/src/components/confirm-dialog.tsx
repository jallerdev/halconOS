'use client';

import { AlertTriangle, HelpCircle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog';
import { buttonVariants } from '~/components/ui/button';
import { cn } from '~/lib/utils';

type ConfirmDialogProps = {
  trigger: ReactNode;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
};

// ConfirmDialog — wrapper de AlertDialog con el modal-icon-box arriba del
// título (handoff .modal-ico). Danger → rosa, default → violet.
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
  disabled,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    await onConfirm();
    setOpen(false);
  };

  const Icon = destructive ? AlertTriangle : HelpCircle;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild disabled={disabled}>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <span className={cn('hx-modal-ico', destructive ? 'hx-modal-ico-danger' : 'hx-modal-ico-info')}>
            <Icon className="size-[22px]" />
          </span>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={cn(
              destructive
                ? buttonVariants({ variant: 'destructive' })
                : buttonVariants({ variant: 'default' }),
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
