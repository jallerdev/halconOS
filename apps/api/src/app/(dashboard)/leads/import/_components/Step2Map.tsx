'use client';

import { ArrowRight, ChevronLeft } from 'lucide-react';
import { useMemo } from 'react';

import { bulkImportRowSchema } from '@halcon-os/shared/schemas';

import { Button } from '~/components/ui/button';
import { Combobox } from '~/components/ui/combobox';
import { cn } from '~/lib/utils';

import { TARGET_FIELDS, type TargetField, projectRow } from './types';

type Mapping = Record<TargetField, number | null>;

type ValidatedRow =
  | { ok: true; rowIndex: number; data: ReturnType<typeof bulkImportRowSchema.parse> }
  | { ok: false; rowIndex: number; message: string };

function validateRows(
  rows: (string | number | null | undefined)[][],
  mapping: Mapping,
): ValidatedRow[] {
  return rows.map((row, i) => {
    const projected = projectRow(row, mapping);
    const result = bulkImportRowSchema.safeParse(projected);
    if (result.success) return { ok: true, rowIndex: i, data: result.data };
    return {
      ok: false,
      rowIndex: i,
      message: result.error.issues
        .map((iss) => `${iss.path.join('.') || 'fila'}: ${iss.message}`)
        .join('; '),
    };
  });
}

export function Step2Map({
  headers,
  rows,
  mapping,
  onMappingChange,
  onBack,
  onNext,
}: {
  headers: string[];
  rows: (string | number | null | undefined)[][];
  mapping: Mapping;
  onMappingChange: (m: Mapping) => void;
  onBack: () => void;
  onNext: (validated: ValidatedRow[]) => void;
}) {
  const validated = useMemo(() => validateRows(rows, mapping), [rows, mapping]);
  const errorCount = validated.filter((v) => !v.ok).length;
  const validCount = validated.length - errorCount;
  const canContinue = mapping.businessName != null && validCount > 0;

  const columnOptions = headers.map((h, i) => ({
    value: String(i),
    label: h || `Columna ${i + 1}`,
  }));
  const noneOption = [{ value: '_none', label: '— Ignorar —' }];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border/60 bg-card/30 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Asigna columnas</h3>
            <p className="text-xs text-muted-foreground">
              El nombre del negocio es obligatorio. El resto es opcional.
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-medium text-emerald-300">{validCount} válidas</p>
            {errorCount > 0 && <p className="text-rose-300">{errorCount} con error</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TARGET_FIELDS.map(({ value, label, required }) => (
            <div key={value} className="flex items-center justify-between gap-3">
              <div className="text-sm">
                <p>{label}</p>
                {required && <p className="text-[10px] uppercase tracking-wide text-amber-400">Requerido</p>}
              </div>
              <Combobox
                value={mapping[value] == null ? '_none' : String(mapping[value])}
                onChange={(v) => {
                  onMappingChange({
                    ...mapping,
                    [value]: v == null || v === '_none' ? null : Number(v),
                  });
                }}
                options={[...noneOption, ...columnOptions]}
                className="min-w-44"
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium">Vista previa · primeras 5 filas</h3>
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-xs">
            <thead className="bg-secondary/40">
              <tr>
                <th className="px-3 py-2 text-left font-medium">#</th>
                {TARGET_FIELDS.map(({ value, label }) => (
                  <th key={value} className="px-3 py-2 text-left font-medium">
                    {label}
                  </th>
                ))}
                <th className="px-3 py-2 text-left font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {validated.slice(0, 5).map((v) => {
                const data = v.ok ? v.data : projectRow(rows[v.rowIndex] ?? [], mapping);
                return (
                  <tr
                    key={v.rowIndex}
                    className={cn('border-t border-border/40', !v.ok && 'bg-rose-500/10')}
                  >
                    <td className="px-3 py-2 text-muted-foreground">{v.rowIndex + 2}</td>
                    {TARGET_FIELDS.map(({ value }) => (
                      <td key={value} className="max-w-44 truncate px-3 py-2">
                        {formatPreview(data[value])}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      {v.ok ? (
                        <span className="text-emerald-300">OK</span>
                      ) : (
                        <span className="text-rose-300" title={v.message}>
                          {v.message.slice(0, 40)}
                          {v.message.length > 40 ? '…' : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft /> Volver
        </Button>
        <Button onClick={() => onNext(validated)} disabled={!canContinue}>
          Continuar <ArrowRight />
        </Button>
      </footer>
    </div>
  );
}

function formatPreview(v: unknown): string {
  if (v == null) return '—';
  if (Array.isArray(v)) return v.join(', ') || '—';
  const s = String(v);
  return s.length === 0 ? '—' : s.length > 60 ? s.slice(0, 60) + '…' : s;
}
