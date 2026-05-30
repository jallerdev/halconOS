'use client';

import {
  Building2,
  ChevronRight,
  FileText,
  Globe,
  History,
  Loader2,
  Mail,
  MapPin,
  Paperclip,
  Phone,
  Sparkles,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { toast } from 'sonner';

import { BusinessAvatar } from '~/components/business-avatar';
import { ScoreBadge } from '~/components/score-badge';
import { StatusSelect } from '~/components/status-select';
import { WhatsAppButton } from '~/components/whatsapp-button';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { trpc } from '~/lib/trpc';
import { AiPanel } from './_components/AiPanel';
import { MeetingsPanel } from './_components/MeetingsPanel';
import { NotesPanel } from './_components/NotesPanel';
import { Timeline } from './_components/Timeline';

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
    return <div className="px-6 py-10 text-muted-foreground lg:px-10">Cargando…</div>;
  }
  if (!lead) {
    return <div className="px-6 py-10 text-muted-foreground lg:px-10">Lead no encontrado.</div>;
  }


  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/leads" className="transition-colors hover:text-foreground">
          Inicio
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href="/leads" className="transition-colors hover:text-foreground">
          Leads
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground">{lead.businessName}</span>
      </nav>

      {/* Header del perfil */}
      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <BusinessAvatar name={lead.businessName} size="md" className="size-14 rounded-xl text-base" />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{lead.businessName}</h1>
              <StatusSelect
                value={lead.status}
                onChange={(s) =>
                  updateStatus.mutate(
                    { id, status: s },
                    { onSuccess: () => toast.success('Estado actualizado') },
                  )
                }
              />
              <ScoreBadge score={lead.score} />
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
            variant="secondary"
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

      {/* Grid 2 columnas */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Columna izquierda: información */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={Phone} label="Teléfono" value={lead.phone ?? '—'} mono />
              <InfoRow icon={Phone} label="Tel. internacional" value={lead.phoneIntl ?? '—'} mono />
              <InfoRow icon={Mail} label="Email" value={lead.email ?? '—'} />
              <div className="flex flex-wrap gap-2 pt-1">
                <WhatsAppButton
                  leadId={lead.id}
                  phone={lead.phone}
                  phoneIntl={lead.phoneIntl}
                  aiFirstMessage={lead.aiFirstMessage}
                  businessName={lead.businessName}
                  variant="secondary"
                />
                {lead.websiteUrl && (
                  <Button size="sm" variant="secondary" asChild>
                    <a href={lead.websiteUrl} target="_blank" rel="noreferrer">
                      <Globe className="size-4" /> Web
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ubicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={MapPin} label="Dirección" value={lead.address ?? '—'} />
              <InfoRow icon={Building2} label="Ciudad" value={lead.city ?? '—'} />
              {/* Placeholder mapa */}
              <a
                href={lead.mapsUrl ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="group relative block h-32 overflow-hidden rounded-lg border border-border/60 bg-secondary/30"
              >
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 30% 40%, hsl(252 100% 68% / 0.3), transparent 50%), radial-gradient(circle at 70% 70%, hsl(200 100% 60% / 0.2), transparent 50%)',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                  <MapPin className="size-4" /> Ver en Google Maps
                </div>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Datos del negocio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={Star} label="Rating" value={lead.googleRating ? `${lead.googleRating} / 5` : '—'} mono />
              <InfoRow icon={FileText} label="Reseñas" value={lead.reviewCount?.toLocaleString('es-CO') ?? '—'} mono />
              <InfoRow icon={Globe} label="Tiene web" value={lead.hasWebsite ? 'Sí' : 'No'} />
              <InfoRow icon={Building2} label="Nivel de precio" value={lead.priceLevel ?? '—'} />
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: gestión y actividad */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-5">
              <Tabs defaultValue="notes">
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

                <TabsContent value="notes">
                  <NotesPanel leadId={lead.id} />
                </TabsContent>
                <TabsContent value="timeline">
                  <Timeline
                    createdAt={lead.createdAt}
                    updatedAt={lead.updatedAt}
                    convertedAt={lead.convertedAt}
                    scrapedAt={lead.scrapedAt}
                    status={lead.status}
                  />
                </TabsContent>
                <TabsContent value="files">
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 py-12 text-center">
                    <Paperclip className="size-5 text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium">Sin archivos</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Próximamente: adjunta propuestas y contratos.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Reuniones */}
          <div className="mt-6">
            <MeetingsPanel
              leadId={lead.id}
              businessName={lead.businessName}
              leadEmail={lead.email}
            />
          </div>

          {/* IA */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="size-4 text-primary" /> Estrategia de venta (IA)
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
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`truncate text-sm text-foreground ${mono ? 'font-mono' : ''}`}>{value}</div>
      </div>
    </div>
  );
}

