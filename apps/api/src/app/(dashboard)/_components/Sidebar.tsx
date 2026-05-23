'use client';

import { Boxes, CalendarClock, KanbanSquare, Search, Zap, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '~/lib/utils';
import { trpc } from '~/lib/trpc';
import { ThemeToggle } from '~/components/theme-toggle';
import { Wordmark } from '~/components/wordmark';
import { AuthButton } from './AuthButton';
import { OrgControl } from './OrgControl';

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/leads', label: 'Leads', icon: Zap },
  { href: '/today', label: 'Hoy', icon: CalendarClock },
  { href: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { href: '/projects', label: 'Proyectos', icon: Boxes },
];

export function Sidebar() {
  const pathname = usePathname();
  const followUps = trpc.leads.followUps.useQuery();
  const pending = (followUps.data?.counts.overdue ?? 0) + (followUps.data?.counts.today ?? 0);

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border/60 bg-card/30 px-3 py-5 backdrop-blur-xl md:flex">
      <div className="px-3">
        <Wordmark logoClassName="size-6" textClassName="text-base" />
        <p className="mt-1 pl-[2.1rem] text-[10px] uppercase tracking-wide text-muted-foreground">
          by JALLER.DEV
        </p>
      </div>

      <button
        onClick={() =>
          document.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
          )
        }
        className="mt-6 flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <Search className="size-4" /> Buscar…
        </span>
        <kbd className="rounded border border-border/60 bg-background px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      <nav className="mt-6 flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
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
              {href === '/today' && pending > 0 && (
                <span className="rounded-full bg-rose-500/20 px-1.5 text-[10px] font-medium text-rose-300">
                  {pending}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2">
        <OrgControl />
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <AuthButton />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
