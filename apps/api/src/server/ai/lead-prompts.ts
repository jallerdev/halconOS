import type { Lead } from '../db/schema';

export type AiKind = 'strategy' | 'proposal' | 'message' | 'landing';

const SYSTEM = `Eres un estratega de ventas experto de JALLER.DEV, una agencia colombiana que crea
páginas web profesionales para negocios locales. Tu trabajo es ayudar a vender sitios web a negocios
que HOY NO TIENEN página web. Escribes en español colombiano, directo, persuasivo y profesional,
sin relleno. Usas datos concretos del negocio (rating, reseñas, sector, ciudad) como palancas de venta.`;

// Neutraliza intentos de prompt-injection en datos scrapeados (nombre, dirección…):
// quita saltos de línea, markers de instrucciones y acota longitud.
function clean(v: string | null | undefined, max = 160): string {
  if (!v) return '';
  return v
    .replace(/[\r\n]+/g, ' ')
    .replace(/```/g, '')
    .replace(/\b(system|assistant|user)\s*:/gi, '')
    .replace(/(ignora|olvida|ignore|disregard)\b/gi, '·')
    .slice(0, max)
    .trim();
}

function businessContext(lead: Lead): string {
  return [
    `Negocio: ${clean(lead.businessName)}`,
    lead.category && `Sector: ${clean(lead.category, 60)}`,
    lead.city && `Ciudad: ${clean(lead.city, 60)}`,
    lead.address && `Dirección: ${clean(lead.address, 200)}`,
    lead.googleRating && `Rating en Google: ${lead.googleRating}/5`,
    lead.reviewCount != null && `Número de reseñas: ${lead.reviewCount}`,
    lead.priceLevel && `Nivel de precio: ${clean(lead.priceLevel, 40)}`,
    `Tiene sitio web: ${lead.hasWebsite ? 'Sí' : 'NO (esta es la oportunidad)'}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildPrompt(kind: AiKind, lead: Lead): { system: string; prompt: string } {
  const ctx = businessContext(lead);

  const prompts: Record<AiKind, string> = {
    strategy: `Analiza este negocio y crea una estrategia de venta para ofrecerle una página web.

${ctx}

Responde EXACTAMENTE en este formato (sin markdown, secciones separadas por "###"):

### ÁNGULO DE VENTA
(2-3 frases sobre cómo abordar a este negocio específico, usando su rating/reseñas/sector como gancho)

### DOLORES DEL NEGOCIO
(3-4 bullets de qué problemas tiene este negocio por NO tener web, específicos a su sector)

### PÁGINA SUGERIDA
(Qué tipo de página venderle y qué secciones clave debería tener para este sector)`,

    proposal: `Redacta una propuesta comercial breve y persuasiva para venderle una página web a este negocio.
Lista para enviar por correo o WhatsApp. Máximo 250 palabras. Incluye: saludo personalizado,
por qué necesitan web (usando sus datos), qué incluiría el sitio, y un llamado a la acción claro.

${ctx}`,

    message: `Escribe un mensaje corto de primer contacto en frío para WhatsApp (máximo 4 líneas).
Debe sonar humano y cercano (no robótico), mencionar algo específico del negocio (su buen rating
o reseñas), y terminar con una pregunta que invite a responder. Sin emojis excesivos.

${ctx}`,

    landing: `Genera el copy (textos) para la landing page que le venderías a este negocio.
Formato (secciones separadas por "###", sin markdown):

### HEADLINE
(título principal, máximo 8 palabras)

### SUBHEADLINE
(1 frase de apoyo)

### SECCIONES
(lista de 4-5 secciones recomendadas con una línea de copy de ejemplo cada una)

### CTA
(texto del botón de llamado a la acción)

${ctx}`,
  };

  return { system: SYSTEM, prompt: prompts[kind] };
}

export const AI_FIELD: Record<AiKind, 'aiSalesAngle' | 'aiProposal' | 'aiFirstMessage' | 'aiLandingCopy'> = {
  // strategy escribe en 3 campos; se maneja aparte. Aquí el campo "principal".
  strategy: 'aiSalesAngle',
  proposal: 'aiProposal',
  message: 'aiFirstMessage',
  landing: 'aiLandingCopy',
};
