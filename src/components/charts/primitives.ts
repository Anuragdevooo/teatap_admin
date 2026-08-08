/**
 * Chart plumbing shared by every chart in the system.
 *
 * Charts are hand-rolled SVG rather than a charting library: the surface we
 * need is small (four forms), and owning the markup is what lets every mark
 * inherit the theme tokens and re-colour instantly on a light/dark flip —
 * something a canvas-based library cannot do without a re-render pass.
 */

/** Fixed categorical order. Never cycled — a 9th series folds into "Other". */
export const SERIES_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const;

export const seriesColor = (index: number) =>
  SERIES_COLORS[index] ?? 'var(--chart-axis)';

export interface Scale {
  (value: number): number;
}

/** Maps a data domain onto a pixel range. */
export const linearScale = (
  domain: [number, number],
  range: [number, number],
): Scale => {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (value: number) => r0 + ((value - d0) / span) * (r1 - r0);
};

/**
 * "Nice" axis maximum — rounds up to 1/2/5×10ⁿ so tick labels read as round
 * numbers instead of 8,437.
 */
export function niceMax(value: number, ticks = 4): number {
  if (value <= 0) return ticks;
  const rough = value / ticks;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude * ticks;
}

export const ticksFor = (max: number, count = 4) =>
  Array.from({ length: count + 1 }, (_, i) => (max / count) * i);

/**
 * Catmull–Rom → cubic Bézier. Gives a smooth trend line without the
 * overshoot of a naive spline, which would invent values below zero.
 */
export function smoothPath(points: Array<[number, number]>): string {
  if (points.length === 0) return '';
  if (points.length < 3) return points.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');

  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const t = 0.2; // low tension keeps the curve honest to the data
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Rounded only at the data end, anchored square to the baseline. */
export function barPath(x: number, y: number, w: number, h: number, r = 4): string {
  const radius = Math.min(r, w / 2, Math.max(h, 0));
  if (h <= 0.5) return '';
  return [
    `M${x},${y + h}`,
    `L${x},${y + radius}`,
    `Q${x},${y} ${x + radius},${y}`,
    `L${x + w - radius},${y}`,
    `Q${x + w},${y} ${x + w},${y + radius}`,
    `L${x + w},${y + h}`,
    'Z',
  ].join(' ');
}

/** Arc segment for the donut, in SVG path form. */
export function arcPath(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  startAngle: number,
  endAngle: number,
): string {
  const polar = (r: number, a: number): [number, number] => [
    cx + r * Math.cos(a - Math.PI / 2),
    cy + r * Math.sin(a - Math.PI / 2),
  ];
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  const [ox1, oy1] = polar(outer, startAngle);
  const [ox2, oy2] = polar(outer, endAngle);
  const [ix2, iy2] = polar(inner, endAngle);
  const [ix1, iy1] = polar(inner, startAngle);
  return [
    `M${ox1},${oy1}`,
    `A${outer},${outer} 0 ${large} 1 ${ox2},${oy2}`,
    `L${ix2},${iy2}`,
    `A${inner},${inner} 0 ${large} 0 ${ix1},${iy1}`,
    'Z',
  ].join(' ');
}
