'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import { cn } from '~/lib/utils';

// CopyButton — botón discreto que copia un string al clipboard y muestra
// un check teal por 1.3s. Match exacto del handoff (.copyable button).
// Render inline al lado de un campo (tel / email / address).
export function CopyButton({
  value,
  label = 'Copiar',
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1300);
    } catch {
      // noop — Clipboard API puede fallar en contextos no seguros
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      title={label}
      className={cn(
        'hx-press inline-grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100',
        copied && 'opacity-100 text-[hsl(var(--teal))]',
        className,
      )}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}
