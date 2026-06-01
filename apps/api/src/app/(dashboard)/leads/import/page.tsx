'use client';

import { ArrowLeft, FileSpreadsheet, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

import { Step1Upload } from './_components/Step1Upload';
import { Step2Map } from './_components/Step2Map';
import { Step3Confirm } from './_components/Step3Confirm';
import { autoMap, TARGET_FIELDS, type TargetField } from './_components/types';

type Mapping = Record<TargetField, number | null>;
type ParsedFile = {
  fileName: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
};

const EMPTY_MAPPING: Mapping = TARGET_FIELDS.reduce(
  (acc, { value }) => ({ ...acc, [value]: null }),
  {} as Mapping,
);

const STEPS = [
  { id: 'upload', label: 'Archivo' },
  { id: 'map', label: 'Mapear columnas' },
  { id: 'confirm', label: 'Confirmar' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

export default function ImportLeadsPage() {
  const [step, setStep] = useState<StepId>('upload');
  const [file, setFile] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<Mapping>(EMPTY_MAPPING);
  const [validatedAtMap, setValidatedAtMap] = useState<
    | {
        validRows: { rowIndex: number; data: Record<string, unknown> }[];
        errors: { rowIndex: number; message: string }[];
      }
    | null
  >(null);

  const reset = () => {
    setStep('upload');
    setFile(null);
    setMapping(EMPTY_MAPPING);
    setValidatedAtMap(null);
  };

  const currentIndex = useMemo(() => STEPS.findIndex((s) => s.id === step), [step]);

  return (
    <div className="hx-page mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/leads" className="hover:text-foreground">
              <ArrowLeft className="inline size-3" /> Volver a Leads
            </Link>
          </div>
          <span className="hx-eyebrow mt-3 block">Asistente · 3 pasos</span>
          <h1 className="flex items-center gap-2 text-[28px] font-bold leading-tight tracking-[-0.025em]">
            <FileSpreadsheet className="size-6 text-[hsl(var(--violet))]" /> Importar leads
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sube un CSV o Excel con tu lista. Detectamos las columnas automáticamente.
          </p>
        </div>
      </div>

      {/* Stepper Atrevida — num pill + label + gradient separator entre activos */}
      <ol className="flex items-center gap-3 text-[12.5px]">
        {STEPS.map((s, i) => (
          <li key={s.id} className="flex items-center gap-3">
            <span
              className={cn(
                'grid size-7 place-items-center rounded-full border font-bold tabular-nums transition-colors',
                i < currentIndex &&
                  'border-[hsl(var(--teal))]/40 bg-[hsl(var(--teal))]/15 text-[hsl(var(--teal))]',
                i === currentIndex &&
                  'border-[hsl(var(--violet))] bg-[hsl(var(--violet))] text-white shadow-[0_2px_8px_hsl(var(--violet)/0.4)]',
                i > currentIndex && 'border-border-strong text-muted-foreground',
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                'font-medium',
                i === currentIndex ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  'h-px w-10',
                  i < currentIndex
                    ? 'bg-gradient-to-r from-[hsl(var(--violet))] to-[hsl(var(--teal))]'
                    : 'bg-border-strong',
                )}
              />
            )}
          </li>
        ))}
      </ol>

      {step === 'upload' && (
        <Step1Upload
          onParsed={(parsed) => {
            setFile(parsed);
            setMapping(autoMap(parsed.headers));
            setStep('map');
          }}
        />
      )}

      {step === 'map' && file && (
        <Step2Map
          headers={file.headers}
          rows={file.rows}
          mapping={mapping}
          onMappingChange={setMapping}
          onBack={() => setStep('upload')}
          onNext={(validated) => {
            const validRows = validated
              .filter((v): v is Extract<typeof v, { ok: true }> => v.ok)
              .map((v) => ({ rowIndex: v.rowIndex, data: v.data as Record<string, unknown> }));
            const errors = validated
              .filter((v): v is Extract<typeof v, { ok: false }> => !v.ok)
              .map((v) => ({ rowIndex: v.rowIndex, message: v.message }));
            setValidatedAtMap({ validRows, errors });
            setStep('confirm');
          }}
        />
      )}

      {step === 'confirm' && validatedAtMap && (
        <>
          <div className="flex items-center gap-2 rounded-md border border-border bg-card/72 px-3 py-2 text-xs backdrop-blur-xl">
            <Sparkles className="size-3.5 text-[hsl(var(--violet))]" />
            <span className="text-muted-foreground">
              Archivo: <strong className="text-foreground">{file?.fileName}</strong> ·{' '}
              {file?.rows.length} filas totales
            </span>
          </div>
          <Step3Confirm
            validRows={validatedAtMap.validRows}
            prevalidationErrors={validatedAtMap.errors}
            onBack={() => setStep('map')}
            onReset={reset}
          />
        </>
      )}

      {step === 'upload' && (
        <div className="rounded-md border border-border bg-card-2/40 p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">¿Qué columnas reconocemos?</p>
          <p className="mt-1">
            Negocio, contacto, teléfono, email, origen, valor estimado, estado y etiquetas. El
            nombre del negocio es lo único obligatorio. Las filas con email o teléfono duplicado
            con leads existentes se omiten silenciosamente.
          </p>
        </div>
      )}
    </div>
  );
}
