# Google Search Console — Playbook práctico

> GSC es la única fuente oficial de **qué está buscando la gente que llega a tu sitio
> desde Google**. Si lo configuras bien, te dice EXACTAMENTE qué contenido escribir
> next y dónde está la oportunidad orgánica.

## Setup inicial (15 min, una sola vez)

### 1. Verificar dominio

1. Ve a [search.google.com/search-console](https://search.google.com/search-console).
2. Click &quot;Add property&quot;.
3. Selecciona &quot;Domain&quot; (NO &quot;URL prefix&quot;) — es mejor porque cubre `www`, no-www, http, https.
4. Pon `halcon.jvagencia.com` (el dominio completo).
5. Google te pide un TXT record en DNS. Lo pones en tu DNS provider (Cloudflare/Vercel/Namecheap).
6. Verificas. Si tarda 5-10 min está bien.

### 2. Submit sitemap

1. En GSC, sidebar → &quot;Sitemaps&quot;.
2. Pega: `sitemap.xml`.
3. Submit. Google empezará a leerlo en 24-48h.

### 3. Inspect URL principal

1. Sidebar → &quot;URL Inspection&quot;.
2. Pega `https://halcon.jvagencia.com/`.
3. Click &quot;Request indexing&quot;.
4. Repite para `/blog` + cada post.

Esto acelera la primera indexación de días a horas.

## Métricas que importan (en orden)

### 1. Impressions

Cuántas veces apareciste en resultados de Google. Si crece linealmente, vas bien.
Si está plano por 3 semanas, hay problema (técnico o de contenido).

### 2. Clicks

Cuántas veces alguien hizo click en ti. Es lo que más importa porque indica que tu
título + description son atractivos.

### 3. CTR (Click-Through Rate)

Clicks / Impressions. Benchmarks:
- Posición 1 → 30-40%
- Posición 2 → 15-25%
- Posición 3 → 10-15%
- Posición 5 → 5-7%
- Posición 10 → 2-3%

**Si tu CTR está MUY abajo del benchmark para tu posición**, tu título o description
no son atractivos. Ahí ataca.

### 4. Average position

Posición promedio en SERPs. **No mires esto día a día — fluctúa**. Mira tendencia
mensual.

## Workflow semanal (15 min cada lunes)

### Paso 1: Performance report

1. GSC → Performance → Search results.
2. Selecciona últimos 3 meses.
3. Mira:
   - **Total clicks/impressions** vs período anterior.
   - **Top queries** — ¿qué buscan?
   - **Top pages** — ¿qué página recibe más?

### Paso 2: Identificar oportunidades

#### Tipo A: Queries con muchas impresiones pero pocos clicks

En la pestaña Queries:
1. Ordena por impressions descendente.
2. Filtra: CTR < 2%.
3. Mira posición promedio. Si está entre 5-15, **tu página está en la página 1 pero
   no convence**.

**Acción:** edita el título y description de la página para esa query. Usa la query
LITERALMENTE en el título (siempre que no sea forzado).

#### Tipo B: Queries con posición 11-20

Estos son los **&quot;quick wins&quot;**:
1. En Queries, ordena por position ascendente.
2. Filtra: position 11-20.
3. Estas queries necesitan UN empujoncito para entrar a la primera página.

**Acción:** identifica qué página está rankeando para esa query (Pages tab). Mejórala:
agrega 200-300 palabras más, internal links a otras de tus páginas, mejora el H1.

#### Tipo C: Queries que NO esperabas

A veces aparecen queries random — &quot;CRM para psicólogos&quot; o &quot;cómo importar
contactos desde Excel&quot;. Si tienen impressions, **escribe un post dedicado a esa
query**. Es demanda real que no estás atendiendo.

### Paso 3: Coverage (Indexing)

1. GSC → Coverage.
2. Mira &quot;Pages&quot;:
   - **Indexed**: deberían ser todas tus páginas públicas (~6 actualmente).
   - **Not indexed**: revisa por qué — puede ser legítimo (rutas dashboard
     bloqueadas en robots.txt) o un error.

Si tu landing principal aparece como &quot;Not indexed&quot;: emergency. Investiga.

### Paso 4: Experience (Core Web Vitals)

1. GSC → Experience → Core Web Vitals.
2. Verifica que TODAS tus páginas están en &quot;Good&quot;.

Si alguna está en &quot;Needs improvement&quot; o &quot;Poor&quot;:
- LCP > 2.5s → optimiza imágenes, fuentes, sin JS bloqueante.
- CLS > 0.1 → fuentes con `font-display: optional` + dimensions explícitas en imágenes.
- INP > 200ms → reduce JS de client-side, defer scripts no críticos.

## Cómo encontrar tu próximo blog post (data-driven)

Esta es la magia: **deja que GSC te diga qué escribir**.

### Método: Query mining

1. GSC → Performance → Queries.
2. Mira queries con impressions altas (>50) pero clicks bajos (<5).
3. Pregúntate: ¿tengo contenido que responde exactamente esa query?

**Ejemplo real para HalcónOS:**

| Query | Impressions | Clicks | ¿Tengo post? | Acción |
|---|---|---|---|---|
| &quot;crm gratis agencia&quot; | 240 | 3 | Parcial (landing) | Escribir post: &quot;Los 5 mejores CRMs gratis para agencias&quot; |
| &quot;como buscar leads google maps&quot; | 180 | 12 | ✅ Sí | Mejorar el existente |
| &quot;plantilla propuesta agencia&quot; | 90 | 8 | ✅ Sí | OK, posicionado |
| &quot;automatizar prospección&quot; | 65 | 0 | ❌ No | Escribir post |

Estás escribiendo en respuesta a demanda REAL, no a tu intuición. Mucho más efectivo.

## Errores que matan tu SEO

❌ **No verificar robots.txt**. Si bloquea Googlebot, no rankeas. NUNCA.
❌ **Cambiar URLs sin redirect 301**. Pierdes toda la autoridad acumulada.
❌ **Páginas con `noindex` por accidente**. Verifica meta robots en cada page.
❌ **Sitemap desactualizado**. Refresh cuando agregues/quites páginas.
❌ **Mismo title en múltiples páginas**. Cada page título único.
❌ **Title muy largo > 60 chars**. Google trunca.
❌ **Description muy corto < 100 chars**. Pierde oportunidad.

## Herramientas complementarias (gratis)

| Tool | Para qué | Free tier |
|---|---|---|
| **Bing Webmaster Tools** | Bing tráfico (5-10% de búsquedas) | Gratis completo |
| **Ahrefs Webmaster Tools** | Backlinks de tu dominio | Gratis para tu dominio |
| **PageSpeed Insights** | Core Web Vitals | Gratis ilimitado |
| **Rich Results Test** | Validar JSON-LD | Gratis ilimitado |
| **Schema Markup Validator** | Validar otros schemas | Gratis |

## Plan de los próximos 90 días

### Mes 1
- ✅ Setup GSC, submit sitemap, indexar todas las páginas.
- Esperar 2-3 semanas para data inicial.
- Revisar coverage para ningún error técnico.

### Mes 2
- Empezar workflow semanal (15 min cada lunes).
- Identificar 3 queries para mejorar.
- Editar título/description de páginas con CTR bajo.

### Mes 3
- Escribir 4 nuevos blog posts basados en data de GSC.
- Trackear si CTR + clicks crecen.
- Mejorar contenido existente con queries de posición 11-20.

## Bonus: Bing es low-effort, high-leverage

- Bing tiene 5-10% del mercado de búsquedas globales.
- Pero la competencia es INFINITAMENTE menor que en Google.
- Configurar Bing Webmaster Tools toma 5 min.
- Submit el mismo sitemap.
- En 1 mes vas a rankear top 3 para queries donde en Google estás en página 3.

**Setup:**
1. [bing.com/webmasters](https://www.bing.com/webmasters).
2. &quot;Add a Site&quot; → pega tu URL.
3. Verifica con XML file (como GSC).
4. Submit sitemap.
5. Done.
