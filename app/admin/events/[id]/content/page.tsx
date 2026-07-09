import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { resolveDesign, FREEFORM_THEME_ID, STANDARD_THEME_ID } from "@/lib/themes/design";
import { getTheme } from "@/lib/themes/registry";
import { STANDARD_TOKENS } from "@/lib/themes/themes/standard";
import { DEFAULT_FONTS } from "@/lib/themes/shared/standard-css";
import type { ThemeTokens } from "@/lib/themes/types";
import { ThemeEditor } from "./_components/ThemeEditor";

export const metadata = { title: "Event — Content" };

// Step 3 — Content: fill the chosen design with this event's real content.
// Freeform events edit their content inside the builder canvas instead.
export default async function EventContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      invitation: {
        include: {
          sections: { orderBy: { sortOrder: "asc" } },
          photos: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!event) notFound();

  const inv = event.invitation;
  const design = resolveDesign({
    overlayConfig: inv?.overlayConfig ?? null,
    defaultSections: inv?.defaultSections ?? null,
    sectionRows: inv?.sections ?? [],
  });
  const themeMod = getTheme(design.themeId);
  const baseTokens: ThemeTokens = { ...STANDARD_TOKENS, ...themeMod.tokens };

  // Freeform: text, images and sections all live on the builder canvas.
  if (design.themeId === FREEFORM_THEME_ID) {
    return (
      <div style={ff.card}>
        <h2 style={ff.h2}>This event uses the Freeform (Builder) design</h2>
        <p style={ff.p}>
          Its content — cover text, sections, photos, music — is edited directly on the drag-and-drop
          canvas, exactly as guests will see it.
        </p>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Link href={`/admin/events/${id}/builder`} style={ff.primary}>Open the Freeform builder →</Link>
          <Link href={`/admin/events/${id}/design`} style={ff.ghost}>Change design</Link>
        </div>
      </div>
    );
  }

  return (
    <ThemeEditor
      event={{
        id: event.id,
        title: event.title,
        eventType: event.eventType,
        eventDate: event.eventDate.toISOString(),
        venueName: event.venueName,
        venueMapUrl: event.venueMapUrl,
        slug: event.slug,
      }}
      invitation={{
        id: inv?.id ?? null,
        overlayConfig: (inv?.overlayConfig as Record<string, unknown> | null) ?? null,
        defaultSections: inv?.defaultSections ?? null,
        coverUrl: inv?.coverUrl ?? null,
        musicUrl: inv?.musicUrl ?? null,
        backgroundUrl: inv?.backgroundUrl ?? null,
        backgroundVideoUrl: inv?.backgroundVideoUrl ?? null,
      }}
      themeName={themeMod.name}
      designLocked={!!themeMod.preset}
      sectionRows={(inv?.sections ?? []).map((s) => ({ type: s.type, content: s.content }))}
      initialPhotos={(inv?.photos ?? []).map((p) => ({ id: p.id, url: p.url }))}
      themeDefaults={{
        accent: baseTokens.accent,
        title: baseTokens.title || baseTokens.primary,
        primary: baseTokens.primary,
        muted: baseTokens.muted,
        headingFont: baseTokens.headingFont || (themeMod.id === STANDARD_THEME_ID ? DEFAULT_FONTS.heading : baseTokens.font) || DEFAULT_FONTS.heading,
      }}
    />
  );
}

const ff = {
  card: { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: "1.5rem", maxWidth: 640 },
  h2: { margin: "0 0 0.5rem", fontSize: "1.05rem", fontWeight: 700, color: "var(--c-text)" },
  p: { margin: "0 0 1rem", fontSize: "0.9rem", color: "var(--c-muted)", lineHeight: 1.5 },
  primary: { padding: "0.55rem 1.1rem", background: "var(--c-accent)", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 },
  ghost: { padding: "0.55rem 1.1rem", background: "var(--c-surface-2)", border: "1px solid var(--c-border)", color: "var(--c-text)", borderRadius: 8, textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 },
} as const;
