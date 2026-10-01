import type { CSSProperties } from "react";

/** Red → yellow → green background for a value in [min, max]. */
export function heat(value: number, min: number, max: number): CSSProperties {
  const t = max === min ? 0.5 : (value - min) / (max - min);
  const bg =
    t < 0.5
      ? `color-mix(in oklab, var(--heat-bad) ${Math.round((1 - t * 2) * 100)}%, var(--heat-mid))`
      : `color-mix(in oklab, var(--heat-good) ${Math.round((t * 2 - 1) * 100)}%, var(--heat-mid))`;
  return { background: bg, color: "var(--heat-ink)" };
}
