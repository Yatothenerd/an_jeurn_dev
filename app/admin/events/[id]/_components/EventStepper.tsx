"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface StepState {
  key: "details" | "design" | "content" | "publish";
  label: string;
  /** Step has meaningful data saved. */
  done: boolean;
  /** Short status shown under the label (e.g. "Sweet Hearts", "3 sections"). */
  hint?: string;
}

/**
 * The invitation-build wizard: Details → Design → Content → Publish.
 * Guest management is intentionally NOT a step — it's a separate operational
 * task reached from the header "Guests" button — so the stepper hides itself on
 * the guests page. The Freeform builder lives under Design.
 */
export function EventStepper({ eventId, steps }: { eventId: string; steps: StepState[] }) {
  const pathname = usePathname();

  // Guest management is not part of the build wizard.
  if (pathname.startsWith(`/admin/events/${eventId}/guests`)) return null;

  const activeKey =
    steps.find((s) => pathname.startsWith(`/admin/events/${eventId}/${s.key}`))?.key ??
    // The builder canvas is the Freeform design surface — highlight Design.
    (pathname.includes("/builder") ? "design" : "details");

  return (
    <nav style={s.bar} aria-label="Event setup steps">
      {steps.map((step, i) => {
        const active = step.key === activeKey;
        return (
          <Link
            key={step.key}
            href={`/admin/events/${eventId}/${step.key}`}
            style={{ ...s.step, ...(active ? s.stepActive : {}) }}
            aria-current={active ? "step" : undefined}
          >
            <span style={{ ...s.dot, ...(step.done ? s.dotDone : {}), ...(active ? s.dotActive : {}) }}>
              {step.done ? "✓" : i + 1}
            </span>
            <span style={s.texts}>
              <span style={{ ...s.label, ...(active ? s.labelActive : {}) }}>{step.label}</span>
              {step.hint && <span style={s.hint}>{step.hint}</span>}
            </span>
            {i < steps.length - 1 && <span style={s.connector} aria-hidden />}
          </Link>
        );
      })}
    </nav>
  );
}

const s = {
  bar: {
    display: "flex",
    alignItems: "stretch",
    gap: "0.25rem",
    background: "var(--c-surface)",
    border: "1px solid var(--c-border)",
    borderRadius: 12,
    padding: "0.5rem",
    marginBottom: "1.25rem",
    overflowX: "auto" as const,
  },
  step: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flex: 1,
    minWidth: 110,
    padding: "0.45rem 0.6rem",
    borderRadius: 8,
    textDecoration: "none",
    position: "relative" as const,
  },
  stepActive: { background: "var(--c-surface-2)" },
  dot: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: "1.5px solid var(--c-border)",
    color: "var(--c-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.72rem",
    fontWeight: 700,
    flexShrink: 0,
    background: "var(--c-surface)",
  },
  dotDone: { background: "#dcfce7", borderColor: "#22c55e", color: "#15803d" },
  dotActive: { borderColor: "var(--c-accent)", color: "var(--c-accent)" },
  texts: { display: "flex", flexDirection: "column" as const, minWidth: 0 },
  label: { fontSize: "0.82rem", fontWeight: 600, color: "var(--c-muted)", lineHeight: 1.2, whiteSpace: "nowrap" as const },
  labelActive: { color: "var(--c-text)" },
  hint: { fontSize: "0.68rem", color: "var(--c-muted)", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 },
  connector: { position: "absolute" as const, right: -6, top: "50%", width: 10, height: 1, background: "var(--c-border)" },
} as const;
