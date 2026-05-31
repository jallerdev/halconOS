'use client';

import { Check, Copy, Eye, EyeOff, Loader2, Plus, Trash2, Video } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { ConfirmDialog } from '~/components/confirm-dialog';
import { Input } from '~/components/ui/input';
import { PageHeader } from '~/components/page-header';
import { trpc } from '~/lib/trpc';

function fmtDate(d: Date | string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type KeyListItem = {
  id: string;
  name: string;
  keyPrefix: string;
  revealable: boolean;
  lastUsedAt: Date | string | null;
  revokedAt: Date | string | null;
  createdAt: Date | string;
};

function KeyRow({
  k,
  disableRevoke,
  onRevoke,
}: {
  k: KeyListItem;
  disableRevoke: boolean;
  onRevoke: (id: string) => void;
}) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const reveal = trpc.inboundKeys.reveal.useMutation({
    onSuccess: (data) => {
      setRevealed(data.secret);
      setCopied(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const copy = async () => {
    if (!revealed) return;
    await navigator.clipboard.writeText(revealed);
    setCopied(true);
    toast.success('Copiada al portapapeles');
  };

  const toggle = () => {
    if (revealed) {
      setRevealed(null);
      setCopied(false);
    } else {
      reveal.mutate({ id: k.id });
    }
  };

  return (
    <li className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{k.name}</span>
          {k.revokedAt && (
            <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-medium text-rose-300">
              Revocada
            </span>
          )}
        </div>
        {revealed ? (
          <code className="mt-1 block max-w-full overflow-x-auto rounded border border-border/60 bg-background px-2 py-1 font-mono text-xs">
            {revealed}
          </code>
        ) : (
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {k.keyPrefix}… · último uso {fmtDate(k.lastUsedAt)}
          </p>
        )}
      </div>
      {!k.revokedAt && k.revealable && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            disabled={reveal.isPending}
            onClick={toggle}
            title={revealed ? 'Ocultar' : 'Ver key completa'}
          >
            {reveal.isPending ? (
              <Loader2 className="animate-spin" />
            ) : revealed ? (
              <EyeOff />
            ) : (
              <Eye />
            )}
          </Button>
          {revealed && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={copy}
              title="Copiar"
            >
              {copied ? <Check className="text-emerald-400" /> : <Copy />}
            </Button>
          )}
        </>
      )}
      {!k.revokedAt && (
        <ConfirmDialog
          title={`¿Revocar la key "${k.name}"?`}
          description="La key dejará de funcionar para todas las landings que la usen. Esta acción no se puede deshacer."
          confirmLabel="Revocar"
          destructive
          disabled={disableRevoke}
          onConfirm={() => onRevoke(k.id)}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-rose-400"
              disabled={disableRevoke}
              title="Revocar"
            >
              <Trash2 />
            </Button>
          }
        />
      )}
    </li>
  );
}

export default function SettingsPage() {
  const utils = trpc.useUtils();
  const list = trpc.inboundKeys.list.useQuery(undefined, { retry: false });
  const googleStatus = trpc.google.status.useQuery(undefined, { retry: false });
  const searchParams = useSearchParams();

  const [name, setName] = useState('');
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const g = searchParams.get('google');
    if (g === 'connected') {
      toast.success('Google conectado correctamente.');
      void utils.google.status.invalidate();
    } else if (g === 'error') {
      const reason = searchParams.get('reason') ?? 'desconocido';
      toast.error(`No se pudo conectar Google: ${reason}`);
    }
  }, [searchParams, utils.google.status]);

  const disconnectGoogle = trpc.google.disconnect.useMutation({
    onSuccess: () => {
      toast.success('Google desconectado');
      void utils.google.status.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const create = trpc.inboundKeys.create.useMutation({
    onSuccess: (data) => {
      setNewSecret(data.secret);
      setCopied(false);
      setName('');
      void utils.inboundKeys.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const revoke = trpc.inboundKeys.revoke.useMutation({
    onSuccess: () => {
      toast.success('Key revocada');
      void utils.inboundKeys.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const isForbidden = list.error?.data?.code === 'FORBIDDEN';

  const copySecret = async () => {
    if (!newSecret) return;
    await navigator.clipboard.writeText(newSecret);
    setCopied(true);
    toast.success('Copiada al portapapeles');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <PageHeader
        title="Ajustes"
        description="Integraciones, keys de leads entrantes y configuración de tu cuenta."
      />

      {isForbidden ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Solo un administrador de la organización puede gestionar las keys.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Generar key</CardTitle>
              <CardDescription>
                Ponle un nombre para identificarla (ej. &ldquo;Landing principal&rdquo;).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre de la key"
                  maxLength={80}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && name.trim()) create.mutate({ name: name.trim() });
                  }}
                />
                <Button
                  onClick={() => create.mutate({ name: name.trim() })}
                  disabled={!name.trim() || create.isPending}
                >
                  {create.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Plus />
                  )}
                  Generar
                </Button>
              </div>

              {newSecret && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
                  <p className="text-sm font-medium text-amber-200">
                    Guárdala ahora — no se vuelve a mostrar.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 overflow-x-auto rounded border border-border/60 bg-background px-3 py-2 font-mono text-xs">
                      {newSecret}
                    </code>
                    <Button variant="outline" size="icon" onClick={copySecret} title="Copiar">
                      {copied ? <Check className="text-emerald-400" /> : <Copy />}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card id="google">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="size-4 text-primary" /> Conexión con Google
              </CardTitle>
              <CardDescription>
                Necesaria para crear videollamadas de Meet desde un lead. La conexión es por
                usuario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {googleStatus.isLoading ? (
                <div className="flex justify-center py-4 text-muted-foreground">
                  <Loader2 className="animate-spin" />
                </div>
              ) : !googleStatus.data?.configured ? (
                <p className="text-sm text-muted-foreground">
                  La integración con Google no está configurada en el servidor. Falta definir{' '}
                  <code className="font-mono text-xs">GOOGLE_CLIENT_ID</code>,{' '}
                  <code className="font-mono text-xs">GOOGLE_CLIENT_SECRET</code>,{' '}
                  <code className="font-mono text-xs">GOOGLE_OAUTH_REDIRECT_URI</code> y{' '}
                  <code className="font-mono text-xs">ENCRYPTION_KEY</code>.
                </p>
              ) : googleStatus.data.connected ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm">
                      Conectado como{' '}
                      <strong className="text-foreground">{googleStatus.data.email}</strong>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Puedes agendar reuniones desde cualquier lead.
                    </p>
                  </div>
                  <ConfirmDialog
                    title="¿Desconectar tu cuenta de Google?"
                    description="Ya no podrás agendar reuniones con Meet desde halcon hasta que vuelvas a conectarla."
                    confirmLabel="Desconectar"
                    destructive
                    onConfirm={() => disconnectGoogle.mutate()}
                    trigger={
                      <Button variant="outline" disabled={disconnectGoogle.isPending}>
                        {disconnectGoogle.isPending ? <Loader2 className="animate-spin" /> : null}
                        Desconectar
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Conecta tu Google para agendar reuniones con Meet sobre los leads.
                  </p>
                  <Button asChild>
                    <a href="/api/google/auth/start">
                      <Video /> Conectar Google
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tus keys</CardTitle>
            </CardHeader>
            <CardContent>
              {list.isLoading ? (
                <div className="flex justify-center py-6 text-muted-foreground">
                  <Loader2 className="animate-spin" />
                </div>
              ) : !list.data?.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aún no tienes keys. Genera una arriba.
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {list.data.map((k) => (
                    <KeyRow key={k.id} k={k} disableRevoke={revoke.isPending} onRevoke={(id) => revoke.mutate({ id })} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
