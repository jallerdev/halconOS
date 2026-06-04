'use client';

import { motion } from 'framer-motion';
import {
  ArrowUpDown,
  Download,
  Eye,
  Inbox,
  KanbanSquare,
  MoreVertical,
  Pencil,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { toast } from '~/hooks/use-toast';

import { LEAD_STATUS as LEAD_STATUS_LIST, type LeadStatus } from '@halcon-os/shared/enums';
import { BusinessAvatar } from '~/components/business-avatar';
import { ConfirmDialog } from '~/components/confirm-dialog';
import { LEAD_STATUS_LABEL } from '~/components/lead-status-badge';
import { LeadPeek } from './LeadPeek';
import { ScoreBadge } from '~/components/score-badge';
import { StatusSelect } from '~/components/status-select';
import { WhatsAppButton } from '~/components/whatsapp-button';
import { STATUS_HUE } from '~/lib/design-tokens';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Button, buttonVariants } from '~/components/ui/button';
import { Combobox } from '~/components/ui/combobox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { timeAgo } from '~/lib/utils';
import { trpc } from '~/lib/trpc';

const PAGE_SIZE = 50;
type Sort = 'recent' | 'rating' | 'reviews' | 'name' | 'score';

const VALID_SORTS = ['recent', 'rating', 'reviews', 'name', 'score'] as const;

function parseSort(v: string | null): Sort {
  return (VALID_SORTS as readonly string[]).includes(v ?? '') ? (v as Sort) : 'score';
}

