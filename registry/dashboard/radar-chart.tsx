import { cn } from "@/lib/utils";

export interface RadarSeries {
  key: string;
  label: string;
}

export interface RadarChartProps {
  /** One row per axis: { axis: "Speed", a: 8, b: 6 }. */
  data: readonly Record<string, string | number>[];
  /** The key that names the axis in each row. */
  index: string;
  series: readonly RadarSeries[];
  /** The value at the outer ring. */
  max: number;
  label: string;
  /** Rings drawn inside, including the outer one. */
  rings?: number;
  className?: string;
}

const SHADES = [1, 0.45, 0.22];

/**
 * Several qualities at a glance: one spoke per axis, a filled shape per
 * series in the text colour and its shades, rings for scale. For comparing
 * plans, candidates or products on five to eight criteria. Screen readers
 * get the same numbers as a table.
 */
export function RadarChart({ data, index, series, max, label, rings = 4, className }: RadarChartProps) {
  const size = 320;
  const center = size / 2;
  const radius = center - 44;
  const count = data.length;
  const point = (axis: number, value: number) => {
    const angle = (axis / count) * Math.PI * 2 - Math.PI / 2;
    const r = (Math.min(value, max) / max) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };
  const ring = (fraction: number) => data.map((_, axis) => point(axis, max * fraction)).map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <figure data-slot="radar-chart" className={cn("relative grid justify-items-center gap-3", className)}>
      {series.length > 1 ? (
        <figcaption className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {series.map((s, i) => (
            <span key={s.key} className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-foreground" style={{ opacity: SHADES[i % SHADES.length] }} />{s.label}</span>
          ))}
        </figcaption>
      ) : null}
      <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full max-w-sm overflow-visible text-foreground" aria-hidden="true">
        {Array.from({ length: rings }, (_, i) => (i + 1) / rings).map((fraction) => (
          <polygon key={fraction} points={ring(fraction)} fill="none" stroke="currentColor" strokeOpacity={0.1} />
        ))}
        {data.map((row, axis) => {
          const end = point(axis, max);
          const labelAt = point(axis, max * 1.16);
          return (
            <g key={String(row[index])}>
              <line x1={center} y1={center} x2={end.x} y2={end.y} stroke="currentColor" strokeOpacity={0.1} />
              <text x={labelAt.x} y={labelAt.y} dy="0.32em" textAnchor={Math.abs(labelAt.x - center) < 4 ? "middle" : labelAt.x > center ? "start" : "end"} className="fill-muted-foreground text-[11px]">{String(row[index])}</text>
            </g>
          );
        })}
        {series.map((s, i) => {
          const shape = data.map((row, axis) => point(axis, Number(row[s.key] ?? 0)));
          return (
            <g key={s.key} style={{ opacity: SHADES[i % SHADES.length] }}>
              <polygon points={shape.map((p) => `${p.x},${p.y}`).join(" ")} fill="currentColor" fillOpacity={0.14} stroke="currentColor" strokeWidth={1.75} strokeLinejoin="round" />
              {shape.map((p, axis) => <circle key={axis} cx={p.x} cy={p.y} r={2.75} fill="currentColor" />)}
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead><tr><th scope="col">{index}</th>{series.map((s) => <th key={s.key} scope="col">{s.label}</th>)}</tr></thead>
        <tbody>
          {data.map((row) => (
            <tr key={String(row[index])}><th scope="row">{String(row[index])}</th>{series.map((s) => <td key={s.key}>{`${row[s.key] ?? 0} of ${max}`}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
