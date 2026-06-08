# HalcónOS Scraper — Microservicio Python

Microservicio FastAPI con **ScrapeGraph AI + Playwright** para descubrir leads desde
sitios públicos (Páginas Amarillas, buscadores, URLs arbitrarias). Vive en el mismo
monorepo que la app principal pero corre en un proceso separado (Render free tier),
porque Python + Chromium no son compatibles con Vercel Serverless.

---

## Arquitectura

```
HalcónOS (Next.js en Vercel)
   │  tRPC discover.searchPlaces({ source: 'paginas-amarillas-co', query, city })
   ▼
apps/api/src/server/integrations/scrape/client.ts
   │  HTTP POST con X-Scraper-Secret
   ▼
halcon-scraper (Python en Render)
   ├─ FastAPI: /scrape
   ├─ ScrapeGraph AI: SmartScraperGraph / SearchGraph
   ├─ Playwright (Chromium headless) cuando hace falta JS
   ├─ Gemini API (LLM extraction)
   └─ Retorna PlaceResult[] (mismo shape que Google Places)
```

---

## Fuentes soportadas (v1)

| source | Descripción | Estrategia |
|---|---|---|
| `paginas-amarillas-co` | Páginas Amarillas Colombia | URL template → SmartScraperGraph |
| `bing-search` | Búsqueda genérica → top 3 resultados scrapeados | SearchGraph |
| `url` | Scrape de una URL arbitraria que provee el cliente | SmartScraperGraph |

Agregar más fuentes: editar `scrapers.py` y exponer el ID nuevo en
`apps/api/src/server/integrations/scrape/client.ts`.

---

## Desarrollo local

```bash
cd apps/scraper

# 1. Crea virtualenv y activa
python3.12 -m venv .venv
source .venv/bin/activate

# 2. Instala deps
pip install -r requirements.txt
playwright install chromium

# 3. Copia y rellena .env
cp .env.example .env
# Edita .env con tu GEMINI_API_KEY y SCRAPER_SHARED_SECRET

# 4. Levanta el servidor
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Endpoints:
- `GET http://localhost:8000/health` — healthcheck.
- `POST http://localhost:8000/scrape` — scraping.

Ejemplo curl:

```bash
curl -X POST http://localhost:8000/scrape \
  -H "Content-Type: application/json" \
  -H "X-Scraper-Secret: <tu-secret>" \
  -d '{
    "source": "paginas-amarillas-co",
    "query": "cafetería",
    "city": "Medellín",
    "max_results": 10
  }'
```

---

## Deploy a Render (free tier)

### Opción 1 — Blueprint (recomendado)

1. Push de este repo a GitHub.
2. En Render dashboard: **New → Blueprint**.
3. Selecciona el repo y la rama `main`.
4. Render detecta `apps/scraper/render.yaml` y crea el servicio.
5. En las env vars del servicio:
   - **`GEMINI_API_KEY`**: pega tu key (la misma de HalcónOS).
   - **`SCRAPER_SHARED_SECRET`**: Render genera uno automáticamente. **Copia este valor**
     — lo necesitas en HalcónOS.
6. Click **Apply**. Primera build tarda ~8-12 min (Docker + Playwright + Chromium).
7. Cuando termine, el servicio queda en: `https://halcon-scraper.onrender.com`

### Opción 2 — Manual

1. New → Web Service → Connect a Git repository.
2. Configuración:
   - **Root Directory**: `apps/scraper`
   - **Runtime**: Docker
   - **Plan**: Free
   - **Health Check Path**: `/health`
   - **Environment Variables**:
     - `GEMINI_API_KEY` = tu key
     - `SCRAPER_SHARED_SECRET` = genera con `openssl rand -hex 32`
     - `ALLOWED_ORIGINS` = `https://halcon.jvagencia.com`
3. Deploy.

### Configurar HalcónOS

En `apps/api/.env` (local) y en Vercel env vars (prod):

```
SCRAPER_SERVICE_URL=https://halcon-scraper.onrender.com
SCRAPER_SHARED_SECRET=<el-mismo-secret-que-pusiste-en-Render>
```

---

## Caveats del free tier de Render

| Caveat | Impacto | Mitigación |
|---|---|---|
| Sleep tras 15min sin tráfico | Primera request despierta el servicio (~30s cold start). | UI muestra "Buscando… puede tomar unos segundos". |
| 512MB RAM | Solo 1 scrape concurrente. | Queue del lado de HalcónOS si haces concurrencia. |
| 0.1 CPU | Scrapes lentos (~5-15s por página). | OK por el cache 24h en `discovered_places`. |
| 750h/mes | Si tienes <30 usuarios al día, no llegas al límite. | Si llegas: upgrade a Render Starter ($7/mes). |

---

## Troubleshooting

### "Playwright executable not found"
El Dockerfile instala Chromium en `/ms-playwright`. Si ves este error, revisa que la
env `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright` esté seteada en Render (debería venir
del Dockerfile).

### "GEMINI_API_KEY no configurada"
Falta la env var en Render. Settings → Environment → agrega el valor.

### Scrape devuelve `[]` siempre
- Posible bloqueo del sitio target. Revisa logs en Render.
- Posible cambio de layout. Edita el prompt en `scrapers.py:PLACES_EXTRACTION_PROMPT`
  o el URL template.

### Timeouts
- Cold start del servicio: 30s.
- El cliente Node de HalcónOS espera hasta 60s. Si necesitas más, ajusta el
  `AbortSignal.timeout()` en `apps/api/src/server/integrations/scrape/client.ts`.

---

## Costo real esperado

| Item | Por scrape | 1000 scrapes/mes |
|---|---|---|
| Gemini Flash (extracción LLM) | ~$0.0003 | ~$0.30 |
| Render free tier | $0 | $0 |
| **Total** | **~$0.0003** | **~$0.30/mes** |

Si pasas Render free → Render Starter ($7/mes), eliminas el sleep + tienes más RAM/CPU.
