"use client";

import type { TransitionStyle } from "@/lib/services/site-settings.service";

// Rendered inside app/template.tsx, which React remounts on every route change.
// That remount is what makes the CSS animation replay on each navigation, giving
// the page-to-page transition effect. The actual style is admin-configurable.
export function PageTransition({
  style,
  children,
}: {
  style: TransitionStyle;
  children: React.ReactNode;
}) {
  if (style === "none") return <>{children}</>;
  return <div className={`pt pt-${style}`}>{children}</div>;
}
