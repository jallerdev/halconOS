'use client';

import { CalendarClock, ExternalLink, MapPin, Phone, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { BusinessAvatar } from '~/components/business-avatar';
import { ScoreBadge } from '~/components/score-badge';
import { StatusSelect } from '~/components/status-select';
import { WhatsAppButton } from '~/components/whatsapp-button';
import { Button } from '~/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '~/components/ui/sheet';
import { trpc } from '~/lib/trpc';

export function LeadPeek({
  leadId,
  open,
  onOpenChange,
}: {
  leadId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const { data: lead } = trpc.leads.byId.useQuery({ id: leadId! }, { enabled: !!leadId && open });

  const updateStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      utils.leads.byId.invalidate({ id: leadId! });
      utils.leads.search.invalidate();
      utils.leads.stats.invalidate();
      toast.success('Estado actualizado');
    },
  });
  const genStrategy = trpc.leads.generateAi.useMutation({
    onSuccess: () => {
      utils.leads.byId.invalidate({ id: leadId! });
      toast.success('Estrategia generada');
    },
    onError: (e) => toast.error(e.message),
  });
  const setFollowUp = trpc.leads.setFollowUp.useMutation({
    onSuccess: () => {
      utils.leads.byId.invalidate({ id: leadId! });
      utils.leads.followUps.invalidate();
      toast.success('Seguimiento programado');
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0">
        {!lead ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <SheetTitle className="sr-only">Cargando lead</SheetTitle>
            Cargando…
          </div>
        ) : (
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-border/60 p-6">
              <div className="flex items-start gap-3">
                <BusinessAvatar name={lead.businessName} size="md" />
                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate pr-8">{lead.businessName}</SheetTitle>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {[lead.category, lead.city].filter(Boolean).join(' · ') || '—'}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusSelect
                      value={lead.status}
                      onChange={(s) => updateStatus.mutate({ id: lead.id, status: s })}
                    />
                    <ScoreBadge score={lead.score} />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <WhatsAppButton
                  leadId={lead.id}
                  phone={lead.phone}
                  phoneIntl={lead.phoneIntl}
                  aiFirstMessage={lead.aiFirstMessage}
                  businessName={lead.businessName}
                />
                {lead.phone && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${lead.phone}`}>
                      <Phone className="size-4" /> Llamar
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Body scrollable */}
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Rating" value={lead.googleRating ? `★ ${lead.googleRating}` : '—'} />
                <Stat label="Reseñas" value={lead.reviewCount?.toLocaleString('es-CO') ?? '—'} />
                <Stat label="Precio" value={lead.priceLevel ?? '—'} />
                <Stat label="Tiene web" value={lead.hasWebsite ? 'Sí' : 'No'} />
              </div>

              {lead.address && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  <span>{lead.address}</span>
                </div>
              )}

              {/* Seguimiento */}
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/20 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarClock className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Próximo seguimiento</span>
                </div>
                <input
                  type="date"
                  value={lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString().slice(0, 10) : ''}
                  onChange={(e) =>
                    setFollowUp.mutate({
                      id: lead.id,
                      date: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-ring [color-scheme:dark]"
                />
              </div>

              {/* Estrategia rápida */}
              <div className="rounded-lg border border-border/60 bg-secondary/20 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <Sparkles className="size-4 text-primary" /> Estrategia de venta
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => genStrategy.mutate({ id: lead.id, kind: 'strategy' })}
                    disabled={genStrategy.isPending}
                  >
                    {genStrategy.isPending ? 'Generando…' : lead.aiSalesAngle ? 'Regenerar' : 'Generar'}
                  </Button>
                </div>
                {lead.aiSalesAngle ? (
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {lead.aiSalesAngle}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Genera el ángulo de venta para este negocio con IA.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border/60 p-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/leads/${lead.id}`}>
                  <ExternalLink className="size-4" /> Ver perfil completo
                </Link>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-sm">{value}</div>
    </div>
  );
}
