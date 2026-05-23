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

import { LEAD_STATUS, type LeadStatus } from '@agency-os/shared/enums';
import { BusinessAvatar } from '~/components/business-avatar';
import { LEAD_STATUS_LABEL } from '~/components/lead-status-badge';
import { ScoreBadge } from '~/components/score-badge';
import { trpc } from '~/lib/trpc';

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

const COLUMN_ACCENT: Record<LeadStatus, string> = {
  NEW: 'bg-sky-500',
  CONTACTED: 'bg-blue-500',
  QUALIFIED: 'bg-violet-500',
  PROPOSAL_SENT: 'bg-indigo-500',
  NEGOTIATION: 'bg-amber-500',
  WON: 'bg-emerald-500',
  LOST: 'bg-rose-500',
};

export function KanbanBoard() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.leads.pipeline.useQuery({ perColumn: 25 });
  const [activeCard, setActiveCard] = useState<Card | null>(null);

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
            />
          );
        })}
      </div>
      <DragOverlay>{activeCard ? <LeadCard card={activeCard} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}

function Column({ status, count, cards }: { status: LeadStatus; count: number; cards: Card[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${COLUMN_ACCENT[status]}`} />
          <span className="text-sm font-medium">{LEAD_STATUS_LABEL[status]}</span>
        </div>
        <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-xs text-muted-foreground">
          {count.toLocaleString('es-CO')}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[60vh] flex-1 flex-col gap-2 rounded-xl border border-border/50 p-2 transition-colors ${
          isOver ? 'border-primary/50 bg-primary/5' : 'bg-card/30'
        }`}
      >
        {cards.map((card) => (
          <DraggableCard key={card.id} card={card} />
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

function DraggableCard({ card }: { card: Card }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={isDragging ? 'opacity-30' : ''}
    >
      <LeadCard card={card} />
    </div>
  );
}

function LeadCard({ card, dragging }: { card: Card; dragging?: boolean }) {
  return (
    <div
      className={`cursor-grab rounded-lg border border-border/60 bg-card p-3 shadow-sm active:cursor-grabbing ${
        dragging ? 'rotate-2 shadow-xl shadow-black/40' : 'hover:border-border'
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
