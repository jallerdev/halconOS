'use client';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { LEAD_STATUS, type LeadStatus } from '@halcon-os/shared/enums';
import { BusinessAvatar } from '~/components/business-avatar';
import { LEAD_STATUS_LABEL } from '~/components/lead-status-badge';
import { ScoreBadge } from '~/components/score-badge';
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
  const { data, isLoading } = trpc.leads.pipeline.useQuery({ perColumn: 25 });
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [peekId, setPeekId] = useState<string | null>(null);

  const updateStatus = trpc.leads.updateStatus.useMutation({
    onMutate: async ({ id, status }) => {
      await utils.leads.pipeline.cancel();
      const prev = utils.leads.pipeline.getData({ perColumn: 25 });
      utils.leads.pipeline.setData({ perColumn: 25 }, (old) => {
        if (!old) return old;
        type Item = (typeof old)[number]['items'][number];
        let moved: Item | undefined;
        const stripped = old.map((col) => {
          const found = col.items.find((i) => i.id === id);
          if (found) {
            moved = found;
            return { ...col, count: col.count - 1, items: col.items.filter((i) => i.id !== id) };
          }
          return col;
        });
        if (!moved) return old;
        const movedCard: Item = { ...moved, status };
        return stripped.map((col) =>
          col.status === status
            ? { ...col, count: col.count + 1, items: [movedCard, ...col.items] }
            : col,
        );
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.leads.pipeline.setData({ perColumn: 25 }, ctx.prev);
      toast.error('No se pudo mover el lead');
    },
    onSettled: () => {
      utils.leads.pipeline.invalidate();
      utils.leads.stats.invalidate();
      utils.leads.search.invalidate();
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

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

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {LEAD_STATUS.map((status) => {
          const col = data?.find((c) => c.status === status);
          return (
            <Column
              key={status}
              status={status}
              count={col?.count ?? 0}
              cards={(col?.items as Card[]) ?? []}
              onPeek={setPeekId}
            />
          );
        })}
      </div>
      <DragOverlay>{activeCard ? <LeadCard card={activeCard} dragging /> : null}</DragOverlay>
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
}: {
  status: LeadStatus;
  count: number;
  cards: Card[];
  onPeek: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${STATUS_HUE[status].dot}`} />
          <span className="text-sm font-medium">{LEAD_STATUS_LABEL[status]}</span>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          {count.toLocaleString('es-CO')}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[60vh] flex-1 flex-col gap-2 rounded-xl border border-border p-2 backdrop-blur-xl transition-colors ${
          isOver ? 'border-[hsl(var(--violet))]/50 bg-[hsl(var(--violet))]/5' : 'bg-card/55'
        }`}
      >
        {cards.map((card) => (
          <DraggableCard key={card.id} card={card} onPeek={onPeek} />
        ))}
        {cards.length === 0 && (
          <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
            Vacío
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

function DraggableCard({ card, onPeek }: { card: Card; onPeek: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => {
        // dnd-kit ya filtra clicks vs drags via activationConstraint.distance=6.
        // Si llegó aquí, fue un click real (no drag).
        if (!isDragging) onPeek(card.id);
      }}
      className={isDragging ? 'opacity-30' : ''}
    >
      <LeadCard card={card} />
    </div>
  );
}

function LeadCard({ card, dragging }: { card: Card; dragging?: boolean }) {
  return (
    <div
      className={`hx-lift-sm cursor-grab rounded-lg border border-border bg-card-2/85 p-3 shadow-card active:cursor-grabbing ${
        dragging ? 'rotate-2 shadow-pop' : 'hover:border-border-strong hover:bg-card-2'
      }`}
    >
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
            <Star className="size-3 fill-amber-400 text-amber-400" />
            {card.googleRating}
            <span className="opacity-70">({card.reviewCount?.toLocaleString('es-CO')})</span>
          </span>
        )}
      </div>
    </div>
  );
}
