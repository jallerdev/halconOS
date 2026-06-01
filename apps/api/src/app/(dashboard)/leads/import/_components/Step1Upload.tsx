'use client';

import { FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

type ParsedFile = {
  fileName: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
};

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 5000;

export function Step1Upload({ onParsed }: { onParsed: (parsed: ParsedFile) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      toast.error('El archivo supera 5 MB.');
      return;
    }
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.csv') && !lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
      toast.error('Solo se admiten archivos .csv, .xlsx o .xls.');
      return;
    }

    setLoading(true);
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
      const sheetName = wb.SheetNames[0];
      const sheet = sheetName ? wb.Sheets[sheetName] : undefined;
      if (!sheet) {
        toast.error('La hoja está vacía.');
        return;
      }
      const matrix = XLSX.utils.sheet_to_json<(string | number | null | undefined)[]>(sheet, {
        header: 1,
        blankrows: false,
        defval: '',
      });
      if (!matrix.length) {
        toast.error('No se encontraron filas.');
        return;
      }
      const [headerRow, ...dataRows] = matrix;
      const headers = (headerRow ?? []).map((h) => String(h ?? '').trim());
      if (!headers.length) {
        toast.error('Falta la fila de encabezados.');
        return;
      }
      if (dataRows.length > MAX_ROWS) {
        toast.error(`Máximo ${MAX_ROWS.toLocaleString('es-CO')} filas por archivo.`);
        return;
      }
      onParsed({ fileName: file.name, headers, rows: dataRows });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo leer el archivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) void handleFile(file);
      }}
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-card-2/40 px-8 py-16 text-center transition-colors',
        dragging
          ? 'border-[hsl(var(--violet))]/55 bg-[hsl(var(--violet))]/7'
          : 'border-border-strong',
      )}
    >
      <div
        className="grid size-14 place-items-center rounded-[13px] text-[hsl(var(--violet))]"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--violet) / 0.18), hsl(var(--teal) / 0.18))',
        }}
      >
        {loading ? (
          <Loader2 className="size-6 animate-spin" />
        ) : (
          <FileSpreadsheet className="size-6" />
        )}
      </div>
      <div>
        <p className="text-[15px] font-semibold">Arrastra tu CSV o XLSX</p>
        <p className="mt-1 text-xs text-muted-foreground">
          O usa el botón para elegirlo · máx 5 MB y {MAX_ROWS.toLocaleString('es-CO')} filas
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
      <Button onClick={() => inputRef.current?.click()} disabled={loading}>
        <Upload /> Elegir archivo
      </Button>
    </div>
  );
}
