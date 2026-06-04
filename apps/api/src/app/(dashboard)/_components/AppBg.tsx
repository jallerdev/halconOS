// Fondo atmosférico del dashboard — dos blobs blur fijos (violet arriba-izq,
// teal abajo-der) + grid sutil enmascarado desde arriba. Match con la landing.
// Los blobs viven en globals.css (.app-bg + ::before/::after); el grid se
// renderiza inline porque usa CSS vars que cambian con el theme.
export function AppBg() {
  return (
    <>
      <div className="app-bg" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, hsl(var(--foreground) / 0.045) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground) / 0.045) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(80% 55% at 50% 0%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(80% 55% at 50% 0%, black, transparent)',
        }}
      />
    </>
  );
}
