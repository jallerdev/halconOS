import { ArrowRight, Calendar, ChevronLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Wordmark } from '~/components/wordmark';
import { ThemeToggle } from '~/components/theme-toggle';
import type { BlogPost } from '../posts';

// Shell visual para cualquier post: navbar minimal, breadcrumb back, header
// con título + meta, contenido (children) con typography prose, CTA al final
// y footer. Mantiene la jerarquía H1 → H2 → H3 dentro de children sin
// inyectar otro H1.
export function BlogShell({ post, children }: { post: BlogPost; children: ReactNode }) {
  const formattedDate = new Date(post.publishedAt).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground antialiased">
      {/* Fondo atmosférico minimal — un solo blob para no competir con la lectura. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(48% 38% at 38% -4%, hsl(252 100% 68% / 0.18) 0%, transparent 70%)',
        }}
      />

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Wordmark />
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/blog" className="transition-colors hover:text-foreground">
              Blog
            </Link>
            <Link href="/#features" className="transition-colors hover:text-foreground">
              Producto
            </Link>
            <ThemeToggle />
            <Link
              href="/sign-up"
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Probar gratis
            </Link>
          </nav>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-12">
        {/* Breadcrumb */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          Volver al blog
        </Link>

        {/* Header del post */}
        <header className="mt-6">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
            {post.category}
          </span>
          <h1 className="mt-3 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-5 text-lg text-pretty text-muted-foreground">{post.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              <time dateTime={post.publishedAt}>{formattedDate}</time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {post.readingMinutes} min de lectura
            </span>
            <span>Por {post.author.name}</span>
          </div>
        </header>

        {/* Contenido — typography prose-like sin tailwindcss/typography para no
            agregar dep. Los estilos viven en globals.css con .prose-blog. */}
        <div className="prose-blog mt-10">{children}</div>

        {/* CTA al cierre */}
        <aside className="mt-16 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/[0.12] to-card p-8">
          <h3 className="text-xl font-bold tracking-tight">
            Aplica esto en HalcónOS hoy mismo
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            14 días gratis, sin tarjeta. Descubre leads, redacta propuestas con IA y unifica tu
            pipeline en un solo lugar.
          </p>
          <Link
            href="/sign-up"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Empezar gratis <ArrowRight className="size-4" />
          </Link>
        </aside>
      </article>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 px-6 py-10 text-sm text-muted-foreground sm:flex-row">
          <Wordmark logoClassName="size-5" textClassName="text-sm" />
          <p>© {new Date().getFullYear()} JALLER.DEV · Sales OS para agencias</p>
        </div>
      </footer>
    </div>
  );
}
