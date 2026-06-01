'use client';

import { useToasts } from '~/hooks/use-toast';
import { Toast } from '~/components/toast';

// Toaster — provider de toasts montado una sola vez (en `lib/trpc.tsx`).
// Posicionado top-right (debajo del TopBar de 56px + 10px de margen).
// Z-index alto para flotar sobre todos los sheets/drawers.
export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-[18px] top-[66px] z-[200] flex w-[360px] max-w-[calc(100vw-36px)] flex-col gap-2"
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={() => dismiss(t.id)} />
      ))}
    </div>
  );
}
