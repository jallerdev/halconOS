'use client';

import {
  Building2,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Star,
} from 'lucide-react';

import type { inferRouterOutputs } from '@trpc/server';

import { BusinessAvatar } from '~/components/business-avatar';
import { CopyButton } from '~/components/copy-button';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import type { AppRouter } from '~/server/routers/_app';

type PlaceResult = inferRouterOutputs<AppRouter>['discover']['searchPlaces']['results'][number];

type Props = {
  place: PlaceResult | null;
  open: boolean;
  alreadyImported: boolean;
  importing: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: () => void;
};

// Drawer lateral con TODO el detalle de un place. El usuario lo abre clicando
// el cuerpo de la card (no el checkbox). Permite importar UN lead atómicamente
// (sin confirmación porque ya hay preview que valida).
export function PlacePreview({
  place,
  open,
  alreadyImported,
  importing,
  onOpenChange,
  onImport,
}: Props) {
  if (!place) return null;

  const name = place.displayName ?? 'Sin nombre';
  const phone = place.nationalPhoneNumber ?? place.internationalPhoneNumber;
  const noWebsite = !place.websiteUri;
  const status = place.businessStatus;
  const types = place.types ?? [];
  const wa = phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <BusinessAvatar name={name} size="lg" />
            <div className="min-w-0 flex-1">
              <SheetTitle className="line-clamp-2 text-balance text-xl leading-tight">
                {name}
              </SheetTitle>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {alreadyImported && (
                  <Badge
                    variant="outline"
                    className="border-[hsl(var(--teal))]/40 bg-[hsl(var(--teal))]/12 text-[hsl(var(--teal))]"
                  >
                    Ya en tu CRM
                  </Badge>
                )}
                {noWebsite && !alreadyImported && (
                  <Badge
                    variant="outline"
                    className="border-[hsl(var(--violet))]/40 bg-[hsl(var(--violet))]/12 text-[hsl(var(--violet))]"
                  >
                    Sin web · oportunidad
                  </Badge>
                )}
                {status && status !== 'OPERATIONAL' && (
                  <Badge variant="outline" className="border-rose-500/40 bg-rose-500/12 text-rose-400">
                    {status.replace(/_/g, ' ').toLowerCase()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="space-y-5">
          {/* Stats row: rating + reviews */}
          {place.rating != null && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card-2/40 px-4 py-3">
              <Star className="size-5 fill-primary text-primary" />
              <div>
                <div className="font-mono text-lg font-bold tabular-nums">
                  {place.rating.toFixed(1)}
                </div>
                {place.userRatingCount != null && (
                  <div className="text-xs text-muted-foreground">
                    {place.userRatingCount.toLocaleString('es-CO')} reseñas
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Datos de contacto */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Contacto
            </h3>
            <div className="space-y-2 rounded-lg border border-border bg-card-2/40 p-3">
              {phone ? (
                <FieldRow
                  icon={Phone}
                  label="Teléfono"
                  value={phone}
                  copyValue={phone}
                  trailing={
                    wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noreferrer noopener"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-500 transition-colors hover:bg-emerald-500/25"
                      >
                        <MessageCircle className="size-3" /> WhatsApp
                      </a>
                    )
                  }
                />
              ) : (
                <FieldRow icon={Phone} label="Teléfono" value={null} />
              )}
              {place.websiteUri ? (
                <FieldRow
                  icon={Globe}
                  label="Web"
                  value={place.websiteUri}
                  trailing={
                    <a
                      href={place.websiteUri}
                      target="_blank"
                      rel="noreferrer noopener"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] text-[hsl(var(--violet))] hover:underline"
                    >
                      Abrir <ExternalLink className="size-3" />
                    </a>
                  }
                />
              ) : (
                <FieldRow icon={Globe} label="Web" value={null} />
              )}
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Ubicación
            </h3>
            <div className="space-y-2 rounded-lg border border-border bg-card-2/40 p-3">
              {place.formattedAddress ? (
                <FieldRow
                  icon={MapPin}
                  label="Dirección"
                  value={place.formattedAddress}
                  copyValue={place.formattedAddress}
                />
              ) : (
                <FieldRow icon={MapPin} label="Dirección" value={null} />
              )}
              {place.location && (
                <div className="hx-map-placeholder grid h-32 place-items-center text-xs text-muted-foreground">
                  {place.location.latitude.toFixed(4)}, {place.location.longitude.toFixed(4)}
                </div>
              )}
              {place.googleMapsUri && (
                <a
                  href={place.googleMapsUri}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[11px] text-[hsl(var(--violet))] hover:underline"
                >
                  Abrir en Google Maps <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>

          {/* Categorías */}
          {types.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Categoría
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {types.slice(0, 6).map((t) => (
                  <Badge key={t} variant="outline" className="text-[11px] font-normal">
                    <Building2 className="mr-1 size-3" />
                    {t.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </SheetBody>

        <SheetFooter>
          <Button
            type="button"
            className="w-full"
            disabled={alreadyImported || importing}
            onClick={onImport}
          >
            {importing ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Importando…
              </>
            ) : alreadyImported ? (
              'Ya está en tu CRM'
            ) : (
              'Importar este lead'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Una fila uniforme: icon + label + value + trailing (copy/link/etc).
function FieldRow({
  icon: Icon,
  label,
  value,
  copyValue,
  trailing,
}: {
  icon: typeof Phone;
  label: string;
  value: string | null;
  copyValue?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
          {label}
        </div>
        <div className="break-words text-sm">
          {value ? value : <span className="text-muted-foreground/60">No disponible</span>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {trailing}
        {copyValue && <CopyButton value={copyValue} />}
      </div>
    </div>
  );
}
