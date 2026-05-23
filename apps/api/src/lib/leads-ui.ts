export function waLink(phoneIntl: string | null, phone: string | null): string | null {
  const raw = phoneIntl ?? phone;
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : null;
}
