'use client';

import { FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { timeAgo } from '~/lib/utils';
import { trpc } from '~/lib/trpc';

// NotesPanel — Card autocontenida (con su propio CardHeader). El composer
// es un textarea sobre card-2/50 + Botón "Agregar nota". La lista usa
// items con bg card-2/40 + border, hover sutil, delete fade-in.
export function NotesPanel({ leadId }: { leadId: string }) {
  const utils = trpc.useUtils();
  const ref = { parentType: 'lead' as const, parentId: leadId };
  const { data, isLoading } = trpc.notes.listByParent.useQuery(ref);
  const [draft, setDraft] = useState('');

  const create = trpc.notes.create.useMutation({
    onSuccess: () => {
      utils.notes.listByParent.invalidate(ref);
      setDraft('');
    },
  });
  const del = trpc.notes.delete.useMutation({
    onSuccess: () => utils.notes.listByParent.invalidate(ref),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-4 text-[hsl(var(--violet))]" /> Notas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-border bg-card-2/50 p-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Agregar una nota rápida…"
            rows={3}
            className="w-full resize-none bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={!draft.trim() || create.isPending}
              onClick={() => create.mutate({ ...ref, body: draft.trim() })}
            >
              {create.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Agregar nota
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : data && data.length > 0 ? (
          <div className="hx-stagger space-y-2">
            {data.map((n) => (
              <div
                key={n.id}
                className="group rounded-md border border-border bg-card-2/40 p-3"
              >
                <p className="whitespace-pre-wrap text-[13.5px] text-foreground">{n.body}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  <button
                    onClick={() => del.mutate({ id: n.id })}
                    className="text-muted-foreground opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">Sin notas todavía.</p>
        )}
      </CardContent>
    </Card>
  );
}
