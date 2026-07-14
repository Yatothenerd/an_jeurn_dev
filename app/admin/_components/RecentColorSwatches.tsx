"use client";

/** Compact row of recently-picked color swatches — pair with useRecentColors(). */

export function RecentColorSwatches({
  recent,
  onPick,
  size = 18,
  max,
  wrap = true,
}: {
  recent: string[];
  onPick: (hex: string) => void;
  size?: number;
  /** Cap how many swatches show (tight spaces, e.g. a floating toolbar). */
  max?: number;
  /** Set false for toolbars that must stay on one line. */
  wrap?: boolean;
}) {
  const shown = max ? recent.slice(0, max) : recent;
  if (shown.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: wrap ? "wrap" : "nowrap", alignItems: "center" }}>
      {shown.map((c) => (
        <button
          key={c}
          type="button"
          title={c}
          onClick={() => onPick(c)}
          style={{
            width: size, height: size, padding: 0, borderRadius: "50%", flexShrink: 0,
            border: "1px solid rgba(0,0,0,0.15)", background: c, cursor: "pointer",
          }}
        />
      ))}
    </div>
  );
}
