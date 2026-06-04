'use client';

import { Globe, MapPin, Phone, Star } from 'lucide-react';

import type { inferRouterOutputs } from '@trpc/server';

import { BusinessAvatar } from '~/components/business-avatar';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';
import { cn } from '~/lib/utils';
import type { AppRouter } from '~/server/routers/_app';

type PlaceResult = inferRouterOutputs<AppRouter>['discover']['searchPlaces']['results'][number];

type Props = {
  place: PlaceResult;
  selected: boolean;
  alreadyImported: boolean;
  onToggle: () => void;
};

// Card de un resultado de Google Places. Tres estados visuales:
//   - imported: ya está en el CRM → checkbox deshabilitado + badge.
//   - selected: seleccionado para bulk import → ring violet.
//   - default: clic en cualquier parte de la card alterna selección.
export function PlaceCard({ place, selected, alreadyImported, onToggle }: Props) {
  const name = place.displayName ?? 'Sin nombre';
  const rating = place.rating;
  const reviews = place.userRatingCount;
  const phone = place.nationalPhoneNumber ?? place.internationalPhoneNumber;
  const noWebsite = !place.websiteUri;

  const handleClick = () => {
    if (alreadyImported) return;
    onToggle();
  };

  return (
    <Card
      onClick={handleClick}
      className={cn(
        'hx-lift group relative h-full cursor-pointer overflow-hidden bg-gradient-to-br from-card/88 to-card/72 transition-all',
        selected && 'ring-2 ring-[hsl(var(--violet))]/60',
        alreadyImported && 'cursor-not-allowed opacity-70',
      )}
    >
      <CardContent className="space-y-3 px-[20px] pb-5 pt-5">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={selected}
            disabled={alreadyImported}
            onChange={onToggle}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 size-4 shrink-0 cursor-pointer accent-[hsl(var(--violet))] disabled:cursor-not-allowed"
            aria-label={`Seleccionar ${name}`}
          />
          <BusinessAvatar name={name} size="md" />
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-[-0.01em]">
              {name}
            </h3>
            {place.formattedAddress && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                <MapPin className="mr-1 inline size-3" />
                {place.formattedAddress}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 text-xs">
          {rating != null && (
            <span className="inline-flex items-center gap-1 font-mono tabular-nums">
              <Star className="size-3 fill-primary text-primary" />
              {rating.toFixed(1)}
              {reviews != null && (
                <span className="text-muted-foreground">({reviews.toLocaleString('es-CO')})</span>
              )}
            </span>
          )}
          {phone && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Phone className="size-3" />
              {phone}
            </span>
          )}
          {place.websiteUri && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Globe className="size-3" />
              Web
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
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
          {place.businessStatus && place.businessStatus !== 'OPERATIONAL' && (
            <Badge variant="outline" className="border-rose-500/40 bg-rose-500/12 text-rose-400">
              {place.businessStatus.replace(/_/g, ' ').toLowerCase()}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
