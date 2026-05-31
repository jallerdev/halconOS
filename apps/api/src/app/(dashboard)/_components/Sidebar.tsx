'use client';

import {
  Boxes,
  CalendarClock,
  FileSpreadsheet,
  KanbanSquare,
  KeyRound,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { cn } from '~/lib/utils';
import { trpc } from '~/lib/trpc';
import { ThemeToggle } from '~/components/theme-toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { Wordmark } from '~/components/wordmark';
import { AuthButton } from './AuthButton';
import { NotificationBell } from './NotificationBell';
import { OrgControl } from './OrgControl';

const NAV: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: '/leads', label: 'Leads', icon: Zap },
  { href: '/today', label: 'Hoy', icon: CalendarClock },
  { href: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { href: '/projects', label: 'Proyectos', icon: Boxes },
  { href: '/leads/import', label: 'Importar', icon: FileSpreadsheet, exact: true },
  { href: '/settings', label: 'Ajustes', icon: KeyRound },
];

const STORAGE_KEY = 'halcon:sidebar:collapsed';

export function Sidebar() {
  const pathname = usePathname();
  const followUps = trpc.leads.followUps.useQuery();
  const pending = (followUps.data?.counts.overdue ?? 0) + (followUps.data?.counts.today ?? 0);

  // Estado de colapso persistido en localStorage. Inicia false para evitar
  // hydration mismatch; el useEffect lo sincroniza con la preferencia guardada
  // antes del primer paint perceptible.
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === '1') setCollapsed(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  }, [collapsed, hydrated]);

  const openCommandPalette = () =>
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
    );

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/60 bg-card/30 backdrop-blur-xl transition-[width] duration-200 md:flex',
          collapsed ? 'w-[68px] px-2 py-5' : 'w-60 px-3 py-5',
        )}
      >
        {/* Header — logo + acciones en filas separadas para que el wordmark
            no compita con los iconos por ancho horizontal. */}
        {collapsed ? (
          <div className="flex flex-col items-center gap-3">
            <Wordmark logoClassName="size-6" textClassName="hidden" />
            <NotificationBell />
            <ThemeToggle />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setCollapsed(false)}
                  aria-label="Expandir sidebar"
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-border/60 bg-card/40 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <PanelLeftOpen className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Expandir</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <>
            <div className="px-3">
              <Wordmark logoClassName="size-6" textClassName="text-base" />
              <p className="mt-1 pl-[2.1rem] text-[10px] uppercase tracking-wide text-muted-foreground">
                by JALLER.DEV
              </p>
            </div>
            <div className="mt-3 flex items-center justify-end gap-1 px-3">
              <NotificationBell />
              <ThemeToggle />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setCollapsed(true)}
                    aria-label="Colapsar sidebar"
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-border/60 bg-card/40 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <PanelLeftClose className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Colapsar</TooltipContent>
              </Tooltip>
            </div>
          </>
        )}

        {/* Search */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={openCommandPalette}
                aria-label="Buscar"
                className="mt-6 inline-flex size-10 items-center justify-center self-center rounded-lg border border-border/60 bg-secondary/30 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Search className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Buscar{' '}
              <kbd className="ml-1 rounded border border-border/60 bg-background px-1 font-mono text-[10px]">
                ⌘K
              </kbd>
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={openCommandPalette}
            className="mt-6 flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <Search className="size-4" /> Buscar…
            </span>
            <kbd className="rounded border border-border/60 bg-background px-1.5 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Nav */}
        <nav className={cn('mt-6 flex flex-col gap-1', collapsed && 'items-center')}>
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const isImport = pathname.startsWith('/leads/import');
            const active = exact
              ? pathname === href
              : href === '/leads' && isImport
                ? false
                : pathname === href || pathname.startsWith(href + '/');

            const showBadge = href === '/today' && pending > 0;

            if (collapsed) {
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={href}
                      className={cn(
                        'relative inline-flex size-10 items-center justify-center rounded-lg transition-colors',
                        active
                          ? 'bg-accent text-foreground'
                          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                      )}
                    >
                      <Icon className="size-4" />
                      {showBadge && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-card">
                          {pending > 9 ? '9+' : pending}
                        </span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                <span className="flex-1">{label}</span>
                {showBadge && (
                  <span className="rounded-full bg-rose-500/20 px-1.5 text-[10px] font-medium text-rose-300">
                    {pending}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer — identidad */}
        <div className={cn('mt-auto space-y-2', collapsed && 'flex flex-col items-center')}>
          {!collapsed && <OrgControl />}
          <AuthButton compact={collapsed} />
        </div>
      </aside>
    </TooltipProvider>
  );
}
