import { ImageResponse } from 'next/og';

import { SITE } from '~/lib/site';

// Imagen de previsualización social (1200×630). Next.js la inyecta
// automáticamente como og:image y twitter:image.
export const alt = `${SITE.name} — CRM de ventas con IA`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0b0b12 0%, #1a1430 55%, #0d1f1d 100%)',
          padding: '80px',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: '#7c5cff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 38,
              fontWeight: 800,
            }}
          >
            H
          </div>
          <span style={{ fontSize: 40, fontWeight: 700 }}>{SITE.name}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <span style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
            Caza clientes como un halcón.
          </span>
          <span style={{ fontSize: 34, color: '#c9c5e0', maxWidth: 940 }}>
            CRM de ventas con IA: leads con Google, propuestas con IA y WhatsApp, email y
            pipeline en un solo lugar.
          </span>
        </div>

        <span style={{ fontSize: 26, color: '#8fe3d6' }}>halcon.jvagencia.com · by JALLER.DEV</span>
      </div>
    ),
    { ...size },
  );
}
