'use client';

import { AlertTriangle, CheckCircle2, Info, Loader2, X } from 'lucide-react';

import { cn } from '~/lib/utils';
import type { ToastEntry, ToastKind } from '~/hooks/use-toast';

// Toast individual. Match con el handoff: accent bar izquierdo 3px color
// del tipo, mark icon (36x36 con bg + color), título + body opcional,
// botón close + progress bar drenando 6.2s.
const ICON_MAP: Record<ToastKind, { Icon: typeof CheckCircle2; color: string }> = {
  success: { Icon: CheckCircle2, color: 'hsl(168 76% 46%)' },
  error: { Icon: AlertTriangle, color: 'hsl(347 89% 60%)' },
  warning: { Icon: AlertTriangle, color: 'hsl(38 92% 50%)' },
  info: { Icon: Info, color: 'hsl(199 89% 48%)' },
  loading: { Icon: Loader2, color: 'hsl(252 100% 68%)' },
};

export function Toast({ toast, onClose }: { toast: ToastEntry; onClose: () => void }) {
  const { Icon, color } = ICON_MAP[toast.kind];
  return (
    <div
      role="status"
      aria-live={toast.kind === 'error' ? 'assertive' : 'polite'}
      className="pointer-events-auto relative overflow-hidden rounded-md border border-border-strong bg-card/96 shadow-pop backdrop-blur-[28px]"
      style={{ animation: 'hxToastIn 0.42s cubic-bezier(0.22, 0.61, 0.36, 1)' }}
    >
      {/* Accent bar */}
      <span
        aria-hidden
        className="absolute bottom-0 left-0 top-0 w-[3px]"
        style={{ background: color }}
      />
      <div className="flex items-start gap-3 px-4 py-3 pl-[18px]">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-[10px]"
          style={{ background: `${color}22`, color }}
        >
          <Icon className={cn('size-[18px]', toast.kind === 'loading' && 'animate-spin')} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold leading-snug">{toast.message}</p>
          {toast.body && (
            <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{toast.body}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Descartar"
          className="hx-press -mr-1 grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
      {/* Progress bar — sólo si tiene duración finita */}
      {toast.duration > 0 && (
        <span
          aria-hidden
          className="absolute bottom-0 left-0 right-0 h-[2px] origin-left opacity-55"
          style={{
            background: color,
            animation: `hxToastBar ${toast.duration}ms linear forwards`,
          }}
        />
      )}
    </div>
  );
}
