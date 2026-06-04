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

import { HalconLogo } from '~/components/halcon-logo';
import { cn } from '~/lib/utils';
import { trpc } from '~/lib/trpc';
import { TooltipProvider } from '~/components/ui/tooltip';
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

// Sidebar — navegación + workspace al fondo. Estilo Gemini: en estado
// colapsado el sidebar DESAPARECE por completo y sólo queda el toggle del
// TopBar para reabrirlo. No hay variante slim de 68px con iconos sueltos.
// Las acciones globales (bell, theme, user) viven en <TopBar />.
export function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const followUps = trpc.leads.followUps.useQuery();
  const pending = (followUps.data?.counts.overdue ?? 0) + (followUps.data?.counts.today ?? 0);

  const openCommandPalette = () =>
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
    );

  // Gemini-style collapse: cuando está colapsado simplemente no renderizamos
  // nada. El toggle del TopBar (PanelLeftOpen) sigue visible para reabrir.
  if (collapsed) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r border-border bg-card/60 px-3 py-4 backdrop-blur-xl md:flex">
        {/* Brand · logo + wordmark + by jaller.dev */}
        <div className="flex items-center gap-2.5 px-2">
          <HalconLogo className="size-[26px] shrink-0 text-[hsl(var(--violet))]" />
          <span className="text-[16px] font-[650] tracking-[-0.02em]">
            Halcón<span className="text-[hsl(var(--violet))]">OS</span>
          </span>
        </div>
        <div className="mt-0.5 px-2 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
          by jaller.dev
        </div>

        {/* Search trigger ⌘K */}
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

        {/* Nav */}
        <nav className="mt-5 flex flex-col gap-0.5">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const isImport = pathname.startsWith('/leads/import');
            const active = exact
              ? pathname === href
              : href === '/leads' && isImport
                ? false
                : pathname === href || pathname.startsWith(href + '/');

            const showBadge = href === '/today' && pending > 0;

            return (
              <Link
                key={href}
                href={href}
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

        {/* Workspace switcher al fondo, ancho completo. */}
        <div className="mt-auto pt-3.5">
          <OrgControl />
        </div>
      </aside>
    </TooltipProvider>
  );
}
