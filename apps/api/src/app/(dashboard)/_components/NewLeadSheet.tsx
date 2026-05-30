'use client';

import { Loader2, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { LEAD_SOURCE, LEAD_STATUS } from '@halcon-os/shared/enums';

import { Button } from '~/components/ui/button';
import { Combobox } from '~/components/ui/combobox';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '~/components/ui/sheet';
import { Textarea } from '~/components/ui/textarea';
import { trpc } from '~/lib/trpc';

const NEW_LEAD_EVENT = 'halcon:new-lead';

export function openNewLeadSheet() {
  document.dispatchEvent(new CustomEvent(NEW_LEAD_EVENT));
}

const SOURCE_LABELS: Record<string, string> = {
  referral: 'Referido',
  instagram: 'Instagram',
  google: 'Google',
  google_maps: 'Google Maps',
  walk_in: 'Walk-in',
  website: 'Website',
  other: 'Otro',
};

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Calificado',
  PROPOSAL_SENT: 'Propuesta enviada',
  NEGOTIATION: 'Negociación',
  WON: 'Ganado',
  LOST: 'Perdido',
};

const SOURCE_OPTIONS = LEAD_SOURCE.map((v) => ({ value: v, label: SOURCE_LABELS[v] ?? v }));
const STATUS_OPTIONS = LEAD_STATUS.map((v) => ({ value: v, label: STATUS_LABELS[v] ?? v }));

type FormState = {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  source: string | undefined;
  status: string;
  estimatedValue: string;
  nextFollowUpAt: string;
  tags: string[];
  notes: string;
};

const EMPTY: FormState = {
  businessName: '',
  contactName: '',
  phone: '',
  email: '',
  source: undefined,
  status: 'NEW',
  estimatedValue: '',
  nextFollowUpAt: '',
  tags: [],
  notes: '',
};

export function NewLeadSheet() {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [tagDraft, setTagDraft] = useState('');

  useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener(NEW_LEAD_EVENT, handler);
    return () => document.removeEventListener(NEW_LEAD_EVENT, handler);
  }, []);

  const createLead = trpc.leads.create.useMutation();
  const createNote = trpc.notes.create.useMutation();

  const reset = () => {
    setForm(EMPTY);
    setTagDraft('');
  };

  const close = () => {
    setOpen(false);
    setTimeout(reset, 200);
  };

  const submit = async () => {
    const businessName = form.businessName.trim();
    if (!businessName) return;
    try {
      const created = await createLead.mutateAsync({
        businessName,
        contactName: form.contactName.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        source: (form.source as (typeof LEAD_SOURCE)[number] | undefined) ?? null,
        status: form.status as (typeof LEAD_STATUS)[number],
        estimatedValue: form.estimatedValue.trim() || null,
        tags: form.tags.length ? form.tags : undefined,
        nextFollowUpAt: form.nextFollowUpAt
          ? new Date(form.nextFollowUpAt).toISOString()
          : null,
      });

      if (form.notes.trim()) {
        await createNote.mutateAsync({
          parentType: 'lead',
          parentId: created.id,
          body: form.notes.trim(),
        });
      }

      toast.success('Lead creado');
      await Promise.all([
        utils.leads.pipeline.invalidate(),
        utils.leads.search.invalidate(),
        utils.leads.stats.invalidate(),
        utils.leads.facets.invalidate(),
        utils.leads.followUps.invalidate(),
      ]);
      close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo crear el lead');
    }
  };

  const addTag = () => {
    const v = tagDraft.trim();
    if (!v) return;
    if (!form.tags.includes(v)) setForm({ ...form, tags: [...form.tags, v] });
    setTagDraft('');
  };

  const removeTag = (t: string) => setForm({ ...form, tags: form.tags.filter((x) => x !== t) });

  const isPending = createLead.isPending || createNote.isPending;
  const canSubmit = form.businessName.trim().length > 0 && !isPending;

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <header className="border-b border-border/60 px-6 py-5">
          <SheetTitle>Nuevo lead</SheetTitle>
          <SheetDescription>
            Crea un lead a mano. Solo el nombre del negocio es obligatorio.
          </SheetDescription>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="nl-business">Negocio *</Label>
            <Input
              id="nl-business"
              autoFocus
              maxLength={200}
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              placeholder="Café Central"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nl-contact">Contacto</Label>
              <Input
                id="nl-contact"
                maxLength={120}
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                placeholder="María García"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nl-phone">Teléfono</Label>
              <Input
                id="nl-phone"
                maxLength={32}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+57 300 000 0000"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nl-email">Email</Label>
            <Input
              id="nl-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contacto@negocio.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Origen</Label>
              <Combobox
                value={form.source}
                onChange={(v) => setForm({ ...form, source: v })}
                options={SOURCE_OPTIONS}
                placeholder="Sin definir"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Combobox
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v ?? 'NEW' })}
                options={STATUS_OPTIONS}
                placeholder="Nuevo"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nl-value">Valor estimado</Label>
              <Input
                id="nl-value"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={form.estimatedValue}
                onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nl-followup">Próximo seguimiento</Label>
              <Input
                id="nl-followup"
                type="datetime-local"
                value={form.nextFollowUpAt}
                onChange={(e) => setForm({ ...form, nextFollowUpAt: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nl-tags">Etiquetas</Label>
            <Input
              id="nl-tags"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag();
                } else if (e.key === 'Backspace' && !tagDraft && form.tags.length) {
                  setForm({ ...form, tags: form.tags.slice(0, -1) });
                }
              }}
              onBlur={addTag}
              maxLength={40}
              placeholder="Enter o coma para añadir"
            />
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 px-2 py-0.5 text-xs"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Quitar ${t}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nl-notes">Nota inicial</Label>
            <Textarea
              id="nl-notes"
              rows={3}
              maxLength={2000}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Contexto del primer contacto, fuente del referido, etc."
            />
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border/60 px-6 py-4">
          <Button variant="ghost" onClick={close} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
            Crear lead
          </Button>
        </footer>
      </SheetContent>
    </Sheet>
  );
}
