'use client';

import { useCallback, useEffect, useState } from 'react';

// Historial de búsquedas en localStorage. Per-browser (no sync entre dispositivos)
// — aceptable para v1; migrar a DB cuando haya demanda multi-device.

export type HistoryEntry = {
  id: string; // timestamp como id estable
  source: string;
  query: string;
  city?: string;
  country?: string;
  resultCount: number;
  ts: number; // ms epoch
};

const LS_KEY = 'halcon:discover:history';
const MAX_ENTRIES = 10;

function readStorage(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is HistoryEntry =>
        e && typeof e === 'object' && typeof e.id === 'string' && typeof e.query === 'string',
    );
  } catch {
    return [];
  }
}

function writeStorage(entries: HistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // localStorage puede fallar en modo private o si está lleno; falla silenciosa.
  }
}

// Hook simple: estado local sincronizado con localStorage. No usamos `storage`
// event porque dentro de la misma pestaña no se dispara; si abren dos pestañas
// el historial puede desincronizar momentáneamente, no es problema crítico.
export function useSearchHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  // Cargar al montar.
  useEffect(() => {
    setEntries(readStorage());
  }, []);

  const add = useCallback(
    (entry: Omit<HistoryEntry, 'id' | 'ts'>) => {
      setEntries((prev) => {
        // Dedup: si ya existe una entrada idéntica (source+query+city+country),
        // la removemos y agregamos la nueva al inicio (refresca timestamp).
        const dedupKey = `${entry.source}|${entry.query.toLowerCase()}|${(entry.city ?? '').toLowerCase()}|${entry.country ?? ''}`;
        const filtered = prev.filter((e) => {
          const k = `${e.source}|${e.query.toLowerCase()}|${(e.city ?? '').toLowerCase()}|${e.country ?? ''}`;
          return k !== dedupKey;
        });
        const now = Date.now();
        const next: HistoryEntry[] = [
          { ...entry, id: String(now), ts: now },
          ...filtered,
        ].slice(0, MAX_ENTRIES);
        writeStorage(next);
        return next;
      });
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      writeStorage(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
    writeStorage([]);
  }, []);

  return { entries, add, remove, clear };
}
