'use client';

import { Loader2, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from '~/hooks/use-toast';

import { LEAD_SOURCE, LEAD_STATUS } from '@halcon-os/shared/enums';

import { Button } from '~/components/ui/button';
import { Combobox } from '~/components/ui/combobox';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '~/components/ui/sheet';
import { trpc } from '~/lib/trpc';

const EDIT_LEAD_EVENT = 'halcon:edit-lead';

// Datos mínimos para precargar el formulario de edición.
export type EditableLead = {
  id: string;
  businessName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  status: string;
  estimatedValue: string | null;
  nextFollowUpAt: string | Date | null;
  tags: string[];
};

export function openEditLeadSheet(lead: EditableLead) {
  document.dispatchEvent(new CustomEvent<EditableLead>(EDIT_LEAD_EVENT, { detail: lead }));
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
};

// Date → valor de <input type="datetime-local"> (hora local).
function toLocalInput(d: string | Date | null): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLead(lead: EditableLead): FormState {
  return {
    businessName: lead.businessName ?? '',
    contactName: lead.contactName ?? '',
    phone: lead.phone ?? '',
    email: lead.email ?? '',
    source: lead.source ?? undefined,
    status: lead.status ?? 'NEW',
    estimatedValue: lead.estimatedValue != null ? String(lead.estimatedValue) : '',
    nextFollowUpAt: toLocalInput(lead.nextFollowUpAt),
    tags: lead.tags ?? [],
  };
}

export function EditLeadSheet() {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [tagDraft, setTagDraft] = useState('');

  useEffect(() => {
    const handler = (e: Event) => {
      const lead = (e as CustomEvent<EditableLead>).detail;
      if (!lead) return;
      setLeadId(lead.id);
      setForm(fromLead(lead));
      setTagDraft('');
      setOpen(true);
    };
    document.addEventListener(EDIT_LEAD_EVENT, handler);
    return () => document.removeEventListener(EDIT_LEAD_EVENT, handler);
  }, []);

  const updateLead = trpc.leads.update.useMutation();

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setLeadId(null);
      setForm(null);
      setTagDraft('');
    }, 200);
  };

  const submit = async () => {
    if (!leadId || !form) return;
    const businessName = form.businessName.trim();
    if (!businessName) return;
    try {
      await updateLead.mutateAsync({
        id: leadId,
        businessName,
        contactName: form.contactName.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        source: (form.source as (typeof LEAD_SOURCE)[number] | undefined) ?? null,
        status: form.status as (typeof LEAD_STATUS)[number],
        estimatedValue: form.estimatedValue.trim() || null,
        tags: form.tags,
        nextFollowUpAt: form.nextFollowUpAt
          ? new Date(form.nextFollowUpAt).toISOString()
          : null,
      });

      toast.success('Lead actualizado');
      await Promise.all([
        utils.leads.byId.invalidate({ id: leadId }),
        utils.leads.search.invalidate(),
        utils.leads.stats.invalidate(),
        utils.leads.pipeline.invalidate(),
        utils.leads.facets.invalidate(),
        utils.leads.followUps.invalidate(),
      ]);
      close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo actualizar el lead');
    }
  };

  const addTag = () => {
    if (!form) return;
    const v = tagDraft.trim();
    if (!v) return;
    if (!form.tags.includes(v)) setForm({ ...form, tags: [...form.tags, v] });
    setTagDraft('');
  };

  const removeTag = (t: string) =>
    setForm((f) => (f ? { ...f, tags: f.tags.filter((x) => x !== t) } : f));

  const isPending = updateLead.isPending;
  const canSubmit = !!form && form.businessName.trim().length > 0 && !isPending;

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
      <SheetContent className="flex flex-col gap-0 p-0">
        <header className="border-b border-border px-[22px] pb-[18px] pt-5">
          <SheetTitle>Editar lead</SheetTitle>
          <SheetDescription>Actualiza los datos del lead. Solo el nombre es obligatorio.</SheetDescription>
        </header>

        {form && (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-[22px] py-5">
              <div className="space-y-1.5">
                <Label htmlFor="el-business">
                  Negocio <span className="text-[hsl(var(--violet))]">*</span>
                </Label>
                <Input
                  id="el-business"
                  autoFocus
                  maxLength={200}
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  placeholder="Café Central"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="el-contact">Contacto</Label>
                  <Input
                    id="el-contact"
                    maxLength={120}
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    placeholder="María García"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="el-phone">Teléfono</Label>
                  <Input
                    id="el-phone"
                    maxLength={32}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+57 300 000 0000"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="el-email">Email</Label>
                <Input
                  id="el-email"
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
                  <Label htmlFor="el-value">Valor estimado</Label>
                  <Input
                    id="el-value"
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
                  <Label htmlFor="el-followup">Próximo seguimiento</Label>
                  <Input
                    id="el-followup"
                    type="datetime-local"
                    value={form.nextFollowUpAt}
                    onChange={(e) => setForm({ ...form, nextFollowUpAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="el-tags">Etiquetas</Label>
                <Input
                  id="el-tags"
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
                      <span key={t} className="hx-tag-chip">
                        {t}
                        <button type="button" onClick={() => removeTag(t)} aria-label={`Quitar ${t}`}>
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-border px-[22px] py-4">
              <Button variant="ghost" onClick={close} disabled={isPending}>
                Cancelar
              </Button>
              <Button onClick={submit} disabled={!canSubmit}>
                {isPending ? <Loader2 className="animate-spin" /> : <Save />}
                Guardar cambios
              </Button>
            </footer>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
