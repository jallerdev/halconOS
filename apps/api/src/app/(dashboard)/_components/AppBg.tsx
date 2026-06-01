// Fondo atmosférico del dashboard — dos blobs blur fijos detrás de TODO
// el contenido. Los estilos viven en globals.css (.app-bg + ::before/::after)
// para evitar usar `style` en cada render y aprovechar que `inset: 0` +
// `pointer-events: none` ya garantizan que no interfiere con clicks.
export function AppBg() {
  return <div className="app-bg" aria-hidden />;
}
