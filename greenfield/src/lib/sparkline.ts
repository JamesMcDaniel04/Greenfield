// Deterministic sparkline-data generator.
//
// Real demand-signal data would come from search-volume / funding / job-posting
// indices. For demo and pre-data states we synthesise plausible-looking series
// keyed off the opportunity's slug (so it doesn't reshuffle on every render)
// and its `demand_trend` enum.

const POINTS = 28;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function rand(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/**
 * Returns POINTS values in [0, 1]. The overall shape is determined by
 * `trend`; per-opportunity wobble is determined by `seed`.
 */
export function sparkData(seed: string, trend: string): number[] {
  const r = rand(hash(seed));
  const out: number[] = [];

  // Shape function: returns the base trend value at position t ∈ [0, 1]
  let shape: (t: number) => number;
  switch (trend) {
    case "Accelerating":
      shape = (t) => 0.15 + Math.pow(t, 1.6) * 0.85;
      break;
    case "Emerging":
      // Flat-ish then sharp rise in the last third
      shape = (t) => (t < 0.65 ? 0.18 + t * 0.1 : 0.25 + Math.pow((t - 0.65) / 0.35, 1.4) * 0.7);
      break;
    case "Steady growth":
      shape = (t) => 0.2 + t * 0.55;
      break;
    case "Niche but durable":
      shape = (t) => 0.4 + Math.sin(t * Math.PI * 1.2) * 0.05 + t * 0.05;
      break;
    default:
      shape = (t) => 0.3 + t * 0.4;
  }

  // Per-point noise scaled by trend (accelerating = noisier upside, durable = quieter)
  const noiseAmp =
    trend === "Niche but durable" ? 0.04 :
    trend === "Steady growth"     ? 0.07 :
    0.09;

  for (let i = 0; i < POINTS; i++) {
    const t = i / (POINTS - 1);
    const noise = (r() - 0.5) * noiseAmp;
    out.push(Math.max(0.02, Math.min(0.98, shape(t) + noise)));
  }
  return out;
}

/**
 * Convert a normalised [0,1] series into an SVG `path d` string + a closed
 * "area" path for the filled gradient.
 */
export function toPaths(values: number[], width: number, height: number, padding = 2): { line: string; area: string } {
  if (values.length === 0) return { line: "", area: "" };
  const w = width - padding * 2;
  const h = height - padding * 2;
  const step = w / (values.length - 1);

  const points = values.map((v, i) => {
    const x = padding + i * step;
    const y = padding + (1 - v) * h;
    return [x, y] as const;
  });

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area =
    `${line} L${(padding + w).toFixed(1)},${(padding + h).toFixed(1)} L${padding.toFixed(1)},${(padding + h).toFixed(1)} Z`;
  return { line, area };
}
