"use client";

import type { CSSProperties } from "react";

// A stylized "tap / point" hand, drawn as inline SVG so its color is fully
// themeable (replaces the old raster /hand.webp). The silhouette is composed
// of an extended index finger, a rounded palm, and a thumb.
export function HandPointer({
  color = "currentColor",
  className,
  style,
}: {
  color?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 56 78"
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      <g fill={color}>
        {/* extended index finger — offset to the left, not centered */}
        <rect x="13" y="5" width="11" height="40" rx="5.5" />
        {/* folded finger knuckles stepping down across the top of the fist */}
        <rect x="25" y="30" width="9" height="15" rx="4.5" />
        <rect x="33" y="33" width="9" height="13" rx="4.5" />
        <rect x="41" y="36" width="8" height="11" rx="4" />
        {/* palm / fist */}
        <rect x="13" y="38" width="36" height="31" rx="13" />
        {/* thumb */}
        <rect x="5" y="42" width="11" height="21" rx="5.5" transform="rotate(-22 10 52)" />
      </g>
    </svg>
  );
}