export function LeadsTable() {
  const utils = trpc.useUtils();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filtros persistidos en la URL — sobreviven a navegar a /leads/[id] y
  // volver, refresh y bookmark. Reseteamos `cursor` cuando cambia cualquier
  // filtro (no quieres quedarte en página 4 después de cambiar de ciudad).
  const q = searchParams.get('q') ?? '';
  const city = searchParams.get('city') ?? undefined;
  const category = searchParams.get('category') ?? undefined;
  const sort = parseSort(searchParams.get('sort'));
  const cursor = Math.max(0, Number(searchParams.get('cursor') ?? 0) || 0);

  // Patcheamos un set de keys en la URL en una sola operación (un solo
  // router.replace). Pasar `null` borra la key del query string.
  const patchParams = useCallback(
    (patch: Record<string, string | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setQ = (v: string) => patchParams({ q: v, cursor: null });
  const setCity = (v: string | undefined) => patchParams({ city: v ?? null, cursor: null });
  const setCategory = (v: string | undefined) =>
    patchParams({ category: v ?? null, cursor: null });
  const setSort = (v: Sort) => patchParams({ sort: v === 'score' ? null : v, cursor: null });
  const setCursor = (v: number) => patchParams({ cursor: v > 0 ? String(v) : null });

  const [exporting, setExporting] = useState(false);
  const [peekId, setPeekId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const facets = trpc.leads.facets.useQuery();
  const filters = { q: q || undefined, city, category, sort, limit: PAGE_SIZE, cursor };
  const search = trpc.leads.search.useQuery(filters);

  const updateStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      utils.leads.search.invalidate();
      utils.leads.stats.invalidate();
    },
  });
  const promote = trpc.leads.promoteToPipeline.useMutation({
    onSuccess: () => {
      utils.leads.search.invalidate();
      utils.leads.pipeline.invalidate();
      toast.success('Añadido al pipeline');
    },
    onError: (e) => toast.error(e.message),
  });
  const removeFromPipeline = trpc.leads.removeFromPipeline.useMutation({
    onSuccess: () => {
      utils.leads.search.invalidate();
      utils.leads.pipeline.invalidate();
      toast.success('Sacado del pipeline');
    },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.leads.delete.useMutation({
    onSuccess: () => {
      utils.leads.search.invalidate();
      utils.leads.stats.invalidate();
    },
  });

  const invalidateAll = () => {
    utils.leads.search.invalidate();
    utils.leads.stats.invalidate();
    utils.leads.pipeline.invalidate();
  };
  const bulkStatus = trpc.leads.bulkUpdateStatus.useMutation({
    onSuccess: (r) => {
      invalidateAll();
      setSelected(new Set());
      toast.success(`${r.updated} leads actualizados`);
    },
  });
  const bulkDelete = trpc.leads.bulkDelete.useMutation({
    onSuccess: (r) => {
      invalidateAll();
      setSelected(new Set());
      toast.success(`${r.deleted} leads eliminados`);
    },
  });
  const bulkPromote = trpc.leads.bulkPromoteToPipeline.useMutation({
    onSuccess: (r) => {
      invalidateAll();
      setSelected(new Set());
      toast.success(`${r.updated} ${r.updated === 1 ? 'lead añadido' : 'leads añadidos'} al pipeline`);
    },
    onError: (e) => toast.error(e.message),
  });
  const bulkRemove = trpc.leads.bulkRemoveFromPipeline.useMutation({
    onSuccess: (r) => {
      invalidateAll();
      setSelected(new Set());
      toast.success(`${r.updated} ${r.updated === 1 ? 'lead sacado' : 'leads sacados'} del pipeline`);
    },
    onError: (e) => toast.error(e.message),
  });

  // Los setters de filtro ya resetean el cursor internamente (un solo
  // router.replace por interacción). Este wrapper queda como no-op por
  // compat con los handlers que ya lo usan.
  const resetAnd = (fn: () => void) => fn();

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const cityOptions = useMemo(
    () => (facets.data?.cities ?? []).map((c) => ({ value: c.value!, label: c.value!, hint: c.count })),
    [facets.data],
  );
  const categoryOptions = useMemo(
    () =>
      (facets.data?.categories ?? []).map((c) => ({ value: c.value!, label: c.value!, hint: c.count })),
    [facets.data],
  );

  const total = search.data?.total ?? 0;
  const items = search.data?.items ?? [];
  const pageStart = total === 0 ? 0 : cursor + 1;
  const pageEnd = Math.min(cursor + PAGE_SIZE, total);

  // Para los botones bulk "Añadir/Quitar del pipeline" necesitamos saber
  // qué leads seleccionados son NEW no-promovidos vs NEW promovidos. Solo
  // contamos lo visible (la página actual); leads en otras páginas que
  // estén seleccionados se procesan pero no contribuyen al label/count.
  const selectedLeads = items.filter((l) => selected.has(l.id));
  const promotableIds = selectedLeads
    .filter((l) => l.status === 'NEW' && l.pipelinePromotedAt == null)
    .map((l) => l.id);
  const demotableIds = selectedLeads
    .filter((l) => l.status === 'NEW' && l.pipelinePromotedAt != null)
    .map((l) => l.id);

  const allOnPageSelected = items.length > 0 && items.every((l) => selected.has(l.id));
  const toggleAllOnPage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) items.forEach((l) => next.delete(l.id));
      else items.forEach((l) => next.add(l.id));
      return next;
    });

  const toggleSort = (next: Sort) => resetAnd(() => setSort(next));

  async function exportCsv() {
    setExporting(true);
    try {
      const rows: typeof items = [];
      let c = 0;
      // Pagina hasta traer todo lo que matchea el filtro actual (máx ~3000).
      for (let i = 0; i < 60; i++) {
        const page = await utils.leads.search.fetch({ ...filters, limit: 100, cursor: c });
        rows.push(...page.items);
        if (page.nextCursor == null) break;
        c = page.nextCursor;
      }
      const headers = ['Negocio', 'Sector', 'Ciudad', 'Rating', 'Reseñas', 'Teléfono', 'Estado', 'Dirección'];
      const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csv = [
        headers.join(','),
        ...rows.map((r) =>
          [r.businessName, r.category, r.city, r.googleRating, r.reviewCount, r.phone, r.status, r.address]
            .map(escape)
            .join(','),
        ),
      ].join('\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => resetAnd(() => setQ(e.target.value))}
            placeholder="Buscar negocio, ciudad, teléfono…"
            className="pl-9"
          />
        </div>
        <Combobox
          value={city}
          onChange={(v) => resetAnd(() => setCity(v))}
          options={cityOptions}
          placeholder="Ciudad"
          searchPlaceholder="Buscar ciudad…"
        />
        <Combobox
          value={category}
          onChange={(v) => resetAnd(() => setCategory(v))}
          options={categoryOptions}
          placeholder="Sector"
          searchPlaceholder="Buscar sector…"
        />
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting}>
          <Download className="size-4" />
          {exporting ? 'Exportando…' : 'Exportar CSV'}
        </Button>
      </div>

      {/* Barra de acciones en lote */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[hsl(var(--violet))]/30 bg-[hsl(var(--violet))]/6 px-3 py-2">
          <span className="text-sm font-medium">{selected.size} seleccionados</span>
          <div className="mx-1 h-4 w-px bg-border" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                Cambiar estado
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {LEAD_STATUS_LIST.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => bulkStatus.mutate({ ids: [...selected], status: s })}
                >
                  {LEAD_STATUS_LABEL[s]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {promotableIds.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              disabled={bulkPromote.isPending}
              onClick={() => bulkPromote.mutate({ ids: promotableIds })}
            >
              <KanbanSquare className="size-4" />
              Añadir al pipeline ({promotableIds.length})
            </Button>
          )}
          {demotableIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              disabled={bulkRemove.isPending}
              onClick={() => bulkRemove.mutate({ ids: demotableIds })}
            >
              <Inbox className="size-4" />
              Sacar del pipeline ({demotableIds.length})
            </Button>
          )}
          <ConfirmDialog
            title={`¿Eliminar ${selected.size} ${selected.size === 1 ? 'lead' : 'leads'}?`}
            description="Esta acción no se puede deshacer. Los leads seleccionados se borrarán permanentemente."
            confirmLabel="Eliminar"
            destructive
            onConfirm={() => bulkDelete.mutate({ ids: [...selected] })}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-4" /> Eliminar
              </Button>
            }
          />
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Limpiar
          </Button>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-border bg-card/80 shadow-card backdrop-blur-2xl">
        <div className="max-h-[calc(100vh-22rem)] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAllOnPage}
                    className="size-4 cursor-pointer accent-[hsl(var(--primary))]"
                  />
                </TableHead>
                <SortableHead label="Score" active={sort === 'score'} onClick={() => toggleSort('score')} />
                <TableHead className="w-[26%]">Negocio</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Ciudad</TableHead>
                <SortableHead label="Rating" active={sort === 'rating'} onClick={() => toggleSort('rating')} />
                <SortableHead label="Reseñas" active={sort === 'reviews'} onClick={() => toggleSort('reviews')} />
                <TableHead>Estado</TableHead>
                <TableHead>Actividad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {search.isLoading ? (
                <SkeletonRows />
              ) : items.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={10} className="py-16 text-center text-sm text-muted-foreground">
                    Sin resultados con esos filtros.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((l, i) => (
                  <motion.tr
                    key={l.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.01, 0.2) }}
                    onClick={() => setPeekId(l.id)}
                    className={`group hx-table-row cursor-pointer border-b border-l-2 border-border/40 hover:bg-accent/50 ${selected.has(l.id) ? 'bg-[hsl(var(--violet))]/7' : ''}`}
                    style={{ borderLeftColor: STATUS_HUE[l.status].hsl }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(l.id)}
                        onChange={() => toggleOne(l.id)}
                        className="size-4 cursor-pointer accent-[hsl(var(--primary))]"
                      />
                    </TableCell>
                    <TableCell>
                      <ScoreBadge score={l.score} />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <BusinessAvatar name={l.businessName} size="sm" />
                        <span className="truncate group-hover:text-primary">{l.businessName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{l.category ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{l.city ?? '—'}</TableCell>
                    <TableCell>
                      {l.googleRating ? (
                        <span className="inline-flex items-center gap-1 font-mono text-sm">
                          <Star className="size-3 fill-primary text-primary" />
                          {l.googleRating}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {l.reviewCount?.toLocaleString('es-CO') ?? '—'}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <StatusSelect
                        value={l.status}
                        onChange={(s) =>
                          updateStatus.mutate(
                            { id: l.id, status: s },
                            { onSuccess: () => toast.success('Estado actualizado') },
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {timeAgo(l.updatedAt)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <WhatsAppButton
                          leadId={l.id}
                          phone={l.phone}
                          phoneIntl={l.phoneIntl}
                          aiFirstMessage={l.aiFirstMessage}
                          businessName={l.businessName}
                          size="icon"
                          label=""
                        />
                        <RowActions
                          id={l.id}
                          status={l.status}
                          inPipeline={l.pipelinePromotedAt != null}
                          onAddToPipeline={() => promote.mutate({ id: l.id })}
                          onRemoveFromPipeline={() => removeFromPipeline.mutate({ id: l.id })}
                          onDelete={() => setPendingDelete({ id: l.id, name: l.businessName })}
                        />
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {pageStart.toLocaleString('es-CO')}–{pageEnd.toLocaleString('es-CO')} de{' '}
          {total.toLocaleString('es-CO')}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={cursor === 0}
            onClick={() => setCursor(Math.max(0, cursor - PAGE_SIZE))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={search.data?.nextCursor == null}
            onClick={() => search.data?.nextCursor != null && setCursor(search.data.nextCursor)}
          >
            Siguiente
          </Button>
        </div>
      </div>

      <LeadPeek leadId={peekId} open={!!peekId} onOpenChange={(v) => !v && setPeekId(null)} />

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar &ldquo;{pendingDelete?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El lead se borrará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={() => {
                if (pendingDelete) {
                  del.mutate(
                    { id: pendingDelete.id },
                    { onSuccess: () => toast.success('Lead eliminado') },
                  );
                }
                setPendingDelete(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortableHead({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <TableHead>
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
          active ? 'text-foreground' : ''
        }`}
      >
        {label}
        <ArrowUpDown className="size-3" />
      </button>
    </TableHead>
  );
}

function RowActions({
  id,
  status,
  inPipeline,
  onAddToPipeline,
  onRemoveFromPipeline,
  onDelete,
}: {
  id: string;
  status: LeadStatus;
  inPipeline: boolean;
  onAddToPipeline: () => void;
  onRemoveFromPipeline: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/leads/${id}`}>
            <Eye /> Ver detalles
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/leads/${id}`}>
            <Pencil /> Editar
          </Link>
        </DropdownMenuItem>
        {status === 'NEW' && (
          <>
            <DropdownMenuSeparator />
            {inPipeline ? (
              <DropdownMenuItem onClick={onRemoveFromPipeline}>
                <Inbox /> Sacar del pipeline
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onAddToPipeline}>
                <KanbanSquare /> Añadir al pipeline
              </DropdownMenuItem>
            )}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onClick={onDelete}>
          <Trash2 /> Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell>
            <Skeleton className="size-4 rounded" />
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-5 w-12 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell className="text-right"><Skeleton className="ml-auto h-7 w-7 rounded" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}
