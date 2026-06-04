'use client';

import { motion } from 'framer-motion';
import { Fragment } from 'react';
import {
  ArrowRight,
  Boxes,
  Check,
  ClipboardList,
  Eye,
  FileText,
  GitBranch,
  Hammer,
  KanbanSquare,
  MapPin,
  MessageCircle,
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

/* ── Sistema de dos tonos: SOLO violet (primary) + teal ── */
type Tone = 'violet' | 'teal';

const ICON_STYLE: Record<Tone, string> = {
  violet: 'bg-primary/15 text-primary group-hover:scale-110',
  teal: 'bg-teal-500/15 text-teal-600 dark:text-teal-300 group-hover:scale-110',
};
const STEP_ICON: Record<Tone, string> = {
  violet: 'bg-primary/15 text-primary',
  teal: 'bg-teal-500/15 text-teal-600 dark:text-teal-300',
};

const FEATURES: { icon: LucideIcon; title: string; body: string; tone: Tone; n: string }[] = [
  {
    icon: MapPin,
    tone: 'violet',
    n: '01',
    title: 'Caza leads con Google',
    body: 'Encuentra negocios reales por ciudad y categoría con Google Places. Filtra los que no tienen web, los mejor calificados — y mándalos directo a tu pipeline.',
  },
  {
    icon: Sparkles,
    tone: 'teal',
    n: '02',
    title: 'Propuestas con IA',
    body: 'Estrategia de venta, propuesta comercial y el primer mensaje perfecto en segundos. La IA hace el borrador; tú cierras el trato.',
  },
  {
    icon: MessageCircle,
    tone: 'violet',
    n: '03',
    title: 'Conversación multicanal',
    body: 'WhatsApp y Email sincronizados con cada lead. Toda la conversación queda en su contexto — sin saltar entre apps, sin perder hilos.',
  },
  {
    icon: KanbanSquare,
    tone: 'teal',
    n: '04',
    title: 'Pipeline + Inbox personal',
    body: 'Kanban configurable por servicio, scoring automático, asignación por miembro y vista "Mis leads" para que cada vendedor trabaje sin ruido.',
  },
  {
    icon: FileText,
    tone: 'violet',
    n: '05',
    title: 'Propuestas firmables',
    body: 'Crea propuestas con line items, envíalas con un link público y deja que el cliente firme online. PDF generado, contrato cerrado.',
  },
  {
    icon: Boxes,
    tone: 'teal',
    n: '06',
    title: 'De lead a proyecto en 1 tap',
    body: 'Cuando ganas el deal, el lead se vuelve proyecto con todo el contexto. Tareas, deadlines, facturación — sin retipear nada.',
  },
];

const STATS: { value: string; label: string }[] = [
  { value: '5 min', label: 'de prospecto a primer mensaje' },
  { value: '+38%', label: 'tasa de cierre con propuestas IA' },
  { value: '3→1', label: 'WhatsApp · Email · Pipeline unificados' },
  { value: '⌘K', label: 'todo a un atajo de distancia' },
];

type Step = { icon: LucideIcon; label: string; sub: string; tone: Tone };

const SALES_FLOW: Step[] = [
  { icon: Zap, label: 'Caza el lead', sub: 'Negocio sin web', tone: 'violet' },
  { icon: Sparkles, label: 'Propón con IA', sub: 'Borrador en segundos', tone: 'teal' },
  { icon: Star, label: 'Gana la venta', sub: 'Estado Ganado', tone: 'violet' },
  { icon: Boxes, label: 'Crea el proyecto', sub: '1 tap, con contexto', tone: 'teal' },
];

const PROJECT_FLOW: Step[] = [
  { icon: ClipboardList, label: 'Planeación', sub: 'Alcance y tareas', tone: 'violet' },
  { icon: Hammer, label: 'En progreso', sub: 'Manos a la obra', tone: 'teal' },
  { icon: Eye, label: 'Revisión', sub: 'QA y ajustes', tone: 'violet' },
  { icon: Rocket, label: 'Entregado', sub: 'Cliente feliz', tone: 'teal' },
];

/* Gradiente de marca reutilizable: violet → teal */
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

export function Landing() {
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
            <a href="#problema" className="transition-colors hover:text-foreground">Problema</a>
            <a href="#features" className="transition-colors hover:text-foreground">Capacidades</a>
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

      {/* ── Hero (2-col en lg+: copy izq, mockup der) ── */}
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-20 md:pt-28">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
          {/* Copy */}
          <motion.div
            initial="hidden"
            animate="show"
            transition={{ staggerChildren: 0.1 }}
            className="text-center lg:text-left"
          >
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/[0.08] px-3.5 py-1.5 text-xs font-medium text-primary"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              CRM con IA · hecho para agencias de LatAm
            </motion.div>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="mt-7 text-balance text-5xl font-extrabold leading-[0.98] tracking-tight md:text-6xl xl:text-7xl"
            >
              Caza clientes como un <span className={GRAD}>halcón</span>.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground lg:mx-0"
            >
              HalcónOS descubre negocios reales con Google Maps, escribe tus propuestas con IA y unifica
              WhatsApp, email y pipeline en un solo lugar. Sin Excel. Sin chats sueltos. Sin excusas.
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
            >
              <MagneticButton href="/sign-up">
                Empezar gratis <ArrowRight className="size-4" />
              </MagneticButton>
              <MagneticButton href="#features" variant="outline">
                Ver cómo funciona
              </MagneticButton>
            </motion.div>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="mt-4 text-xs text-muted-foreground"
            >
              14 días gratis · Sin tarjeta · Cancela cuando quieras
            </motion.p>
          </motion.div>

          {/* Mockup */}
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
          {STATS.map((s) => (
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
            <Eyebrow color="text-muted-foreground">El costo del desorden</Eyebrow>
          </motion.div>
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
            El desorden te cuesta <span className={GRAD}>ventas</span>
          </motion.h2>
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="mt-4 text-muted-foreground">
            Cada lead que se pierde entre hojas de cálculo, chats y notas sueltas es plata que dejas sobre la mesa.
            HalcónOS lo unifica todo.
          </motion.p>
        </motion.div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {/* SIN sistema — gris desaturado, sin vida */}
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
                  <X className="mt-0.5 size-4 shrink-0 text-muted-foreground/70" /> {t}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* CON HalcónOS — violet vivo + glow teal */}
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
          <Eyebrow>Capacidades</Eyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
            Tres pilares, un flujo <span className={GRAD}>imparable</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Diseñado para agencias que cazan negocios locales y los llevan de prospecto a cliente.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ staggerChildren: 0.1 }}
          className="mt-14 grid gap-5 md:grid-cols-3"
        >
          {FEATURES.map(({ icon: Icon, title, body, tone, n }) => (
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
              <Target className="size-3.5" /> Trazabilidad de extremo a extremo
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight md:text-4xl">
              Del lead al proyecto entregado, <span className={GRAD}>sin perder nada</span>
            </h2>
          </div>

          <div className="mt-12 text-center">
            <Eyebrow>Fase 1 · Pipeline de venta</Eyebrow>
          </div>
          <div className="mt-5">
            <FlowRow steps={SALES_FLOW} />
          </div>

          <div className="my-6 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-teal-400/60" />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/[0.08] px-3 py-1 text-xs font-medium text-teal-600 dark:text-teal-300">
              <GitBranch className="size-3.5" /> Conversión en 1 tap, sin perder contexto
            </span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-teal-400/60" />
          </div>

          <div className="text-center">
            <Eyebrow color="text-teal-600 dark:text-teal-300">Fase 2 · Ciclo del proyecto</Eyebrow>
          </div>
          <div className="mt-5">
            <FlowRow steps={PROJECT_FLOW} />
          </div>
        </div>
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
            <TrendingUp className="size-4" /> Convierte más, persigue menos
          </div>
          <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight md:text-5xl">
            Deja de perseguir leads. Empieza a <span className={GRAD}>cerrarlos</span>.
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

      {/* ── Footer ── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-10 text-sm text-muted-foreground sm:flex-row">
          <Wordmark logoClassName="size-5" textClassName="text-sm" />
          <p>© {new Date().getFullYear()} JALLER.DEV · Sales OS para agencias</p>
        </div>
      </footer>
    </div>
  );
}
