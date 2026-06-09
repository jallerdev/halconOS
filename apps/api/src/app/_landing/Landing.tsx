'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Fragment } from 'react';
import {
  ArrowRight,
  Check,
  GitBranch,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';

import { ThemeToggle } from '~/components/theme-toggle';
import { Wordmark } from '~/components/wordmark';
import { getLandingContent, type Locale, type Step } from './content';
import { HeroMockup } from './HeroMockup';
import { MagneticButton } from './MagneticButton';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

// Variante para el contenido above-the-fold (hero): solo desplazamiento, sin
// fade de opacidad. Así el LCP (el <h1>) se pinta visible desde el primer frame
// del SSR en vez de esperar a que framer-motion hidrate y haga el fade-in.
const heroUp = {
  hidden: { y: 14 },
  show: { y: 0 },
};

const ICON_STYLE = {
  violet: 'bg-primary/15 text-primary group-hover:scale-110',
  teal: 'bg-teal-500/15 text-teal-600 dark:text-teal-300 group-hover:scale-110',
} as const;

const STEP_ICON = {
  violet: 'bg-primary/15 text-primary',
  teal: 'bg-teal-500/15 text-teal-600 dark:text-teal-300',
} as const;

const GRAD = 'bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent';

function Eyebrow({ children, color = 'text-primary' }: { children: React.ReactNode; color?: string }) {
  return (
    <span className={`text-xs font-bold uppercase tracking-[0.22em] ${color}`}>{children}</span>
  );
}

function FlowRow({ steps }: { steps: Step[] }) {
  return (
    <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-stretch md:justify-center md:gap-2">
      {steps.map((step, i, arr) => (
        <Fragment key={step.label}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="flex flex-1 items-center gap-3 rounded-2xl border border-border bg-background/60 p-4 md:flex-col md:text-center"
          >
            <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${STEP_ICON[step.tone]}`}>
              <step.icon className="size-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">{step.label}</div>
              <div className="text-xs text-muted-foreground">{step.sub}</div>
            </div>
          </motion.div>
          {i < arr.length - 1 && (
            <div className="flex items-center justify-center text-border md:px-1">
              <ArrowRight className="size-5 shrink-0 rotate-90 md:rotate-0" />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}

// El switcher de idioma — link al alterno. Mantiene consistencia con el resto
// del nav (sin un dropdown enorme, solo un toggle binario).
function LanguageSwitcher({ current }: { current: 'es' | 'en' }) {
  const target = current === 'es' ? '/en' : '/';
  const targetLabel = current === 'es' ? 'EN' : 'ES';
  return (
    <Link
      href={target}
      className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label={current === 'es' ? 'Switch to English' : 'Cambiar a español'}
    >
      {targetLabel}
    </Link>
  );
}

// Recibe SOLO `locale` (string serializable) y resuelve el content adentro.
// Los iconos de lucide-react son componentes React y no se pueden serializar
// de server → client, así que el content NO se puede pasar como prop.
export function Landing({ locale }: { locale: Locale }) {
  const content = getLandingContent(locale);
  const { nav, hero, stats, problem, features, flow, faq, cta, footer } = content;
  const blogHref = content.locale === 'en' ? '/en/blog' : '/blog';

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground antialiased">
      {/* ── Fondo atmosférico: SOLO violet + teal ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(48% 38% at 38% -4%, hsl(252 100% 68% / 0.26) 0%, transparent 70%), radial-gradient(44% 40% at 92% 90%, hsl(168 76% 42% / 0.16) 0%, transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundImage:
            'linear-gradient(to right, hsl(var(--foreground) / 0.045) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground) / 0.045) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(80% 55% at 50% 0%, black, transparent)',
        }}
      />

      {/* ── Nav ── */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/65 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Wordmark />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#problema" className="transition-colors hover:text-foreground">{nav.problem}</a>
            <a href="#features" className="transition-colors hover:text-foreground">{nav.features}</a>
            <a href="#flujo" className="transition-colors hover:text-foreground">{nav.flow}</a>
            <a href="#faq" className="transition-colors hover:text-foreground">{nav.faq}</a>
            <Link href={blogHref} className="transition-colors hover:text-foreground">{nav.blog}</Link>
          </nav>
          <div className="flex items-center gap-2.5">
            <LanguageSwitcher current={content.locale} />
            <ThemeToggle />
            <MagneticButton href="/sign-in" className="h-10 px-5 text-sm" strength={0.25}>
              {nav.enter} <ArrowRight className="size-4" />
            </MagneticButton>
          </div>
        </div>
      </header>

      {/* ── Hero (2-col en lg+: copy izq, mockup der) ── */}
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-20 md:pt-28">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
          <motion.div
            initial="hidden"
            animate="show"
            transition={{ staggerChildren: 0.1 }}
            className="text-center lg:text-left"
          >
            <motion.div
              variants={heroUp}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/[0.08] px-3.5 py-1.5 text-xs font-medium text-primary"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              {hero.badge}
            </motion.div>

            <motion.h1
              variants={heroUp}
              transition={{ duration: 0.5 }}
              className="mt-7 text-balance text-5xl font-extrabold leading-[0.98] tracking-tight md:text-6xl xl:text-7xl"
            >
              {hero.h1.before}<span className={GRAD}>{hero.h1.highlight}</span>{hero.h1.after}
            </motion.h1>

            <motion.p
              variants={heroUp}
              transition={{ duration: 0.5 }}
              className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground lg:mx-0"
            >
              {hero.sub}
            </motion.p>

            <motion.div
              variants={heroUp}
              transition={{ duration: 0.5 }}
              className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
            >
              <MagneticButton href="/sign-up">
                {hero.ctaPrimary} <ArrowRight className="size-4" />
              </MagneticButton>
              <MagneticButton href="#features" variant="outline">
                {hero.ctaSecondary}
              </MagneticButton>
            </motion.div>

            <motion.p
              variants={heroUp}
              transition={{ duration: 0.5 }}
              className="mt-4 text-xs text-muted-foreground"
            >
              {hero.trustLine}
            </motion.p>
          </motion.div>

          <div className="relative">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* ── Stats band ── */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.08 }}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border shadow-sm md:grid-cols-4 dark:shadow-none"
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp} transition={{ duration: 0.4 }} className="relative bg-card px-5 py-8 text-center">
              <span className="absolute inset-x-0 top-0 mx-auto h-[3px] w-12 rounded-b-full bg-gradient-to-r from-primary to-teal-400" />
              <div className={`text-4xl font-extrabold tracking-tight tabular-nums ${GRAD}`}>{s.value}</div>
              <div className="mt-2.5 text-xs text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Problema / Solución ── */}
      <section id="problema" className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          transition={{ staggerChildren: 0.12 }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <Eyebrow color="text-muted-foreground">{problem.eyebrow}</Eyebrow>
          </motion.div>
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
            {problem.titleStart}<span className={GRAD}>{problem.titleHighlight}</span>
          </motion.h2>
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="mt-4 text-muted-foreground">
            {problem.lead}
          </motion.p>
        </motion.div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-border bg-muted/40 p-8 saturate-[0.4]"
          >
            <h3 className="flex items-center gap-2.5 text-lg font-semibold text-muted-foreground">
              <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <X className="size-4" />
              </span>
              {problem.without.title}
            </h3>
            <ul className="mt-6 space-y-3.5 text-sm text-muted-foreground">
              {problem.without.bullets.map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <X className="mt-0.5 size-4 shrink-0 text-muted-foreground/70" /> {t}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-b from-primary/[0.12] to-card p-8"
          >
            <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-teal-400/20 blur-3xl" />
            <h3 className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/[0.18] text-primary">
                <Check className="size-4" />
              </span>
              {problem.with.title}
            </h3>
            <ul className="mt-6 space-y-3.5 text-sm text-foreground/90">
              {problem.with.bullets.map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-teal-500" /> {t}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>{features.eyebrow}</Eyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
            {features.titleStart}<span className={GRAD}>{features.titleHighlight}</span>
          </h2>
          <p className="mt-4 text-muted-foreground">{features.lead}</p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ staggerChildren: 0.1 }}
          className="mt-14 grid gap-5 md:grid-cols-3"
        >
          {features.items.map(({ icon: Icon, title, body, tone, n }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card/60 p-7 backdrop-blur-sm transition-all duration-300 hover:border-primary/45 hover:shadow-[0_20px_50px_-24px] hover:shadow-primary/60"
            >
              <span className="absolute right-6 top-6 text-sm font-bold tabular-nums text-border">{n}</span>
              <div className={`flex size-12 items-center justify-center rounded-2xl transition-transform duration-300 ${ICON_STYLE[tone]}`}>
                <Icon className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Flujo ── */}
      <section id="flujo" className="mx-auto max-w-6xl px-6 py-20">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card/50 p-8 backdrop-blur-sm md:p-14">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary to-teal-400" />
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/[0.08] px-3 py-1 text-xs font-medium text-teal-600 dark:text-teal-300">
              <Target className="size-3.5" /> {flow.chip}
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight md:text-4xl">
              {flow.titleStart}<span className={GRAD}>{flow.titleHighlight}</span>
            </h2>
          </div>

          <div className="mt-12 text-center">
            <Eyebrow>{flow.phase1Eyebrow}</Eyebrow>
          </div>
          <div className="mt-5">
            <FlowRow steps={flow.sales} />
          </div>

          <div className="my-6 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-teal-400/60" />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/[0.08] px-3 py-1 text-xs font-medium text-teal-600 dark:text-teal-300">
              <GitBranch className="size-3.5" /> {flow.bridge}
            </span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-teal-400/60" />
          </div>

          <div className="text-center">
            <Eyebrow color="text-teal-600 dark:text-teal-300">{flow.phase2Eyebrow}</Eyebrow>
          </div>
          <div className="mt-5">
            <FlowRow steps={flow.project} />
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="mx-auto max-w-5xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>{faq.eyebrow}</Eyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">{faq.title}</h2>
          <p className="mt-4 text-muted-foreground">{faq.sub}</p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          transition={{ staggerChildren: 0.06 }}
          className="mt-12 grid gap-4 md:grid-cols-2"
        >
          {faq.items.map((item) => (
            <motion.details
              key={item.q}
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              className="group rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm transition-colors hover:border-primary/30"
            >
              <summary className="flex cursor-pointer items-start justify-between gap-4 text-sm font-semibold tracking-tight text-foreground marker:hidden [&::-webkit-details-marker]:hidden">
                <h3 className="text-base">{item.q}</h3>
                <span
                  aria-hidden
                  className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </motion.details>
          ))}
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-6xl px-6 pb-28 pt-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2.5rem] border border-primary/30 bg-card/60 px-6 py-20 text-center backdrop-blur-sm"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              backgroundImage:
                'radial-gradient(55% 90% at 30% 120%, hsl(168 76% 42% / 0.28) 0%, transparent 60%), radial-gradient(55% 90% at 75% 120%, hsl(252 100% 68% / 0.4) 0%, transparent 60%)',
            }}
          />
          <div className="mx-auto mb-6 flex items-center justify-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-300">
            <TrendingUp className="size-4" /> {cta.chip}
          </div>
          <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight md:text-5xl">
            {cta.titleStart}<span className={GRAD}>{cta.titleHighlight}</span>{cta.titleEnd}
          </h2>
          <p className="mx-auto mt-5 max-w-md text-muted-foreground">{cta.body}</p>
          <div className="mt-9 flex justify-center">
            <MagneticButton href="/sign-in" className="h-14 px-8 text-base">
              {cta.button} <ArrowRight className="size-5" />
            </MagneticButton>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-10 text-sm text-muted-foreground sm:flex-row">
          <Wordmark logoClassName="size-5" textClassName="text-sm" />
          <p>© {new Date().getFullYear()} JALLER.DEV · {footer.tagline}</p>
        </div>
      </footer>
    </div>
  );
}
