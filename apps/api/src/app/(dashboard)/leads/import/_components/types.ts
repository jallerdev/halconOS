export type TargetField =
  | 'businessName'
  | 'contactName'
  | 'phone'
  | 'email'
  | 'source'
  | 'estimatedValue'
  | 'status'
  | 'tags';

export const TARGET_FIELDS: { value: TargetField; label: string; required?: boolean }[] = [
  { value: 'businessName', label: 'Negocio', required: true },
  { value: 'contactName', label: 'Contacto' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'email', label: 'Email' },
  { value: 'source', label: 'Origen' },
  { value: 'estimatedValue', label: 'Valor estimado' },
  { value: 'status', label: 'Estado' },
  { value: 'tags', label: 'Etiquetas' },
];

const ALIASES: Record<TargetField, string[]> = {
  businessName: [
    'nombre',
    'negocio',
    'business',
    'business name',
    'razon social',
    'empresa',
    'compania',
    'comercio',
  ],
  contactName: ['contacto', 'nombre contacto', 'persona', 'contact', 'contact name'],
  phone: ['telefono', 'celular', 'movil', 'phone', 'whatsapp', 'tel'],
  email: ['email', 'correo', 'e-mail', 'mail'],
  source: ['fuente', 'origen', 'source'],
  estimatedValue: ['valor', 'monto', 'valor estimado', 'estimated value', 'precio'],
  status: ['estado', 'status', 'etapa'],
  tags: ['etiquetas', 'tags', 'sector', 'categoria', 'rubro'],
};

const normalize = (h: string) =>
  h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

export function autoMap(headers: string[]): Record<TargetField, number | null> {
  const result: Record<TargetField, number | null> = {
    businessName: null,
    contactName: null,
    phone: null,
    email: null,
    source: null,
    estimatedValue: null,
    status: null,
    tags: null,
  };
  const normalized = headers.map(normalize);
  for (const { value } of TARGET_FIELDS) {
    const aliases = ALIASES[value];
    const idx = normalized.findIndex((h) => aliases.some((a) => h.includes(a)));
    if (idx !== -1) result[value] = idx;
  }
  return result;
}

export function projectRow(
  row: (string | number | null | undefined)[],
  mapping: Record<TargetField, number | null>,
): Record<TargetField, unknown> {
  const out = {} as Record<TargetField, unknown>;
  for (const { value } of TARGET_FIELDS) {
    const col = mapping[value];
    out[value] = col == null ? undefined : row[col];
  }
  return out;
}
