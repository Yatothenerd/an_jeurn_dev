import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db/prisma";
import { getTheme } from "@/lib/themes/registry";
import { resolveDesign, FREEFORM_THEME_ID } from "@/lib/themes/design";
import { EventStepper, type StepState } from "./_components/EventStepper";

// Every event sub-page (Details / Design / Content / Guests / Publish and the
// Freeform builder) shares this header + workflow stepper, so the admin always
// sees where they are, what's complete, and what's next.
export default async function EventWorkflowLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      invitation: {
        select: {
          overlayConfig: true,
          defaultSections: true,
          isPublished: true,
          shareLink: true,
          sections: { where: { isVisible: true }, select: { id: true, type: true, sortOrder: true, content: true } },
        },
      },
      _count: { select: { guests: true } },
    },
  });
  if (!event) notFound();

  const inv = event.invitation;
  const design = resolveDesign({
    overlayConfig: inv?.overlayConfig ?? null,
    defaultSections: inv?.defaultSections ?? null,
    sectionRows: inv?.sections ?? [],
  });

  const oc = (inv?.overlayConfig ?? {}) as Record<string, unknown>;
  const designChosen = typeof oc.themeId === "string" || design.themeId === FREEFORM_THEME_ID;
  const themeName = getTheme(design.themeId).name;
  const contentDone =
    design.themeId === FREEFORM_THEME_ID || design.sections.some((s) => s.included);
  const guestCount = event._count.guests;
  const isPublished = inv?.isPublished ?? false;

  // The build wizard — guest management is a separate task (header button below).
  const steps: StepState[] = [
    { key: "details", label: "Details", done: true, hint: event.eventType },
    { key: "design",  label: "Design",  done: designChosen, hint: designChosen ? themeName : "Choose a theme" },
    { key: "content", label: "Content", done: contentDone, hint: design.themeId === FREEFORM_THEME_ID ? "In builder" : `${design.sections.filter((s) => s.included).length} sections` },
    { key: "publish", label: "Publish", done: isPublished, hint: isPublished ? "Live" : "Draft" },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div style={s.header}>
        <div style={{ minWidth: 0 }}>
          <Link href="/admin/events" style={s.back}>← All events</Link>
          <h1 style={s.title}>{event.title}</h1>
          <p style={s.sub}>
            {event.user.name} · {event.eventType} ·{" "}
            {new Date(event.eventDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div style={s.headerRight}>
          <span style={{ ...s.badge, ...(isPublished ? s.badgeLive : s.badgeDraft) }}>
            {isPublished ? "● Live" : "○ Draft"}
          </span>
          <Link href={`/admin/events/${event.id}/guests`} style={s.guestsBtn}>
            👥 Guests{guestCount > 0 ? ` · ${guestCount}` : ""}
          </Link>
          <a href={`/invite/${event.slug}?preview=1`} target="_blank" rel="noreferrer" style={s.viewBtn}>
            Preview invitation ↗
          </a>
        </div>
      </div>

      <EventStepper eventId={event.id} steps={steps} />
      {children}
    </div>
  );
}

const s = {
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" as const, marginBottom: "1rem" },
  back: { display: "inline-block", fontSize: "0.875rem", color: "var(--c-muted)", textDecoration: "none", marginBottom: "0.375rem" },
  title: { margin: "0 0 0.25rem", fontSize: "1.625rem", fontWeight: 700, color: "var(--c-text)" },
  sub: { margin: 0, fontSize: "0.9375rem", color: "var(--c-muted)" },
  headerRight: { display: "flex", gap: "0.6rem", alignItems: "center", flexShrink: 0 },
  badge: { fontSize: "0.78rem", fontWeight: 700, padding: "0.3rem 0.75rem", borderRadius: 999 },
  badgeLive: { background: "#dcfce7", color: "#15803d" },
  badgeDraft: { background: "var(--c-surface-2)", color: "var(--c-muted)", border: "1px solid var(--c-border)" },
  viewBtn: { padding: "0.5rem 1rem", background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 8, textDecoration: "none", color: "var(--c-text)", fontSize: "0.875rem", fontWeight: 600 },
  guestsBtn: { padding: "0.5rem 1rem", background: "var(--c-accent-soft)", border: "1px solid var(--c-accent)", borderRadius: 8, textDecoration: "none", color: "var(--c-accent)", fontSize: "0.875rem", fontWeight: 600, whiteSpace: "nowrap" as const },
} as const;
