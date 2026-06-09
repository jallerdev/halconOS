'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { ArrowRight, Inbox, Star, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from '~/hooks/use-toast';
import { usePermissions } from '~/hooks/use-permissions';
import { useScrollRestore } from '~/hooks/use-scroll-restore';

import { LEAD_STATUS, type LeadStatus } from '@halcon-os/shared/enums';
import { BusinessAvatar } from '~/components/business-avatar';
import { LEAD_STATUS_LABEL } from '~/components/lead-status-badge';
import { ScoreBadge } from '~/components/score-badge';
import { Combobox } from '~/components/ui/combobox';
import { STATUS_HUE } from '~/lib/design-tokens';
import { trpc } from '~/lib/trpc';

import { LeadPeek } from '../../leads/_components/LeadPeek';

type Card = {
  id: string;
  businessName: string;
  category: string | null;
  city: string | null;
  googleRating: string | null;
  reviewCount: number | null;
  score: number;
  status: LeadStatus;
};


export function KanbanBoard() {
  const utils = trpc.useUtils();
  const { can } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filtro admin-only: ver el pipeline de un vendedor específico.
  // Persiste en URL para que /pipeline?assignedTo=X sea bookmarkable y se
  // pueda compartir con el resto del equipo.
  const canFilter = can('leads.assign');
  const assignedTo = searchParams.get('assignedTo') ?? undefined;

  const members = trpc.members.list.useQuery(undefined, { enabled: canFilter });
  const memberOptions = useMemo(
    () =>
      (members.data ?? []).map((m) => ({
        value: m.id,
        label: m.name ?? m.email ?? 'Sin nombre',
        hint: m.orgRole === 'org:admin' ? 'admin' : undefined,
      })),
    [members.data],
  );

  // Input compartido para el query + setData/getData de las mutaciones
  // optimistas — si no se mantienen idénticos, el cache no acierta y
  // los updates optimistas se pierden visualmente.
  const pipelineInput = useMemo(
    () => ({ perColumn: 25, assignedToId: assignedTo }),
    [assignedTo],
  );

  const setAssignedTo = useCallback(
    (v: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (v) params.set('assignedTo', v);
      else params.delete('assignedTo');
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const { data, isLoading } = trpc.leads.pipeline.useQuery(pipelineInput);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [peekId, setPeekId] = useState<string | null>(null);

  // Mantener scroll al volver desde /leads/[id] o cambiar de tab y regresar.
  useScrollRestore('pipeline', !!data);

  const removeFromPipeline = trpc.leads.removeFromPipeline.useMutation({
    onSuccess: () => {
      utils.leads.pipeline.invalidate();
      utils.leads.search.invalidate();
      toast.success('Sacado del pipeline');
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.leads.updateStatus.useMutation({
    onMutate: async ({ id, status }) => {
      await utils.leads.pipeline.cancel();
      const prev = utils.leads.pipeline.getData(pipelineInput);
      utils.leads.pipeline.setData(pipelineInput, (old) => {
        if (!old) return old;
        type Item = (typeof old)['columns'][number]['items'][number];
        let moved: Item | undefined;
        const stripped = old.columns.map((col) => {
          const found = col.items.find((i) => i.id === id);
          if (found) {
            moved = found;
            return { ...col, count: col.count - 1, items: col.items.filter((i) => i.id !== id) };
          }
          return col;
        });
        if (!moved) return old;
        const movedCard: Item = { ...moved, status };
        const columns = stripped.map((col) =>
          col.status === status
            ? { ...col, count: col.count + 1, items: [movedCard, ...col.items] }
            : col,
        );
        return { ...old, columns };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.leads.pipeline.setData(pipelineInput, ctx.prev);
      toast.error('No se pudo mover el lead');
    },
    onSettled: () => {
      utils.leads.pipeline.invalidate();
      utils.leads.stats.invalidate();
      utils.leads.search.invalidate();
    },
  });

  // Sensors:
  //   • PointerSensor con `distance: 8` — el drag se activa solo después
  //     de mover 8px (los micro-movimientos del click no disparan drag).
  //   • TouchSensor con `delay: 200` — en móvil hace falta long-press
  //     para diferenciar drag de scroll.
  //   • KeyboardSensor — accesibilidad (mover con flechas + espacio).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  function onDragStart(e: DragStartEvent) {
    setActiveCard((e.active.data.current?.card as Card) ?? null);
  }
  function onDragEnd(e: DragEndEvent) {
    setActiveCard(null);
    const overId = e.over?.id as LeadStatus | undefined;
    const card = e.active.data.current?.card as Card | undefined;
    if (!overId || !card || card.status === overId) return;
    updateStatus.mutate(
      { id: card.id, status: overId },
      { onSuccess: () => toast.success(`${card.businessName} → ${LEAD_STATUS_LABEL[overId]}`) },
    );
  }

  if (isLoading) {
    return <div className="p-10 text-sm text-muted-foreground">Cargando pipeline…</div>;
  }

  // El kanban incluye TODOS los status. La columna NEW solo muestra leads
  // que el usuario "promovió" manualmente desde /leads (inbox). Los leads
  // NEW sin promover viven solo en /leads hasta que el usuario los mete
  // al tablero con la acción "Añadir al pipeline".
  const inboxCount = data?.inboxCount ?? 0;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      modifiers={[restrictToWindowEdges]}
      onDragStart={onDragStart}
      onDragCancel={() => setActiveCard(null)}
      onDragEnd={onDragEnd}
    >
      {/* Toolbar admin-only: filtrar el pipeline por vendedor. */}
      {canFilter && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Combobox
            value={assignedTo}
            onChange={setAssignedTo}
            options={memberOptions}
            placeholder="Asignado a"
            searchPlaceholder="Buscar miembro…"
          />
          {assignedTo && (
            <span className="text-xs text-muted-foreground">
              Viendo solo los leads de este vendedor
            </span>
          )}
        </div>
      )}
      {inboxCount > 0 && <NewInboxHint count={inboxCount} />}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {LEAD_STATUS.map((status) => {
          const col = data?.columns.find((c) => c.status === status);
          return (
            <Column
              key={status}
              status={status}
              count={col?.count ?? 0}
              cards={(col?.items as Card[]) ?? []}
              onPeek={setPeekId}
              onRemoveFromPipeline={(id) => removeFromPipeline.mutate({ id })}
            />
          );
        })}
      </div>
      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {activeCard ? <LeadCard card={activeCard} dragging /> : null}
      </DragOverlay>
      <LeadPeek
        leadId={peekId}
        open={!!peekId}
        onOpenChange={(v) => !v && setPeekId(null)}
      />
    </DndContext>
  );
}

function Column({
  status,
  count,
  cards,
  onPeek,
  onRemoveFromPipeline,
}: {
  status: LeadStatus;
  count: number;
  cards: Card[];
  onPeek: (id: string) => void;
  onRemoveFromPipeline: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  // En el contexto del kanban, "NEW" se llama "Por contactar" (queue
  // curado por el usuario). En el resto del producto sigue siendo "Nuevo".
  const label = status === 'NEW' ? 'Por contactar' : LEAD_STATUS_LABEL[status];
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${STATUS_HUE[status].dot}`} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          {count.toLocaleString('es-CO')}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[60vh] flex-1 flex-col gap-2 rounded-xl border-2 p-2 transition-colors ${
          isOver
            ? 'border-[hsl(var(--violet))]/60 bg-[hsl(var(--violet))]/8'
            : 'border-dashed border-border bg-card-2/30'
        }`}
      >
        {cards.map((card) => (
          <DraggableCard
            key={card.id}
            card={card}
            onPeek={onPeek}
            onRemoveFromPipeline={status === 'NEW' ? onRemoveFromPipeline : undefined}
          />
        ))}
        {cards.length === 0 && (
          <div
            className={`flex flex-1 items-center justify-center rounded-md p-4 text-center text-xs transition-colors ${
              isOver ? 'text-[hsl(var(--violet))]' : 'text-muted-foreground'
            }`}
          >
            {isOver ? 'Suelta aquí' : 'Vacío'}
          </div>
        )}
        {count > cards.length && (
          <div className="px-1 py-2 text-center text-xs text-muted-foreground">
            +{(count - cards.length).toLocaleString('es-CO')} más
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({
  card,
  onPeek,
  onRemoveFromPipeline,
}: {
  card: Card;
  onPeek: (id: string) => void;
  onRemoveFromPipeline?: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  });
  // Sutil pero útil: cuando estás arrastrando, ocultamos casi por completo
  // la card original (la copia "real" la pinta DragOverlay).
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => {
        // PointerSensor con `distance: 8` ya filtra los clicks pequeños.
        // Llegar acá significa que el usuario hizo click real, no drag.
        if (!isDragging) onPeek(card.id);
      }}
      className={`relative ${isDragging ? 'opacity-20' : ''}`}
    >
      <LeadCard card={card} onRemoveFromPipeline={onRemoveFromPipeline} />
    </div>
  );
}

// Banner que aparece cuando hay leads NEW en el inbox. Los leads NEW no
// entran al kanban por sí solos — el usuario decide cuáles promueve desde
// /leads (acción "Añadir al pipeline" → status NEW → CONTACTED).
function NewInboxHint({ count }: { count: number }) {
  return (
    <Link
      href="/leads"
      className="hx-press mb-4 flex items-center gap-3 rounded-xl border border-[hsl(var(--violet))]/30 bg-[hsl(var(--violet))]/8 p-4 transition-colors hover:border-[hsl(var(--violet))]/55 hover:bg-[hsl(var(--violet))]/12"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[hsl(var(--violet))]/16 text-[hsl(var(--violet))]">
        <Inbox className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          Tienes {count.toLocaleString('es-CO')} {count === 1 ? 'lead nuevo' : 'leads nuevos'} en el inbox
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Revísalos en la lista y añade al pipeline los que decidas trabajar.
        </p>
      </div>
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[hsl(var(--violet))]">
        Ir al inbox <ArrowRight className="size-3.5" />
      </span>
    </Link>
  );
}

function LeadCard({
  card,
  dragging,
  onRemoveFromPipeline,
}: {
  card: Card;
  dragging?: boolean;
  onRemoveFromPipeline?: (id: string) => void;
}) {
  return (
    <div
      className={`hx-lift-sm group/card relative cursor-grab rounded-lg border border-border bg-card-2/85 p-3 shadow-card active:cursor-grabbing ${
        dragging ? 'rotate-2 shadow-pop' : 'hover:border-border-strong hover:bg-card-2'
      }`}
    >
      {onRemoveFromPipeline && !dragging && (
        // X aparece sólo en hover sobre cards de la columna "Por contactar".
        // stopPropagation para que no abra el peek ni inicie drag.
        <button
          type="button"
          aria-label="Sacar del pipeline"
          title="Sacar del pipeline"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromPipeline(card.id);
          }}
          className="absolute right-1.5 top-1.5 z-10 grid size-6 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-rose-500/15 hover:text-rose-400 group-hover/card:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      )}
      <div className="flex items-start gap-2">
        <BusinessAvatar name={card.businessName} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{card.businessName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[card.category, card.city].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <ScoreBadge score={card.score} />
        {card.googleRating && (
          <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <Star className="size-3 fill-primary text-primary" />
            {card.googleRating}
            <span className="opacity-70">({card.reviewCount?.toLocaleString('es-CO')})</span>
          </span>
        )}
      </div>
    </div>
  );
}
