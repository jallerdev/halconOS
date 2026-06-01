'use client';

import {
  Building2,
  ChevronRight,
  DollarSign,
  FileText,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from '~/hooks/use-toast';

import { BusinessAvatar } from '~/components/business-avatar';
import { CopyButton } from '~/components/copy-button';
import { ScoreBadge } from '~/components/score-badge';
import { StatusSelect } from '~/components/status-select';
import { WhatsAppButton } from '~/components/whatsapp-button';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { trpc } from '~/lib/trpc';
import { AiPanel } from './_components/AiPanel';
import { MeetingsPanel } from './_components/MeetingsPanel';
import { NotesPanel } from './_components/NotesPanel';
import { Timeline } from './_components/Timeline';

// Lead Detail — layout de 2 columnas según el design handoff:
//   • Sidebar izquierdo (340px): Contacto / Ubicación / Datos del negocio
//   • Main: Signals (4-col) + Reuniones + Notas + Timeline + AI Panel
// SIN tabs — todas las secciones viven apiladas (decisión del usuario).
export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const utils = trpc.useUtils();
  const { data: lead, isLoading } = trpc.leads.byId.useQuery({ id });

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

  return (
    <div className="hx-page mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/leads" className="transition-colors hover:text-foreground">
          Leads
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground">{lead.businessName}</span>
      </nav>

      {/* Header del perfil — avatar 56x56 + nombre + meta + actions */}
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
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
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

      {/* Signals — 4 boxes con métricas clave del lead */}
      <Signals
        score={lead.score}
        rating={lead.googleRating}
        reviewCount={lead.reviewCount}
        hasWebsite={lead.hasWebsite ?? false}
      />

      {/* Grid 2 columnas — sidebar (Contacto/Ubicación/Datos) + main (paneles) */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-4">
          {/* Contacto */}
          <Card>
            <CardHeader>
              <CardTitle>Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CopyableRow icon={Phone} label="Teléfono" value={lead.phone} mono />
              <CopyableRow icon={Phone} label="Internacional" value={lead.phoneIntl} mono />
              <CopyableRow icon={Mail} label="Email" value={lead.email} />
              {lead.websiteUrl && (
                <div className="flex items-center gap-3 pt-1">
                  <Globe className="size-4 shrink-0 text-muted-foreground" />
                  <a
                    href={lead.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-[13px] text-[hsl(var(--violet))] hover:underline"
                  >
                    {lead.websiteUrl}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ubicación + mapa placeholder con grid + gradients radiales */}
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
            <CardContent className="grid grid-cols-2 gap-3">
              <DataCell label="Rating" value={lead.googleRating ?? '—'} mono />
              <DataCell
                label="Reseñas"
                value={lead.reviewCount?.toLocaleString('es-CO') ?? '—'}
                mono
              />
              <DataCell label="Tiene web" value={lead.hasWebsite ? 'Sí' : 'No'} />
              <DataCell label="Precio" value={lead.priceLevel ?? '—'} />
            </CardContent>
          </Card>
        </aside>

        {/* Main — 4 paneles apilados (cada uno se renderiza como Card autocontenida) */}
        <div className="space-y-4">
          <MeetingsPanel
            leadId={lead.id}
            businessName={lead.businessName}
            leadEmail={lead.email}
          />
          <NotesPanel leadId={lead.id} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="size-4 text-[hsl(var(--violet))]" /> Historial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline
                createdAt={lead.createdAt}
                updatedAt={lead.updatedAt}
                convertedAt={lead.convertedAt}
                scrapedAt={lead.scrapedAt}
                status={lead.status}
              />
            </CardContent>
          </Card>
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

// ─────────────────────── Signals ───────────────────────

function Signals({
  score,
  rating,
  reviewCount,
  hasWebsite,
}: {
  score: number | null;
  rating: string | null;
  reviewCount: number | null;
  hasWebsite: boolean;
}) {
  const items = [
    { label: 'Score', value: score?.toString() ?? '—', icon: TrendingUp },
    { label: 'Rating', value: rating ?? '—', icon: Star },
    { label: 'Reseñas', value: reviewCount?.toLocaleString('es-CO') ?? '—', icon: FileText },
    { label: 'Sitio web', value: hasWebsite ? 'Sí' : 'No', icon: Globe },
  ];
  return (
    <div className="hx-stagger mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="hx-lift-sm flex items-center gap-3 rounded-xl border border-border bg-card/72 px-4 py-3 backdrop-blur-xl"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[hsl(var(--teal))]/14 text-[hsl(var(--teal))]">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {label}
            </div>
            <div className="truncate font-mono text-base font-bold tabular-nums">{value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────── Copyable row ───────────────────────

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

// ─────────────────────── Data cell (grid 2x2) ───────────────────────

function DataCell({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-card-2/40 px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      <div className={`mt-0.5 text-[13px] text-foreground ${mono ? 'font-mono tabular-nums' : ''}`}>
        {value}
      </div>
    </div>
  );
}
