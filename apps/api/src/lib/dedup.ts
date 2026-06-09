// Helper para deduplicar leads por contenido (no solo por placeId).
//
// Problema: el mismo negocio en Google Places vs OpenStreetMap vs Páginas
// Amarillas tiene IDs distintos. Si dedupeamos solo por placeId, el usuario
// puede importar "Cafetería El Molino" tres veces sin darse cuenta.
//
// Solución: computar una clave estable a partir de los datos que SÍ son
// consistentes entre fuentes — nombre, primer segmento de dirección y
// teléfono (normalizados). Si dos leads coinciden en esa clave, es el mismo
// negocio aunque venga de fuentes distintas.
//
// La clave se almacena en `leads.dedupe_key` con índice (orgId, dedupeKey)
// para que la verificación al importar sea un único SELECT.

const NFD_DIACRITIC = /[̀-ͯ]/g;

function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(NFD_DIACRITIC, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function buildDedupeKey(input: {
  name: string | null | undefined;
  address?: string | null;
  phone?: string | null;
}): string | null {
  if (!input.name) return null;
  // Primer segmento de la dirección antes de la coma — más estable que la
  // dirección completa porque distintas fuentes formatean ciudad/país distinto.
  const addrFirst = input.address ? input.address.split(',')[0]!.trim() : '';
  // Solo dígitos del teléfono: ignora formato (+57, espacios, guiones).
  const phoneDigits = input.phone ? input.phone.replace(/\D/g, '') : '';
  return `${norm(input.name)}|${norm(addrFirst)}|${phoneDigits}`;
}
