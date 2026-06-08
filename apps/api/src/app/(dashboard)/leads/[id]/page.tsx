'use client';

import {
  Building2,
  CalendarClock,
  ChevronRight,
  DollarSign,
  FileText,
  Globe,
  History,
  Inbox,
  KanbanSquare,
  Loader2,
  Mail,
  MapPin,
  Paperclip,
  Pencil,
  Phone,
  Sparkles,
  Star,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from '~/hooks/use-toast';
import { usePermissions } from '~/hooks/use-permissions';
import { openEditLeadSheet } from '../../_components/EditLeadSheet';

import { BusinessAvatar } from '~/components/business-avatar';
import { CopyButton } from '~/components/copy-button';
import { ScoreBadge } from '~/components/score-badge';
import { StatusSelect } from '~/components/status-select';
import { WhatsAppButton } from '~/components/whatsapp-button';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { trpc } from '~/lib/trpc';
import { AiPanel } from './_components/AiPanel';
import { MeetingsPanel } from './_components/MeetingsPanel';
import { NotesPanel } from './_components/NotesPanel';
import { Timeline } from './_components/Timeline';

const SOURCE_LABELS: Record<string, string> = {
  referral: 'Referido',
  instagram: 'Instagram',
  google: 'Google',
  google_maps: 'Google Maps',
  walk_in: 'Walk-in',
  website: 'Website',
  other: 'Otro',
};

// Lead Detail — layout 2-col según el handoff:
//   • Sidebar izquierdo (340px): Contacto / Ubicación / Datos del negocio
//   • Main: tabs (Notas/Historial/Archivos) + Reuniones + Estrategia IA
export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const utils = trpc.useUtils();
  const { can } = usePermissions();
  const { data: lead, isLoading } = trpc.leads.byId.useQuery({ id });
  const [tab, setTab] = useState<'notes' | 'timeline' | 'files'>('notes');

  // Breadcrumb-back con filtros: LeadsTable guarda su última query string en
  // sessionStorage; la leemos en cliente para reconstruir el href y no perder
  // los filtros al volver desde el detalle.
  const [backHref, setBackHref] = useState('/leads');
  useEffect(() => {
    const saved = typeof window !== 'undefined'
      ? sessionStorage.getItem('halcon:leads:lastFilters')
      : null;
    if (saved) setBackHref(`/leads?${saved}`);
  }, []);

  const updateStatus = trpc.leads.updateStatus.useMutation({
    onMutate: async (input) => {
      await utils.leads.byId.cancel({ id });
      const prev = utils.leads.byId.getData({ id });
      utils.leads.byId.setData({ id }, (old) => (old ? { ...old, status: input.status } : old));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.leads.byId.setData({ id }, ctx.prev);
    },
    onSettled: () => {
      utils.leads.byId.invalidate({ id });
      utils.leads.stats.invalidate();
    },
  });

  const generateProposal = trpc.leads.generateAi.useMutation({
    onSuccess: () => utils.leads.byId.invalidate({ id }),
  });

  const promote = trpc.leads.promoteToPipeline.useMutation({
    onSuccess: () => {
      utils.leads.byId.invalidate({ id });
      utils.leads.pipeline.invalidate();
      utils.leads.search.invalidate();
      toast.success('Añadido al pipeline');
    },
    onError: (e) => toast.error(e.message),
  });
  const removeFromPipeline = trpc.leads.removeFromPipeline.useMutation({
    onSuccess: () => {
      utils.leads.byId.invalidate({ id });
      utils.leads.pipeline.invalidate();
      utils.leads.search.invalidate();
      toast.success('Sacado del pipeline');
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center px-6 py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (!lead) {
    return <div className="px-6 py-10 text-muted-foreground lg:px-10">Lead no encontrado.</div>;
  }

  const followUpLabel = lead.nextFollowUpAt
    ? new Date(lead.nextFollowUpAt).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
      })
    : 'Sin programar';

  const estimatedLabel = lead.estimatedValue
    ? new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }).format(Number(lead.estimatedValue))
    : '—';

  return (
    <div className="hx-page mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={backHref} className="transition-colors hover:text-foreground">
          Leads
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground">{lead.businessName}</span>
      </nav>

      {/* Header: avatar lg + nombre + status + score + meta · actions a la derecha */}
      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <BusinessAvatar name={lead.businessName} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[28px] font-bold leading-tight tracking-[-0.025em]">
                {lead.businessName}
              </h1>
              <StatusSelect
                value={lead.status}
                onChange={(s) =>
                  updateStatus.mutate(
                    { id, status: s },
                    { onSuccess: () => toast.success('Estado actualizado') },
                  )
                }
              />
              <ScoreBadge score={lead.score} size="md" />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {lead.category && <span>{lead.category}</span>}
              {lead.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {lead.city}
                </span>
              )}
              {lead.googleRating && (
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3.5 fill-primary text-primary" />
                  {lead.googleRating}
                  <span className="text-muted-foreground/70">
                    ({lead.reviewCount?.toLocaleString('es-CO')} reseñas)
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {lead.phone && (
            <Button variant="outline" asChild>
              <a href={`tel:${lead.phone}`}>
                <Phone className="size-4" /> Llamar
              </a>
            </Button>
          )}
          <WhatsAppButton
            leadId={lead.id}
            phone={lead.phone}
            phoneIntl={lead.phoneIntl}
            aiFirstMessage={lead.aiFirstMessage}
            businessName={lead.businessName}
          />
          {lead.status === 'NEW' &&
            (lead.pipelinePromotedAt ? (
              <Button
                variant="outline"
                onClick={() => removeFromPipeline.mutate({ id })}
                disabled={removeFromPipeline.isPending}
              >
                <Inbox className="size-4" /> Sacar del pipeline
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => promote.mutate({ id })}
                disabled={promote.isPending}
              >
                <KanbanSquare className="size-4" /> Añadir al pipeline
              </Button>
            ))}
          <Button
            variant="outline"
            onClick={() =>
              openEditLeadSheet({
                id: lead.id,
                businessName: lead.businessName,
                contactName: lead.contactName,
                phone: lead.phone,
                email: lead.email,
                source: lead.source,
                status: lead.status,
                estimatedValue: lead.estimatedValue,
                nextFollowUpAt: lead.nextFollowUpAt,
                tags: lead.tags,
              })
            }
          >
            <Pencil className="size-4" /> Editar
          </Button>
          <Button
            onClick={() => generateProposal.mutate({ id, kind: 'proposal' })}
            disabled={generateProposal.isPending}
          >
            {generateProposal.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Generar propuesta
          </Button>
        </div>
      </header>

      {/* Signals — 4 boxes con datos del negocio (valor / origen / follow-up / contacto) */}
      <div className="hx-stagger mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Signal icon={DollarSign} label="Valor estimado" value={estimatedLabel} />
        <Signal
          icon={Zap}
          label="Origen"
          value={lead.source ? (SOURCE_LABELS[lead.source] ?? lead.source) : '—'}
        />
        <Signal icon={CalendarClock} label="Seguimiento" value={followUpLabel} />
        <Signal icon={Users} label="Contacto" value={lead.contactName || '—'} />
      </div>

      {/* Grid 2 columnas */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-4">
          {/* Asignación — solo admin */}
          {can('leads.assign') && (
            <Card>
              <CardHeader>
                <CardTitle>Asignado a</CardTitle>
              </CardHeader>
              <CardContent>
                <AssignControl leadId={lead.id} assignedToId={lead.assignedToId} />
              </CardContent>
            </Card>
          )}

          {/* Contacto */}
          <Card>
            <CardHeader>
              <CardTitle>Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.contactName && (
                <InfoRow icon={Users} label="Persona" value={lead.contactName} />
              )}
              <CopyableRow icon={Phone} label="Teléfono" value={lead.phone} mono />
              <CopyableRow icon={Phone} label="Internacional" value={lead.phoneIntl} mono />
              <CopyableRow icon={Mail} label="Email" value={lead.email} />
              <div className="flex gap-2 pt-1">
                <WhatsAppButton
                  leadId={lead.id}
                  phone={lead.phone}
                  phoneIntl={lead.phoneIntl}
                  aiFirstMessage={lead.aiFirstMessage}
                  businessName={lead.businessName}
                  size="sm"
                />
                {lead.websiteUrl && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={lead.websiteUrl} target="_blank" rel="noreferrer">
                      <Globe className="size-4" /> Web
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle>Ubicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CopyableRow icon={MapPin} label="Dirección" value={lead.address} />
              <CopyableRow icon={Building2} label="Ciudad" value={lead.city} />
              <a
                href={lead.mapsUrl ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="hx-map-placeholder group relative block h-32"
              >
                <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                  <MapPin className="size-4" /> Ver en Google Maps
                </div>
              </a>
            </CardContent>
          </Card>

          {/* Datos del negocio */}
          <Card>
            <CardHeader>
              <CardTitle>Datos del negocio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow
                icon={Star}
                label="Rating"
                value={lead.googleRating ? `${lead.googleRating} / 5` : '—'}
                mono
              />
              <InfoRow
                icon={FileText}
                label="Reseñas"
                value={lead.reviewCount?.toLocaleString('es-CO') ?? '—'}
                mono
              />
              <InfoRow
                icon={Globe}
                label="Tiene web"
                value={lead.hasWebsite ? 'Sí' : 'No'}
              />
              <InfoRow
                icon={Building2}
                label="Nivel de precio"
                value={lead.priceLevel ?? '—'}
              />
              {lead.tags && lead.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {lead.tags.map((t) => (
                    <span key={t} className="hx-tag-chip" style={{ paddingRight: 10 }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Main: tabs + reuniones + IA */}
        <div className="space-y-4">
          <Card>
            <CardContent className="px-[22px] pb-5 pt-5">
              <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                <TabsList>
                  <TabsTrigger value="notes">
                    <FileText className="size-4" /> Notas
                  </TabsTrigger>
                  <TabsTrigger value="timeline">
                    <History className="size-4" /> Historial
                  </TabsTrigger>
                  <TabsTrigger value="files">
                    <Paperclip className="size-4" /> Archivos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="notes" className="mt-4">
                  <NotesPanel leadId={lead.id} />
                </TabsContent>
                <TabsContent value="timeline" className="mt-4">
                  <Timeline
                    createdAt={lead.createdAt}
                    updatedAt={lead.updatedAt}
                    convertedAt={lead.convertedAt}
                    scrapedAt={lead.scrapedAt}
                    status={lead.status}
                  />
                </TabsContent>
                <TabsContent value="files" className="mt-4">
                  <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border-strong py-10 text-center">
                    <Paperclip className="size-5 text-muted-foreground" />
                    <div className="text-sm font-semibold">Sin archivos</div>
                    <div className="text-xs text-muted-foreground">
                      Próximamente: adjunta propuestas y contratos.
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <MeetingsPanel
            leadId={lead.id}
            businessName={lead.businessName}
            leadEmail={lead.email}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-[hsl(var(--violet))]" /> Estrategia de venta · IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AiPanel lead={lead} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────── Asignación (admin) ───────────────────────

function AssignControl({
  leadId,
  assignedToId,
}: {
  leadId: string;
  assignedToId: string | null;
}) {
  const utils = trpc.useUtils();
  const members = trpc.members.list.useQuery();
  const assign = trpc.leads.assign.useMutation({
    onSuccess: () => {
      utils.leads.byId.invalidate({ id: leadId });
      utils.leads.search.invalidate();
      toast.success('Asignación actualizada');
    },
    onError: (e) => toast.error(e.message),
  });

  const current = members.data?.find((m) => m.id === assignedToId);
  const currentLabel = current ? (current.name ?? current.email) : 'Sin asignar';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start" disabled={assign.isPending}>
          <UserPlus className="size-4" />
          {currentLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {(members.data ?? []).map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => assign.mutate({ id: leadId, assignedToId: m.id })}
          >
            {m.name ?? m.email}
          </DropdownMenuItem>
        ))}
        {(members.data?.length ?? 0) > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={() => assign.mutate({ id: leadId, assignedToId: null })}>
          Sin asignar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────── Signal box ───────────────────────

function Signal({
  icon: Icon,
  label,
  value,
}: {
  icon: import('lucide-react').LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="hx-lift-sm flex items-center gap-3 rounded-xl border border-border bg-card/80 px-4 py-3 backdrop-blur-2xl">
      <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[hsl(var(--violet))]/14 text-[hsl(var(--violet))]">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-[15px] font-semibold">{value}</div>
      </div>
    </div>
  );
}

// ─────────────────────── Info / Copyable rows ───────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: import('lucide-react').LucideIcon;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className={`truncate text-[13px] text-foreground ${mono ? 'font-mono' : ''}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

function CopyableRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: import('lucide-react').LucideIcon;
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div className="group flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className={`truncate text-[13px] text-foreground ${mono ? 'font-mono' : ''}`}>
          {value ?? '—'}
        </div>
      </div>
      {value && <CopyButton value={value} label={`Copiar ${label.toLowerCase()}`} />}
    </div>
  );
}
