'use client';

import {
  Boxes,
  CalendarClock,
  Compass,
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

import { HalconLogo } from '~/components/halcon-logo';
import { cn } from '~/lib/utils';
import { trpc } from '~/lib/trpc';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { OrgControl } from './OrgControl';
import { useSidebar } from './sidebar-context';

const NAV: { href: string; label: string; icon: LucideIcon; exact?: boolean; tour: string }[] = [
  { href: '/leads', label: 'Leads', icon: Zap, tour: 'nav-leads' },
  { href: '/discover', label: 'Descubrir', icon: Compass, tour: 'nav-discover' },
  { href: '/today', label: 'Hoy', icon: CalendarClock, tour: 'nav-today' },
  { href: '/pipeline', label: 'Pipeline', icon: KanbanSquare, tour: 'nav-pipeline' },
  { href: '/projects', label: 'Proyectos', icon: Boxes, tour: 'nav-projects' },
  { href: '/leads/import', label: 'Importar', icon: FileSpreadsheet, exact: true, tour: 'nav-import' },
  { href: '/settings', label: 'Ajustes', icon: KeyRound, tour: 'nav-settings' },
];

// Sidebar — navegación + workspace al fondo. Estilo Gemini: el LOGO de
// HalcónOS es el toggle del collapse — al hacer hover sobre él, se
// reemplaza por el icono PanelLeftOpen/Close. Las acciones globales
// (bell, theme, user) viven en <TopBar />.
export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const followUps = trpc.leads.followUps.useQuery();
  const pending = (followUps.data?.counts.overdue ?? 0) + (followUps.data?.counts.today ?? 0);

  const openCommandPalette = () =>
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
    );

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card/60 backdrop-blur-xl transition-[width] duration-200 md:flex',
          collapsed ? 'w-[68px] px-2.5 py-4' : 'w-[240px] px-3 py-4',
        )}
      >
        {/* Brand · click toggle; hover swap logo↔panel icon (estilo Gemini) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggle}
              aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
              className={cn(
                'hx-press group/brand flex items-center gap-2.5 rounded-lg text-left transition-colors hover:bg-accent/60',
                collapsed
                  ? 'mx-auto size-10 justify-center px-0'
                  : 'w-full px-2 py-1',
              )}
            >
              {/* Default: logo · Hover: toggle icon */}
              <span className="relative inline-flex size-[26px] shrink-0 items-center justify-center">
                <HalconLogo className="absolute size-[26px] text-[hsl(var(--violet))] transition-opacity duration-150 group-hover/brand:opacity-0" />
                {collapsed ? (
                  <PanelLeftOpen className="absolute size-[20px] text-muted-foreground opacity-0 transition-opacity duration-150 group-hover/brand:opacity-100 group-hover/brand:text-foreground" />
                ) : (
                  <PanelLeftClose className="absolute size-[20px] text-muted-foreground opacity-0 transition-opacity duration-150 group-hover/brand:opacity-100 group-hover/brand:text-foreground" />
                )}
              </span>
              {!collapsed && (
                <span className="text-[16px] font-[650] tracking-[-0.02em]">
                  Halcón<span className="text-[hsl(var(--violet))]">OS</span>
                </span>
              )}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">Expandir barra lateral</TooltipContent>
          )}
        </Tooltip>
        {!collapsed && (
          <div className="mt-0.5 px-2 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
            by jaller.dev
          </div>
        )}

        {/* Search trigger ⌘K */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={openCommandPalette}
                aria-label="Buscar"
                className="hx-press mt-5 inline-flex size-10 items-center justify-center self-center rounded-lg border border-border bg-card-2/50 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Search className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Buscar{' '}
              <kbd className="ml-1 rounded border border-border bg-background px-1 font-mono text-[10px]">
                ⌘K
              </kbd>
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={openCommandPalette}
            className="hx-press mt-5 flex items-center justify-between gap-2 rounded-lg border border-border bg-card-2/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <Search className="size-4" /> Buscar…
            </span>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Nav */}
        <nav className={cn('mt-5 flex flex-col gap-0.5', collapsed && 'items-center')}>
          {NAV.map(({ href, label, icon: Icon, exact, tour }) => {
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
                      data-tour={tour}
                      className={cn(
                        'relative inline-flex size-10 items-center justify-center rounded-lg transition-colors',
                        active
                          ? 'bg-accent text-foreground before:absolute before:-left-2.5 before:top-1/2 before:h-[18px] before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-[hsl(var(--violet))]'
                          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                      )}
                    >
                      <Icon className="size-[17px]" />
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
                data-tour={tour}
                className={cn(
                  'relative flex items-center gap-[11px] rounded-lg px-3 py-[9px] text-[13.5px] font-medium transition-colors',
                  active
                    ? 'bg-accent text-foreground before:absolute before:-left-3 before:top-1/2 before:h-[18px] before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-[hsl(var(--violet))]'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                <Icon className="size-[17px]" />
                <span className="flex-1">{label}</span>
                {showBadge && (
                  <span className="rounded-full bg-[hsl(var(--violet))]/16 px-[7px] text-[10px] font-semibold text-[hsl(var(--violet))]">
                    {pending}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Workspace switcher al fondo, ancho completo (sólo en expanded). */}
        {!collapsed && (
          <div className="mt-auto pt-3.5">
            <OrgControl />
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
