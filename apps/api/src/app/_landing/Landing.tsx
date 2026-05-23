'use client';

import { motion } from 'framer-motion';
import { Fragment } from 'react';
import {
  ArrowRight,
  Boxes,
  Check,
  ClipboardList,
  Eye,
  GitBranch,
  Hammer,
  Inbox,
  Rocket,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { ThemeToggle } from '~/components/theme-toggle';
import { Wordmark } from '~/components/wordmark';
import { HeroMockup } from './HeroMockup';
import { MagneticButton } from './MagneticButton';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

type Accent = 'sky' | 'violet' | 'emerald' | 'amber';

const ICON_STYLE: Record<Accent, string> = {
  sky: 'bg-sky-500/15 text-sky-500 dark:text-sky-300 group-hover:bg-sky-500 group-hover:text-white',
  violet: 'bg-primary/15 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
  emerald:
    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 group-hover:bg-emerald-500 group-hover:text-white',
  amber:
    'bg-amber-500/15 text-amber-600 dark:text-amber-300 group-hover:bg-amber-500 group-hover:text-white',
};
const CARD_GLOW: Record<Accent, string> = {
  sky: 'hover:border-sky-500/40 hover:shadow-[0_8px_40px_-12px] hover:shadow-sky-500/40',
  violet: 'hover:border-primary/40 hover:shadow-[0_8px_40px_-12px] hover:shadow-primary/50',
  emerald: 'hover:border-emerald-500/40 hover:shadow-[0_8px_40px_-12px] hover:shadow-emerald-500/40',
  amber: 'hover:border-amber-500/40 hover:shadow-[0_8px_40px_-12px] hover:shadow-amber-500/40',
};
const STAT_GRAD: Record<Accent, string> = {
  sky: 'from-sky-400 to-sky-600',
  violet: 'from-violet-400 to-primary',
  emerald: 'from-emerald-400 to-emerald-600',
  amber: 'from-amber-400 to-amber-600',
};
const BAR: Record<Accent, string> = {
  sky: 'bg-sky-400',
  violet: 'bg-primary',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
};
const ARROW: Record<Accent, string> = {
  sky: 'text-sky-400',
  violet: 'text-primary',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
};

const FEATURES: { icon: LucideIcon; title: string; body: string; accent: Accent }[] = [
  {
    icon: Inbox,
    accent: 'sky',
    title: 'Captación centralizada',
    body: 'Todos tus prospectos en un solo pipeline: búsqueda instantánea, filtros y scoring automático que prioriza los leads con mayor potencial de cierre.',
  },
  {
    icon: Sparkles,
    accent: 'violet',
    title: 'Propuestas con IA',
    body: 'Genera estrategia de venta, propuesta comercial y el primer mensaje perfecto en segundos. La IA hace el borrador; tú cierras el trato.',
  },
  {
    icon: GitBranch,
    accent: 'emerald',
    title: 'Trazabilidad total',
    body: 'Del primer contacto a la entrega: convierte un lead ganado en proyecto con un tap y sigue cada tarea sin perder una sola nota.',
  },
];

const STATS: { value: string; label: string; accent: Accent }[] = [
  { value: '1.461', label: 'leads gestionados', accent: 'violet' },
  { value: '7', label: 'etapas de pipeline', accent: 'sky' },
  { value: 'IA', label: 'propuestas en segundos', accent: 'emerald' },
  { value: '⌘K', label: 'command palette', accent: 'amber' },
];

type Step = { icon: LucideIcon; label: string; sub: string; accent: Accent };

const SALES_FLOW: Step[] = [
  { icon: Zap, label: 'Capta el lead', sub: 'Negocio sin web', accent: 'sky' },
  { icon: Sparkles, label: 'Genera propuesta', sub: 'Con IA', accent: 'violet' },
  { icon: Star, label: 'Gana la venta', sub: 'Estado WON', accent: 'amber' },
  { icon: Boxes, label: 'Crea el proyecto', sub: '1 tap, con contexto', accent: 'emerald' },
];

const PROJECT_FLOW: Step[] = [
  { icon: ClipboardList, label: 'Planeación', sub: 'Alcance y tareas', accent: 'sky' },
  { icon: Hammer, label: 'En progreso', sub: 'Manos a la obra', accent: 'violet' },
  { icon: Eye, label: 'Revisión', sub: 'QA y ajustes', accent: 'amber' },
  { icon: Rocket, label: 'Entregado', sub: 'Cliente feliz', accent: 'emerald' },
];

function Eyebrow({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${color}`}>{children}</span>
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
            className="flex flex-1 items-center gap-3 rounded-2xl border border-border bg-background p-4 md:flex-col md:text-center"
          >
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${ICON_STYLE[step.accent]}`}
            >
              <step.icon className="size-5" />
            </div>
            <div>
              <div className="text-sm font-medium">{step.label}</div>
              <div className="text-xs text-muted-foreground">{step.sub}</div>
            </div>
          </motion.div>
          {i < arr.length - 1 && (
            <div className="flex items-center justify-center md:px-1">
              <ArrowRight className={`size-5 shrink-0 rotate-90 md:rotate-0 ${ARROW[step.accent]}`} />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground antialiased">
      {/* ambient color blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(50% 40% at 50% -5%, hsl(252 100% 68% / 0.28) 0%, transparent 70%), radial-gradient(40% 35% at 90% 5%, hsl(199 89% 55% / 0.20) 0%, transparent 70%), radial-gradient(38% 32% at 5% 18%, hsl(330 90% 62% / 0.16) 0%, transparent 70%), radial-gradient(40% 35% at 80% 60%, hsl(160 84% 45% / 0.12) 0%, transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(to right, hsl(var(--foreground) / 0.05) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground) / 0.05) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(75% 55% at 50% 0%, black, transparent)',
        }}
      />

      {/* nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Wordmark />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#problema" className="transition-colors hover:text-foreground">Problema</a>
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#flujo" className="transition-colors hover:text-foreground">Cómo funciona</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <MagneticButton href="/sign-in" className="h-10 px-5 text-sm" strength={0.25}>
              Entrar <ArrowRight className="size-4" />
            </MagneticButton>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-20 text-center md:pt-28">
        <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.1 }}>
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/[0.08] px-3.5 py-1.5 text-xs font-medium text-primary"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            El Sales OS para agencias de desarrollo web
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mx-auto mt-7 max-w-4xl text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl"
          >
            Capta, propone y{' '}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-primary via-fuchsia-500 to-sky-500 bg-clip-text text-transparent">
                cierra
              </span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-1 -z-0 h-3 -rotate-1 rounded-full bg-gradient-to-r from-primary/30 to-sky-400/30 blur-[2px]"
              />
            </span>{' '}
            sin perder un solo lead
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground"
          >
            HalcónOS centraliza tus prospectos, redacta tus propuestas con IA y traza cada venta
            desde el primer contacto hasta la entrega del proyecto. Tu pipeline, por fin bajo control.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-4"
          >
            <MagneticButton href="/sign-in">
              Empezar ahora <ArrowRight className="size-4" />
            </MagneticButton>
            <MagneticButton href="#flujo" variant="outline">
              Ver cómo funciona
            </MagneticButton>
          </motion.div>
        </motion.div>

        <HeroMockup />
      </section>

      {/* stats band */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.08 }}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border shadow-sm md:grid-cols-4 dark:shadow-none"
        >
          {STATS.map((s) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              className="relative bg-card px-5 py-7 text-center"
            >
              <span className={`absolute inset-x-0 top-0 mx-auto h-1 w-12 rounded-b-full ${BAR[s.accent]}`} />
              <div
                className={`bg-gradient-to-b bg-clip-text text-3xl font-bold tracking-tight text-transparent ${STAT_GRAD[s.accent]}`}
              >
                {s.value}
              </div>
              <div className="mt-1.5 text-xs text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* problema / solución */}
      <section id="problema" className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          transition={{ staggerChildren: 0.12 }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <Eyebrow color="text-rose-500">El costo del desorden</Eyebrow>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-4 text-3xl font-bold tracking-tight md:text-5xl"
          >
            El desorden te cuesta{' '}
            <span className="bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent">
              ventas
            </span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-4 text-muted-foreground"
          >
            Cada lead que se pierde entre hojas de cálculo, chats y notas sueltas es dinero que dejas
            sobre la mesa. HalcónOS lo unifica todo.
          </motion.p>
        </motion.div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-rose-500/25 bg-gradient-to-b from-rose-500/[0.08] to-card p-8 shadow-sm dark:shadow-none"
          >
            <h3 className="flex items-center gap-2.5 text-lg font-semibold text-rose-500 dark:text-rose-300">
              <span className="flex size-8 items-center justify-center rounded-lg bg-rose-500/15">
                <X className="size-4" />
              </span>
              Sin un sistema
            </h3>
            <ul className="mt-6 space-y-3.5 text-sm text-muted-foreground">
              {[
                'Prospectos dispersos en Excel, WhatsApp y la memoria.',
                'Propuestas escritas desde cero cada vez, horas perdidas.',
                'Nunca sabes qué lead vale más ni en qué etapa está.',
                'El contexto de la venta se pierde al arrancar el proyecto.',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <X className="mt-0.5 size-4 shrink-0 text-rose-400" /> {t}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl border border-primary/35 bg-gradient-to-b from-primary/[0.1] to-card p-8 shadow-sm dark:shadow-none"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full bg-primary/20 blur-3xl"
            />
            <h3 className="flex items-center gap-2.5 text-lg font-semibold text-primary">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15">
                <Check className="size-4" />
              </span>
              Con HalcónOS
            </h3>
            <ul className="mt-6 space-y-3.5 text-sm text-foreground/90">
              {[
                'Un pipeline único con scoring que prioriza por ti.',
                'Propuestas y mensajes generados con IA en segundos.',
                'Visualizas el embudo completo de un vistazo.',
                'El lead ganado se vuelve proyecto sin perder nada.',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" /> {t}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow color="text-sky-500">Capacidades</Eyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
            Tres pilares, un flujo{' '}
            <span className="bg-gradient-to-r from-sky-500 via-primary to-emerald-500 bg-clip-text text-transparent">
              imparable
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Diseñado para agencias que captan negocios locales y los llevan de prospecto a cliente.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ staggerChildren: 0.1 }}
          className="mt-14 grid gap-5 md:grid-cols-3"
        >
          {FEATURES.map(({ icon: Icon, title, body, accent }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -6 }}
              className={`group rounded-3xl border border-border bg-card p-7 shadow-sm transition-all duration-300 dark:shadow-none ${CARD_GLOW[accent]}`}
            >
              <div
                className={`flex size-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 ${ICON_STYLE[accent]}`}
              >
                <Icon className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* flujo */}
      <section id="flujo" className="mx-auto max-w-6xl px-6 py-20">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-sm md:p-14 dark:bg-gradient-to-b dark:from-card/70 dark:to-card/10 dark:shadow-none">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-primary to-emerald-400"
          />
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">
              <Target className="size-3.5" /> Trazabilidad de extremo a extremo
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight md:text-4xl">
              Del lead al proyecto entregado, sin perder nada
            </h2>
          </div>

          {/* Fase 1: pipeline de venta */}
          <div className="mt-12 text-center">
            <Eyebrow color="text-primary">Fase 1 · Pipeline de venta</Eyebrow>
          </div>
          <div className="mt-5">
            <FlowRow steps={SALES_FLOW} />
          </div>

          {/* Puente: conversión */}
          <div className="my-6 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-emerald-400/60" />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">
              <GitBranch className="size-3.5" /> Conversión en 1 tap, sin perder contexto
            </span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-emerald-400/60" />
          </div>

          {/* Fase 2: ciclo del proyecto */}
          <div className="text-center">
            <Eyebrow color="text-emerald-500">Fase 2 · Ciclo del proyecto</Eyebrow>
          </div>
          <div className="mt-5">
            <FlowRow steps={PROJECT_FLOW} />
          </div>
        </div>
      </section>

      {/* cierre / demo */}
      <section className="mx-auto max-w-6xl px-6 pb-28 pt-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2.5rem] border border-primary/30 bg-card px-6 py-20 text-center shadow-lg shadow-primary/10 dark:shadow-none"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              backgroundImage:
                'radial-gradient(55% 90% at 25% 110%, hsl(199 89% 55% / 0.25) 0%, transparent 65%), radial-gradient(55% 90% at 75% 110%, hsl(252 100% 68% / 0.32) 0%, transparent 65%), radial-gradient(40% 70% at 50% 120%, hsl(330 90% 62% / 0.2) 0%, transparent 65%)',
            }}
          />
          <div className="mx-auto mb-6 flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-300">
            <TrendingUp className="size-4" /> Convierte más, persigue menos
          </div>
          <h2 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
            Deja de perseguir leads.
            <br />
            <span className="bg-gradient-to-r from-sky-500 via-primary to-fuchsia-500 bg-clip-text text-transparent">
              Empieza a cerrarlos.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-muted-foreground">
            Tu pipeline, tus propuestas y tus proyectos en un solo lugar. Entra y toma el control hoy.
          </p>
          <div className="mt-9 flex justify-center">
            <MagneticButton href="/sign-in" className="h-14 px-8 text-base">
              Entrar a HalcónOS <ArrowRight className="size-5" />
            </MagneticButton>
          </div>
        </motion.div>
      </section>

      {/* footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-10 text-sm text-muted-foreground sm:flex-row">
          <Wordmark logoClassName="size-5" textClassName="text-sm" />
          <p>© {new Date().getFullYear()} JALLER.DEV · Sales OS para agencias</p>
        </div>
      </footer>
    </div>
  );
}
