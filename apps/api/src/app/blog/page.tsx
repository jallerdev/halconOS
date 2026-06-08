import { ArrowRight, Calendar, Clock } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Wordmark } from '~/components/wordmark';
import { ThemeToggle } from '~/components/theme-toggle';
import { SITE, SITE_URL } from '~/lib/site';
import { POSTS } from './posts';

export const metadata: Metadata = {
  title: 'Blog · Guías para agencias y freelancers',
  description:
    'Estrategias prácticas para agencias y freelancers: cómo conseguir clientes, prospección con IA, propuestas que cierran, automatización de ventas.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: `Blog — ${SITE.name}`,
    description:
      'Estrategias prácticas para agencias y freelancers: prospección, propuestas con IA, crecimiento.',
    url: `${SITE_URL}/blog`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Blog — ${SITE.name}`,
    description:
      'Estrategias prácticas para agencias y freelancers: prospección, propuestas con IA, crecimiento.',
  },
};

// JSON-LD Blog schema — Google entiende esto como un blog y puede mostrar
// listing rich result con los últimos posts.
const blogSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  '@id': `${SITE_URL}/blog#blog`,
  url: `${SITE_URL}/blog`,
  name: `Blog de ${SITE.name}`,
  description:
    'Estrategias prácticas para agencias y freelancers: prospección, propuestas con IA, crecimiento.',
  inLanguage: 'es',
  publisher: { '@id': `${SITE_URL}/#organization` },
  blogPost: POSTS.map((p) => ({
    '@type': 'BlogPosting',
    '@id': `${SITE_URL}/blog/${p.slug}`,
    headline: p.title,
    description: p.description,
    datePublished: p.publishedAt,
    dateModified: p.updatedAt ?? p.publishedAt,
    author: { '@type': 'Organization', name: p.author.name },
    keywords: p.keywords.join(', '),
  })),
};

export default function BlogIndexPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground antialiased">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />

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
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Wordmark />
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              Inicio
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

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-12 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
            Blog HalcónOS
          </span>
          <h1 className="mt-3 text-balance text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            Guías para agencias y freelancers
          </h1>
          <p className="mt-5 text-lg text-pretty text-muted-foreground">
            Estrategias prácticas para conseguir clientes, cerrar más ventas y vivir de tu trabajo
            sin perseguir leads en WhatsApp.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-22px] hover:shadow-primary/50"
            >
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                {post.category}
              </span>
              <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight">
                {post.title}
              </h2>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  <time dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </time>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  {post.readingMinutes} min
                </span>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-transform group-hover:translate-x-1">
                Leer guía <ArrowRight className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-10 text-sm text-muted-foreground sm:flex-row">
          <Wordmark logoClassName="size-5" textClassName="text-sm" />
          <p>© {new Date().getFullYear()} JALLER.DEV · Sales OS para agencias</p>
        </div>
      </footer>
    </div>
  );
}
