'use client';

import { Loader2, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, type ButtonProps } from '~/components/ui/button';
import { waLink } from '~/lib/leads-ui';
import { trpc } from '~/lib/trpc';

type Props = {
  leadId: string;
  phone: string | null;
  phoneIntl: string | null;
  aiFirstMessage: string | null;
  businessName: string;
  size?: ButtonProps['size'];
  label?: string;
};

export function WhatsAppButton({
  leadId,
  phone,
  phoneIntl,
  aiFirstMessage,
  businessName,
  size = 'sm',
  label = 'WhatsApp',
}: Props) {
  const utils = trpc.useUtils();
  const [busy, setBusy] = useState(false);

  const markContacted = trpc.leads.markContacted.useMutation({
    onSuccess: () => {
      utils.leads.search.invalidate();
      utils.leads.byId.invalidate({ id: leadId });
      utils.leads.stats.invalidate();
    },
  });
  const generate = trpc.leads.generateAi.useMutation();

  const base = waLink(phoneIntl, phone);
  if (!base) return null;
  const safeBase: string = base;

  async function onClick(e: React.MouseEvent) {
    e.stopPropagation();
    // Abrir ventana YA (gesto de usuario) para evitar bloqueo de popups.
    const win = window.open('', '_blank');

    try {
      let message = aiFirstMessage;
      if (!message) {
        setBusy(true);
        toast.loading('Generando mensaje con IA…', { id: 'wa-gen' });
        const updated = await generate.mutateAsync({ id: leadId, kind: 'message' });
        message = updated?.aiFirstMessage ?? null;
        toast.dismiss('wa-gen');
        utils.leads.byId.invalidate({ id: leadId });
      }

      const url = message ? `${safeBase}?text=${encodeURIComponent(message)}` : safeBase;
      if (win) win.location.href = url;
      else window.location.href = url;

      markContacted.mutate({ id: leadId });
      toast.success(`Abriendo WhatsApp · ${businessName} marcado como contactado`);
    } catch (err) {
      win?.close();
      toast.dismiss('wa-gen');
      toast.error(err instanceof Error ? err.message : 'No se pudo abrir WhatsApp');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size={size} variant="whatsapp" onClick={onClick} disabled={busy}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
      {label}
    </Button>
  );
}
