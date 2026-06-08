# Microservicio de scraping para HalcónOS.
# Imagen base con Python 3.12 + Chromium pre-instalado (vía Playwright).
# Render free tier (512MB RAM, 0.1 CPU) maneja ~1 scrape concurrente.

FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8000

WORKDIR /app

# Dependencias del sistema necesarias por Chromium (Playwright las instala con
# `playwright install-deps` también, pero las pre-cargamos para ahorrar build time).
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    wget \
    gnupg \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Playwright instala Chromium en el directorio del usuario por defecto. Lo dejamos
# en /ms-playwright para que esté en una ruta predecible y se cachee mejor en
# capas de Docker.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN playwright install chromium

COPY . .

EXPOSE 8000

# uvicorn con un solo worker — Render free tier no aguanta más por el RAM cap.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
