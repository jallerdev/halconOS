'use client';

import {
  Boxes,
  CalendarClock,
  FileSpreadsheet,
  KanbanSquare,
  KeyRound,
  Search,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '~/lib/utils';
import { trpc } from '~/lib/trpc';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { Wordmark } from '~/components/wordmark';
import { OrgControl } from './OrgControl';
import { useSidebar } from './sidebar-context';

const NAV: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: '/leads', label: 'Leads', icon: Zap },
  { href: '/today', label: 'Hoy', icon: CalendarClock },
  { href: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { href: '/projects', label: 'Proyectos', icon: Boxes },
  { href: '/leads/import', label: 'Importar', icon: FileSpreadsheet, exact: true },
  { href: '/settings', label: 'Ajustes', icon: KeyRound },
];

// Sidebar de navegación pura. Las acciones globales (bell, theme, user)
// viven en el <TopBar /> — aquí solo hay logo, search, nav, workspace.
// El estado collapsed se controla desde sidebar-context para que el toggle
// del TopBar pueda alternarlo.
export function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
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
          'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/60 bg-card/60 backdrop-blur-xl transition-[width] duration-200 md:flex',
          collapsed ? 'w-[68px] px-2 py-4' : 'w-60 px-3 py-4',
        )}
      >
        {/* Logo / wordmark */}
        <div className={cn('flex items-center', collapsed ? 'justify-center px-0' : 'px-3')}>
          <Wordmark
            logoClassName="size-6"
            textClassName={collapsed ? 'hidden' : 'text-base'}
          />
        </div>

        {/* Search */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={openCommandPalette}
                aria-label="Buscar"
                className="mt-6 inline-flex size-10 items-center justify-center self-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
            className="mt-6 flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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

        {/* Workspace switcher al final — solo visible en expanded (Clerk no
            tiene un buen modo icon-only) */}
        {!collapsed && (
          <div className="mt-auto">
            <OrgControl />
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
