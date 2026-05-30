'use client';

import { CheckCircle2, ChevronLeft, Loader2, RotateCcw, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '~/components/ui/button';
import { trpc } from '~/lib/trpc';

const CHUNK_SIZE = 200;

type ValidRow = { rowIndex: number; data: Record<string, unknown> };
type FileError = { rowIndex: number; message: string };

type Summary = {
  created: number;
  skippedDuplicates: number;
  errors: FileError[];
};

export function Step3Confirm({
  validRows,
  prevalidationErrors,
  onBack,
  onReset,
}: {
  validRows: ValidRow[];
  prevalidationErrors: FileError[];
  onBack: () => void;
  onReset: () => void;
}) {
  const utils = trpc.useUtils();
  const bulk = trpc.leads.bulkImport.useMutation();
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  const run = async () => {
    if (!validRows.length) {
      toast.error('No hay filas válidas para importar.');
      return;
    }
    setRunning(true);
    setSummary(null);
    setProgress(0);

    const totals: Summary = {
      created: 0,
      skippedDuplicates: 0,
      errors: [...prevalidationErrors],
    };

    for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
      const chunk = validRows.slice(i, i + CHUNK_SIZE);
      try {
        const result = await bulk.mutateAsync({ rows: chunk.map((r) => r.data) });
        totals.created += result.created;
        totals.skippedDuplicates += result.skippedDuplicates;
        for (const err of result.errors) {
          const original = chunk[err.rowIndex];
          totals.errors.push({
            rowIndex: original?.rowIndex ?? i + err.rowIndex,
            message: err.message,
          });
        }
      } catch (e) {
        totals.errors.push({
          rowIndex: i,
          message: `Lote ${Math.floor(i / CHUNK_SIZE) + 1}: ${
            e instanceof Error ? e.message : 'error desconocido'
          }`,
        });
      }
      setProgress(Math.min(i + CHUNK_SIZE, validRows.length));
    }

    setRunning(false);
    setSummary(totals);
    if (totals.created > 0) {
      toast.success(`${totals.created} lead${totals.created === 1 ? '' : 's'} creados`);
      void utils.leads.pipeline.invalidate();
      void utils.leads.search.invalidate();
      void utils.leads.stats.invalidate();
      void utils.leads.facets.invalidate();
      void utils.leads.followUps.invalidate();
    }
  };

  if (summary) {
    return (
      <div className="space-y-5 rounded-xl border border-border/60 bg-card/30 p-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-7 text-emerald-300" />
          <div>
            <h3 className="text-lg font-semibold">Importación terminada</h3>
            <p className="text-sm text-muted-foreground">
              {summary.created} creados · {summary.skippedDuplicates} duplicados omitidos ·{' '}
              {summary.errors.length} con error
            </p>
          </div>
        </div>

        {summary.errors.length > 0 && (
          <details className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4 text-sm">
            <summary className="cursor-pointer font-medium text-rose-200">
              Ver errores ({summary.errors.length})
            </summary>
            <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto text-xs text-rose-100">
              {summary.errors.slice(0, 200).map((e) => (
                <li key={`${e.rowIndex}-${e.message}`}>
                  <span className="font-mono">Fila {e.rowIndex + 2}:</span> {e.message}
                </li>
              ))}
              {summary.errors.length > 200 && (
                <li className="text-rose-300/70">… y {summary.errors.length - 200} más.</li>
              )}
            </ul>
          </details>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onReset}>
            <RotateCcw /> Importar otro archivo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-xl border border-border/60 bg-card/30 p-6">
      <div>
        <h3 className="text-sm font-medium">Listo para importar</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {validRows.length} filas válidas se enviarán en lotes de {CHUNK_SIZE}.{' '}
          {prevalidationErrors.length > 0 && (
            <span className="text-rose-300">
              {prevalidationErrors.length} filas con error no se enviarán.
            </span>
          )}
        </p>
      </div>

      {running && (
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary/40">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(progress / validRows.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {progress} / {validRows.length}
          </p>
        </div>
      )}

      <footer className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} disabled={running}>
          <ChevronLeft /> Volver
        </Button>
        <Button onClick={run} disabled={running || !validRows.length}>
          {running ? <Loader2 className="animate-spin" /> : <UploadCloud />}
          Importar {validRows.length} leads
        </Button>
      </footer>
    </div>
  );
}
