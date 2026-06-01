'use client';

import { useId } from 'react';

import { cn } from '~/lib/utils';

type Props = {
  data: number[];
  // Por default ocupa todo el ancho del contenedor (preserveAspectRatio="none"),
  // como el Sparkline de referencia del design handoff.
  height?: number;
  strokeWidth?: number;
  // Trazo + área usan currentColor por default — pásale tu accent vía
  // `text-violet`, `text-teal`, etc. y se hereda. Permite sobrescribir
  // a un HSL/HEX literal con la prop `color` si necesitas algo arbitrario.
  color?: string;
  fill?: boolean;
  className?: string;
};

// Sparkline custom — sustituye a Tremor SparkAreaChart. Render SVG puro
// inline (sin libs externas), gradient opacity .28 → 0, trazo redondeado.
// El viewBox es fijo (120x{height}) pero el SVG se estira con `width=100%`
// y `preserveAspectRatio="none"` — así un KPI ancho llena el espacio sin
// distorsionar el grosor del trazo.
export function Sparkline({
  data,
  height = 38,
  strokeWidth = 2,
  color = 'currentColor',
  fill = true,
  className,
}: Props) {
  const reactId = useId();
  if (!data.length) return null;

  const w = 120;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
    const y = height - 4 - ((v - min) / range) * (height - 8);
    return [x, y] as const;
  });

  const line = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
  const area = `${line} L${w} ${height} L0 ${height} Z`;
  const gid = `hxspark-${reactId.replace(/[:]/g, '')}`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className={cn('block', className)}
      style={{ color }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        // vector-effect previene que `preserveAspectRatio="none"` distorsione
        // el grosor del trazo al estirarse horizontalmente.
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
