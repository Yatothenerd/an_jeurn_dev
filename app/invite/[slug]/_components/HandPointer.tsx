"use client";

import type { CSSProperties } from "react";

// Line-art pointing hand: a raised index finger over a rounded fist with the
// other fingers folded as small knuckles, plus a thumb. Drawn as outlines
// (stroke, no fill) so it reads as a clean line icon, fully themeable via `color`.
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
      viewBox="0 0 56 84"
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      fill="none"
      stroke={color}
      strokeWidth={4.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Fist / palm */}
      <rect x="14" y="46" width="38" height="30" rx="14" />
      {/* Index finger — raised */}
      <path d="M19 46 V14 Q19 8 25 8 Q31 8 31 14 V46" />
      {/* Folded fingers — knuckles on top of the fist */}
      <path d="M31 46 V34 Q31 30 36 30 Q41 30 41 36 V46" />
      <path d="M41 46 V38 Q41 34 45 34 Q49 34 49 38 V46" />
      {/* Thumb */}
      <path d="M14 58 Q6 57 6 63 Q6 68 12 66" />
    </svg>
  );
}
