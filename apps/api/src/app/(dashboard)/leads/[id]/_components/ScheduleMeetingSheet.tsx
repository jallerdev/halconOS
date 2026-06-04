'use client';

import { CalendarPlus, Check, Copy, ExternalLink, Loader2, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from '~/hooks/use-toast';

import { Button } from '~/components/ui/button';
import { Combobox } from '~/components/ui/combobox';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '~/components/ui/sheet';
import { Textarea } from '~/components/ui/textarea';
import { trpc } from '~/lib/trpc';

const DURATION_OPTIONS = [
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1h 30 min' },
];

function defaultStart(): string {
  // Próxima hora redonda + 1h (ej. ahora 14:23 → 16:00). En formato datetime-local del navegador.
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  if (d.getTime() - Date.now() < 30 * 60 * 1000) {
    d.setHours(d.getHours() + 1);
  }
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

export function ScheduleMeetingSheet({
  open,
  onOpenChange,
  leadId,
  businessName,
  leadEmail,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: string;
  businessName: string;
  leadEmail?: string | null;
}) {
  const utils = trpc.useUtils();
  const googleStatus = trpc.google.status.useQuery(undefined, { enabled: open });

  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [duration, setDuration] = useState('30');
  const [attendeesText, setAttendeesText] = useState('');
  const [description, setDescription] = useState('');
  const [createdMeetUrl, setCreatedMeetUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(`Reunión con ${businessName}`);
      setStartsAt(defaultStart());
      setDuration('30');
      setAttendeesText(leadEmail ?? '');
      setDescription('');
      setCreatedMeetUrl(null);
      setCopied(false);
    }
  }, [open, businessName, leadEmail]);

  const schedule = trpc.meetings.schedule.useMutation();

  const tz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'America/Bogota';
    }
  }, []);

  const submit = async () => {
    if (!startsAt) {
      toast.error('Selecciona una fecha y hora.');
      return;
    }
    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime())) {
      toast.error('Fecha inválida.');
      return;
    }
    const end = new Date(start.getTime() + Number(duration) * 60_000);
    const attendees = attendeesText
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const result = await schedule.mutateAsync({
        leadId,
        title: title.trim() || `Reunión con ${businessName}`,
        description: description.trim() || null,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        attendees,
        timeZone: tz,
      });
      setCreatedMeetUrl(result.meetUrl ?? null);
      toast.success('Reunión agendada');
      await Promise.all([
        utils.meetings.listByLead.invalidate({ leadId }),
        utils.meetings.upcoming.invalidate(),
      ]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo agendar la reunión');
    }
  };

  const copy = async () => {
    if (!createdMeetUrl) return;
    await navigator.clipboard.writeText(createdMeetUrl);
    setCopied(true);
    toast.success('Link copiado');
  };

  const close = () => onOpenChange(false);

  const connected = googleStatus.data?.connected === true;
  const configured = googleStatus.data?.configured !== false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <header className="border-b border-border px-[22px] pb-[18px] pt-5">
          <SheetTitle className="flex items-center gap-2">
            <Video className="size-5 text-primary" /> Agendar reunión
          </SheetTitle>
          <SheetDescription>{businessName}</SheetDescription>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-[22px] py-5">
          {googleStatus.isLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="animate-spin" />
            </div>
          ) : !configured ? (
            <div className="rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm">
              Integración con Google no configurada en el servidor.
            </div>
          ) : !connected ? (
            <div className="space-y-3 rounded-lg border border-border bg-card/60 p-4 text-sm">
              <p>Para agendar reuniones necesitas conectar tu Google.</p>
              <Button asChild className="w-full">
                <a href="/api/google/auth/start">
                  <Video /> Conectar Google
                </a>
              </Button>
            </div>
          ) : createdMeetUrl ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-teal-500/40 bg-teal-500/10 p-4">
                <p className="text-sm font-medium text-teal-200">¡Reunión creada!</p>
                <p className="mt-1 text-xs text-teal-200/70">
                  Los invitados recibieron un email con el evento.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 overflow-x-auto rounded border border-border bg-background px-3 py-2 font-mono text-xs">
                    {createdMeetUrl}
                  </code>
                  <Button variant="outline" size="icon" onClick={copy} title="Copiar">
                    {copied ? <Check className="text-teal-400" /> : <Copy />}
                  </Button>
                  <Button variant="outline" size="icon" asChild title="Abrir">
                    <a href={createdMeetUrl} target="_blank" rel="noreferrer">
                      <ExternalLink />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="sm-title">Título</Label>
                <Input
                  id="sm-title"
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sm-start">Inicio</Label>
                  <Input
                    id="sm-start"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Duración</Label>
                  <Combobox
                    value={duration}
                    onChange={(v) => setDuration(v ?? '30')}
                    options={DURATION_OPTIONS}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sm-attendees">Invitados (emails)</Label>
                <Input
                  id="sm-attendees"
                  value={attendeesText}
                  onChange={(e) => setAttendeesText(e.target.value)}
                  placeholder="contacto@negocio.com, otro@correo.com"
                />
                <p className="text-xs text-muted-foreground">
                  Recibirán un email de Google Calendar con el link Meet.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sm-description">Notas (opcional)</Label>
                <Textarea
                  id="sm-description"
                  rows={3}
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Agenda, contexto, links útiles…"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Zona horaria: <span className="font-mono">{tz}</span>
              </p>
            </>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border px-[22px] py-4">
          <Button variant="ghost" onClick={close} disabled={schedule.isPending}>
            {createdMeetUrl ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!createdMeetUrl && connected && configured && (
            <Button onClick={submit} disabled={schedule.isPending}>
              {schedule.isPending ? <Loader2 className="animate-spin" /> : <CalendarPlus />}
              Agendar
            </Button>
          )}
        </footer>
      </SheetContent>
    </Sheet>
  );
}
