// FAQ canónico de la landing. Fuente única consumida por:
//   - `Landing.tsx` para renderizar la sección visible.
//   - `page.tsx` para emitir el JSON-LD FAQPage (rich snippet en SERPs).
//
// Cuando agregues una pregunta, hazlo aquí y se refleja en ambos lados sin
// drift. Las respuestas son texto plano (sin markdown) para que el schema
// quede limpio.
export type FaqItem = { q: string; a: string };

export const FAQ: FaqItem[] = [
  {
    q: '¿Qué es HalcónOS y para quién está hecho?',
    a: 'HalcónOS es un CRM de ventas con IA pensado para agencias creativas, consultoras y freelancers de LatAm. Combina descubrimiento de leads (Google Maps), redacción de propuestas con IA y un pipeline unificado de WhatsApp y email — todo en una sola app web.',
  },
  {
    q: '¿Tiene plan gratuito? ¿Necesito tarjeta para probarlo?',
    a: '14 días gratis, sin tarjeta de crédito. Puedes cancelar cuando quieras. Una vez termina el trial, eliges si continuar con un plan de pago.',
  },
  {
    q: '¿Cómo descubre HalcónOS leads nuevos?',
    a: 'Usamos Google Places para buscar negocios reales por ciudad, categoría y filtros como "sin web", rating mínimo o solo operativos. Con un par de clics seleccionas los que te interesan y los importas al pipeline como leads NEW.',
  },
  {
    q: '¿Funciona en mi país? ¿O solo en Colombia?',
    a: 'La búsqueda de leads es mundial: puedes cazar negocios en cualquier ciudad del mundo. La interfaz está en español y el dominio está pensado para LatAm, pero el producto funciona desde cualquier país.',
  },
  {
    q: '¿Qué IA usan para las propuestas?',
    a: 'Usamos Google Gemini para generar estrategia de venta, propuesta comercial y el primer mensaje a partir del contexto del lead (su negocio, sector, web, rating). Tú revisas y editas antes de enviar — la IA es borrador, no piloto automático.',
  },
  {
    q: '¿Cómo funciona la conexión con WhatsApp?',
    a: 'Para mensajes individuales abrimos el chat en WhatsApp con el texto pre-rellenado. La integración deja registro del contacto en el lead automáticamente. WhatsApp Business API oficial está en roadmap.',
  },
  {
    q: '¿Puedo importar mis leads existentes desde Excel o un CRM viejo?',
    a: 'Sí. El wizard de importación acepta CSV y XLSX con mapeo flexible de columnas. Detecta duplicados por email y teléfono para no crear leads repetidos.',
  },
  {
    q: '¿Mis datos están seguros y son privados?',
    a: 'Cada workspace está aislado por organización (multi-tenant). Las credenciales sensibles como tokens de Google se cifran en reposo con AES-256-GCM. No vendemos ni compartimos datos con terceros.',
  },
];
