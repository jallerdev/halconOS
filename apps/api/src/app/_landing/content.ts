// Contenido del landing por idioma. Fuente única para Landing.tsx + FAQ + JSON-LD.
// Si agregas un campo aquí, actualízalo en AMBAS variantes (es + en).

import {
  Boxes,
  ClipboardList,
  Eye,
  FileText,
  Hammer,
  KanbanSquare,
  MapPin,
  MessageCircle,
  Rocket,
  Sparkles,
  Star,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type Locale = 'es' | 'en';

export type Tone = 'violet' | 'teal';

export type Feature = {
  icon: LucideIcon;
  tone: Tone;
  n: string;
  title: string;
  body: string;
};

export type Step = {
  icon: LucideIcon;
  label: string;
  sub: string;
  tone: Tone;
};

export type FaqItem = { q: string; a: string };

export type LandingContent = {
  locale: Locale;
  // Nav
  nav: { problem: string; features: string; flow: string; faq: string; blog: string; enter: string; tryFree: string };
  // Hero
  hero: {
    badge: string;
    h1: { before: string; highlight: string; after: string };
    sub: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trustLine: string;
  };
  // Stats
  stats: { value: string; label: string }[];
  // Problem
  problem: {
    eyebrow: string;
    titleStart: string;
    titleHighlight: string;
    lead: string;
    without: { title: string; bullets: string[] };
    with: { title: string; bullets: string[] };
  };
  // Features
  features: {
    eyebrow: string;
    titleStart: string;
    titleHighlight: string;
    lead: string;
    items: Feature[];
  };
  // Flow
  flow: {
    chip: string;
    titleStart: string;
    titleHighlight: string;
    phase1Eyebrow: string;
    bridge: string;
    phase2Eyebrow: string;
    sales: Step[];
    project: Step[];
  };
  // FAQ
  faq: {
    eyebrow: string;
    title: string;
    sub: string;
    items: FaqItem[];
  };
  // CTA
  cta: {
    chip: string;
    titleStart: string;
    titleHighlight: string;
    titleEnd: string;
    body: string;
    button: string;
  };
  // Footer
  footer: { tagline: string };
};

// ─────────────────────────────── Español ───────────────────────────────

const ES: LandingContent = {
  locale: 'es',
  nav: {
    problem: 'Problema',
    features: 'Capacidades',
    flow: 'Cómo funciona',
    faq: 'FAQ',
    blog: 'Blog',
    enter: 'Entrar',
    tryFree: 'Probar gratis',
  },
  hero: {
    badge: 'CRM con IA · hecho para agencias de LatAm',
    h1: { before: 'Caza leads y cierra ventas con ', highlight: 'IA', after: '' },
    sub: 'El CRM para agencias: descubre negocios con Google, escribe tus propuestas con IA y unifica WhatsApp, email y pipeline en un solo lugar. Sin Excel. Sin chats sueltos. Sin excusas.',
    ctaPrimary: 'Empezar gratis',
    ctaSecondary: 'Ver cómo funciona',
    trustLine: '14 días gratis · Sin tarjeta · Cancela cuando quieras',
  },
  stats: [
    { value: '5 min', label: 'de prospecto a primer mensaje' },
    { value: '+38%', label: 'tasa de cierre con propuestas IA' },
    { value: '3→1', label: 'WhatsApp · Email · Pipeline unificados' },
    { value: '⌘K', label: 'todo a un atajo de distancia' },
  ],
  problem: {
    eyebrow: 'El costo del desorden',
    titleStart: 'El desorden te cuesta ',
    titleHighlight: 'ventas',
    lead: 'Cada lead que se pierde entre hojas de cálculo, chats y notas sueltas es plata que dejas sobre la mesa. HalcónOS lo unifica todo.',
    without: {
      title: 'Sin un sistema',
      bullets: [
        'Prospectos dispersos en Excel, WhatsApp y la memoria.',
        'Propuestas escritas desde cero cada vez, horas perdidas.',
        'Nunca sabes qué lead vale más ni en qué etapa está.',
        'El contexto de la venta se pierde al arrancar el proyecto.',
      ],
    },
    with: {
      title: 'Con HalcónOS',
      bullets: [
        'Un pipeline único con scoring que prioriza por ti.',
        'Propuestas y mensajes generados con IA en segundos.',
        'Visualizas el embudo completo de un vistazo.',
        'El lead ganado se vuelve proyecto sin perder nada.',
      ],
    },
  },
  features: {
    eyebrow: 'Capacidades',
    titleStart: 'Tres pilares, un flujo ',
    titleHighlight: 'imparable',
    lead: 'Diseñado para agencias que cazan negocios locales y los llevan de prospecto a cliente.',
    items: [
      { icon: MapPin, tone: 'violet', n: '01', title: 'Caza leads con Google', body: 'Encuentra negocios reales por ciudad y categoría con Google Places. Filtra los que no tienen web, los mejor calificados — y mándalos directo a tu pipeline.' },
      { icon: Sparkles, tone: 'teal', n: '02', title: 'Propuestas con IA', body: 'Estrategia de venta, propuesta comercial y el primer mensaje perfecto en segundos. La IA hace el borrador; tú cierras el trato.' },
      { icon: MessageCircle, tone: 'violet', n: '03', title: 'Conversación multicanal', body: 'WhatsApp y Email sincronizados con cada lead. Toda la conversación queda en su contexto — sin saltar entre apps, sin perder hilos.' },
      { icon: KanbanSquare, tone: 'teal', n: '04', title: 'Pipeline + Inbox personal', body: 'Kanban configurable por servicio, scoring automático, asignación por miembro y vista "Mis leads" para que cada vendedor trabaje sin ruido.' },
      { icon: FileText, tone: 'violet', n: '05', title: 'Propuestas firmables', body: 'Crea propuestas con line items, envíalas con un link público y deja que el cliente firme online. PDF generado, contrato cerrado.' },
      { icon: Boxes, tone: 'teal', n: '06', title: 'De lead a proyecto en 1 tap', body: 'Cuando ganas el deal, el lead se vuelve proyecto con todo el contexto. Tareas, deadlines, facturación — sin retipear nada.' },
    ],
  },
  flow: {
    chip: 'Trazabilidad de extremo a extremo',
    titleStart: 'Del lead al proyecto entregado, ',
    titleHighlight: 'sin perder nada',
    phase1Eyebrow: 'Fase 1 · Pipeline de venta',
    bridge: 'Conversión en 1 tap, sin perder contexto',
    phase2Eyebrow: 'Fase 2 · Ciclo del proyecto',
    sales: [
      { icon: Zap, label: 'Caza el lead', sub: 'Negocio sin web', tone: 'violet' },
      { icon: Sparkles, label: 'Propón con IA', sub: 'Borrador en segundos', tone: 'teal' },
      { icon: Star, label: 'Gana la venta', sub: 'Estado Ganado', tone: 'violet' },
      { icon: Boxes, label: 'Crea el proyecto', sub: '1 tap, con contexto', tone: 'teal' },
    ],
    project: [
      { icon: ClipboardList, label: 'Planeación', sub: 'Alcance y tareas', tone: 'violet' },
      { icon: Hammer, label: 'En progreso', sub: 'Manos a la obra', tone: 'teal' },
      { icon: Eye, label: 'Revisión', sub: 'QA y ajustes', tone: 'violet' },
      { icon: Rocket, label: 'Entregado', sub: 'Cliente feliz', tone: 'teal' },
    ],
  },
  faq: {
    eyebrow: 'Preguntas frecuentes',
    title: 'Resolvemos tus dudas',
    sub: 'Si te queda alguna duda, escríbenos — respondemos personalmente.',
    items: [
      { q: '¿Qué es HalcónOS y para quién está hecho?', a: 'HalcónOS es un CRM de ventas con IA pensado para agencias creativas, consultoras y freelancers de LatAm. Combina descubrimiento de leads (Google Maps), redacción de propuestas con IA y un pipeline unificado de WhatsApp y email — todo en una sola app web.' },
      { q: '¿Tiene plan gratuito? ¿Necesito tarjeta para probarlo?', a: '14 días gratis, sin tarjeta de crédito. Puedes cancelar cuando quieras. Una vez termina el trial, eliges si continuar con un plan de pago.' },
      { q: '¿Cómo descubre HalcónOS leads nuevos?', a: 'Usamos Google Places para buscar negocios reales por ciudad, categoría y filtros como "sin web", rating mínimo o solo operativos. Con un par de clics seleccionas los que te interesan y los importas al pipeline como leads NEW.' },
      { q: '¿Funciona en mi país? ¿O solo en Colombia?', a: 'La búsqueda de leads es mundial: puedes cazar negocios en cualquier ciudad del mundo. La interfaz está en español y el dominio está pensado para LatAm, pero el producto funciona desde cualquier país.' },
      { q: '¿Qué IA usan para las propuestas?', a: 'Usamos Google Gemini para generar estrategia de venta, propuesta comercial y el primer mensaje a partir del contexto del lead (su negocio, sector, web, rating). Tú revisas y editas antes de enviar — la IA es borrador, no piloto automático.' },
      { q: '¿Cómo funciona la conexión con WhatsApp?', a: 'Para mensajes individuales abrimos el chat en WhatsApp con el texto pre-rellenado. La integración deja registro del contacto en el lead automáticamente. WhatsApp Business API oficial está en roadmap.' },
      { q: '¿Puedo importar mis leads existentes desde Excel o un CRM viejo?', a: 'Sí. El wizard de importación acepta CSV y XLSX con mapeo flexible de columnas. Detecta duplicados por email y teléfono para no crear leads repetidos.' },
      { q: '¿Mis datos están seguros y son privados?', a: 'Cada workspace está aislado por organización (multi-tenant). Las credenciales sensibles como tokens de Google se cifran en reposo con AES-256-GCM. No vendemos ni compartimos datos con terceros.' },
    ],
  },
  cta: {
    chip: 'Convierte más, persigue menos',
    titleStart: 'Deja de perseguir leads. Empieza a ',
    titleHighlight: 'cerrarlos',
    titleEnd: '.',
    body: 'Tu pipeline, tus propuestas y tus proyectos en un solo lugar. Entra y toma el control hoy.',
    button: 'Entrar a HalcónOS',
  },
  footer: { tagline: 'Sales OS para agencias' },
};

// ─────────────────────────────── English ───────────────────────────────

const EN: LandingContent = {
  locale: 'en',
  nav: {
    problem: 'Problem',
    features: 'Features',
    flow: 'How it works',
    faq: 'FAQ',
    blog: 'Blog',
    enter: 'Sign in',
    tryFree: 'Try free',
  },
  hero: {
    badge: 'AI CRM · built for agencies in LatAm',
    h1: { before: 'Hunt leads and close deals with ', highlight: 'AI', after: '' },
    sub: 'The CRM for agencies: discover businesses with Google, write proposals with AI, and unify WhatsApp, email, and pipeline in one place. No Excel. No scattered chats. No excuses.',
    ctaPrimary: 'Start free',
    ctaSecondary: 'See how it works',
    trustLine: '14 days free · No card · Cancel anytime',
  },
  stats: [
    { value: '5 min', label: 'from prospect to first message' },
    { value: '+38%', label: 'close rate with AI proposals' },
    { value: '3→1', label: 'WhatsApp · Email · Pipeline unified' },
    { value: '⌘K', label: 'everything one shortcut away' },
  ],
  problem: {
    eyebrow: 'The cost of chaos',
    titleStart: 'Disorder costs you ',
    titleHighlight: 'sales',
    lead: 'Every lead lost between spreadsheets, chats, and sticky notes is money left on the table. HalcónOS unifies it all.',
    without: {
      title: 'Without a system',
      bullets: [
        'Prospects scattered in Excel, WhatsApp, and your memory.',
        'Proposals written from scratch every time — hours wasted.',
        "You never know which lead is worth more or what stage it's in.",
        'Sales context disappears the moment the project starts.',
      ],
    },
    with: {
      title: 'With HalcónOS',
      bullets: [
        'One pipeline with scoring that prioritizes for you.',
        'Proposals and messages generated with AI in seconds.',
        'See the full funnel at a glance.',
        'A won lead becomes a project without losing anything.',
      ],
    },
  },
  features: {
    eyebrow: 'Features',
    titleStart: 'Three pillars, one ',
    titleHighlight: 'unstoppable flow',
    lead: 'Built for agencies hunting local businesses and turning them into clients.',
    items: [
      { icon: MapPin, tone: 'violet', n: '01', title: 'Hunt leads with Google', body: 'Find real businesses by city and category with Google Places. Filter by no website, top-rated — and send them straight to your pipeline.' },
      { icon: Sparkles, tone: 'teal', n: '02', title: 'AI proposals', body: 'Sales strategy, commercial proposal, and the perfect first message in seconds. AI drafts; you close the deal.' },
      { icon: MessageCircle, tone: 'violet', n: '03', title: 'Multichannel conversations', body: 'WhatsApp and Email synced with each lead. The whole conversation stays in context — no app-switching, no lost threads.' },
      { icon: KanbanSquare, tone: 'teal', n: '04', title: 'Pipeline + Personal inbox', body: 'Configurable Kanban by service, automatic scoring, per-member assignment, and a "My leads" view so each rep works without noise.' },
      { icon: FileText, tone: 'violet', n: '05', title: 'Signable proposals', body: 'Create proposals with line items, send them via a public link, and let the client sign online. PDF generated, contract closed.' },
      { icon: Boxes, tone: 'teal', n: '06', title: 'From lead to project in one tap', body: 'When you win the deal, the lead becomes a project with full context. Tasks, deadlines, billing — without retyping anything.' },
    ],
  },
  flow: {
    chip: 'End-to-end traceability',
    titleStart: 'From lead to delivered project, ',
    titleHighlight: 'without losing a thing',
    phase1Eyebrow: 'Phase 1 · Sales pipeline',
    bridge: 'Conversion in 1 tap, without losing context',
    phase2Eyebrow: 'Phase 2 · Project cycle',
    sales: [
      { icon: Zap, label: 'Hunt the lead', sub: 'Business without web', tone: 'violet' },
      { icon: Sparkles, label: 'Propose with AI', sub: 'Draft in seconds', tone: 'teal' },
      { icon: Star, label: 'Win the deal', sub: 'Status: Won', tone: 'violet' },
      { icon: Boxes, label: 'Create the project', sub: '1 tap, with context', tone: 'teal' },
    ],
    project: [
      { icon: ClipboardList, label: 'Planning', sub: 'Scope and tasks', tone: 'violet' },
      { icon: Hammer, label: 'In progress', sub: "Hands at work", tone: 'teal' },
      { icon: Eye, label: 'Review', sub: 'QA and tweaks', tone: 'violet' },
      { icon: Rocket, label: 'Delivered', sub: 'Happy client', tone: 'teal' },
    ],
  },
  faq: {
    eyebrow: 'Frequently asked',
    title: "We've got your answers",
    sub: "If anything is unclear, write to us — we reply personally.",
    items: [
      { q: 'What is HalcónOS and who is it for?', a: 'HalcónOS is an AI-powered sales CRM designed for creative agencies, consultancies, and freelancers in LatAm. It combines lead discovery (Google Maps), AI-written proposals, and a unified WhatsApp + email pipeline — all in one web app.' },
      { q: 'Is there a free plan? Do I need a credit card to try it?', a: '14 days free, no credit card. Cancel anytime. Once the trial ends, you choose whether to continue with a paid plan.' },
      { q: 'How does HalcónOS discover new leads?', a: "We use Google Places to find real businesses by city, category, and filters like 'no website', minimum rating, or operational-only. With a couple of clicks you pick the ones you want and import them as NEW leads." },
      { q: 'Does it work in my country? Or just Colombia?', a: 'Lead discovery is global: you can hunt businesses in any city worldwide. The interface is in Spanish and English, and the product works from any country.' },
      { q: 'Which AI do you use for proposals?', a: 'We use Google Gemini to generate sales strategy, commercial proposal, and first message based on the lead context (business, sector, web, rating). You review and edit before sending — AI drafts; it does not autopilot.' },
      { q: 'How does the WhatsApp integration work?', a: 'For individual messages we open the WhatsApp chat with the text pre-filled. The contact is automatically logged on the lead. The official WhatsApp Business API is on the roadmap.' },
      { q: 'Can I import my existing leads from Excel or an old CRM?', a: 'Yes. The import wizard accepts CSV and XLSX with flexible column mapping. It dedupes by email and phone so you do not create duplicates.' },
      { q: 'Is my data safe and private?', a: 'Each workspace is org-isolated (multi-tenant). Sensitive credentials like Google tokens are encrypted at rest with AES-256-GCM. We do not sell or share data with third parties.' },
    ],
  },
  cta: {
    chip: 'Convert more, chase less',
    titleStart: 'Stop chasing leads. Start ',
    titleHighlight: 'closing them',
    titleEnd: '.',
    body: 'Your pipeline, your proposals, and your projects in one place. Sign in and take control today.',
    button: 'Enter HalcónOS',
  },
  footer: { tagline: 'Sales OS for agencies' },
};

const REGISTRY: Record<Locale, LandingContent> = { es: ES, en: EN };

export function getLandingContent(locale: Locale): LandingContent {
  return REGISTRY[locale];
}
