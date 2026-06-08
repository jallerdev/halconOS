'use client';

import { Check, Copy, FileText, Lightbulb, Loader2, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

import type { AiKind } from '@halcon-os/shared/schemas';
import { Button } from '~/components/ui/button';
import { WhatsAppIcon } from '~/components/icons/whatsapp-icon';
import { usePermissions } from '~/hooks/use-permissions';
import { trpc } from '~/lib/trpc';

type LeadLike = {
  id: string;
  aiSalesAngle: string | null;
  aiPainPoints: string | null;
  aiSuggestedPage: string | null;
  aiProposal: string | null;
  aiFirstMessage: string | null;
  aiLandingCopy: string | null;
};

const TOOLS: { kind: AiKind; label: string; icon: LucideIcon }[] = [
  { kind: 'strategy', label: 'Estrategia de venta', icon: Lightbulb },
  { kind: 'proposal', label: 'Propuesta comercial', icon: FileText },
  { kind: 'message', label: 'Mensaje de contacto', icon: WhatsAppIcon as unknown as LucideIcon },
  { kind: 'landing', label: 'Copy de landing', icon: Sparkles },
];

export function AiPanel({ lead }: { lead: LeadLike }) {
  const utils = trpc.useUtils();
  const { can } = usePermissions();
  // El seller no tiene leads.ai.landing; solo se muestran las herramientas
  // permitidas por su rol. El server re-valida por kind igualmente.
  const tools = TOOLS.filter((t) => can(`leads.ai.${t.kind}`));
  const [active, setActive] = useState<AiKind>('strategy');
  const generate = trpc.leads.generateAi.useMutation({
    onSuccess: () => utils.leads.byId.invalidate({ id: lead.id }),
  });

  const pending = generate.isPending ? generate.variables?.kind : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tools.map((t) => (
          <button
            key={t.kind}
            type="button"
            onClick={() => setActive(t.kind)}
            className={`hx-press inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors ${
              active === t.kind
                ? 'border-[hsl(var(--violet))]/45 bg-[hsl(var(--violet))]/12 text-foreground'
                : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <t.icon className="size-4" />
            {t.label}
          </button>
        ))}
      </div>

      <ToolContent
        kind={active}
        lead={lead}
        pending={pending === active}
        error={generate.error?.message ?? null}
        onGenerate={() => generate.mutate({ id: lead.id, kind: active })}
      />
    </div>
  );
}

function ToolContent({
  kind,
  lead,
  pending,
  error,
  onGenerate,
}: {
  kind: AiKind;
  lead: LeadLike;
  pending: boolean;
  error: string | null;
  onGenerate: () => void;
}) {
  const blocks = contentFor(kind, lead);
  const hasContent = blocks.some((b) => b.body);

  return (
    <div className="rounded-md border border-border bg-card-2/40 p-4">
      {error && (
        <div className="mb-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {error}
        </div>
      )}

      {hasContent ? (
        <div className="space-y-4">
          {blocks.map(
            (b) =>
              b.body && (
                <div key={b.title} className="group">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[hsl(var(--violet))]">
                      {b.title}
                    </span>
                    <CopyButton text={b.body} />
                  </div>
                  <p className="whitespace-pre-wrap text-[13.5px] leading-[1.55] text-muted-foreground">
                    {b.body}
                  </p>
                </div>
              ),
          )}
          <Button variant="outline" size="sm" onClick={onGenerate} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Regenerar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Genera {label(kind)} personalizada para {' '}
            <span className="text-foreground">este negocio</span> con IA.
          </p>
          <Button className="mt-4" size="sm" onClick={onGenerate} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {pending ? 'Generando…' : 'Generar con IA'}
          </Button>
        </div>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

function label(kind: AiKind): string {
  return {
    strategy: 'una estrategia de venta',
    proposal: 'una propuesta comercial',
    message: 'un mensaje de primer contacto',
    landing: 'el copy de una landing',
  }[kind];
}

function contentFor(kind: AiKind, lead: LeadLike): { title: string; body: string | null }[] {
  switch (kind) {
    case 'strategy':
      return [
        { title: 'Ángulo de venta', body: lead.aiSalesAngle },
        { title: 'Dolores del negocio', body: lead.aiPainPoints },
        { title: 'Página sugerida', body: lead.aiSuggestedPage },
      ];
    case 'proposal':
      return [{ title: 'Propuesta comercial', body: lead.aiProposal }];
    case 'message':
      return [{ title: 'Mensaje de primer contacto', body: lead.aiFirstMessage }];
    case 'landing':
      return [{ title: 'Copy de landing', body: lead.aiLandingCopy }];
  }
}
