import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db/prisma";
import { ShareLinkCopy } from "./_components/ShareLinkCopy";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id }, select: { title: true } });
  return { title: event ? `${event.title} — Overview` : "Event Overview" };
}

export default async function EventOverviewPage({ params }: PageProps) {
  const { id: eventId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const event = await prisma.event.findFirst({
    where: { id: eventId, userId: session.sub },
    include: {
      invitation: {
        select: {
          id: true,
          isPublished: true,
          shareLink: true,
          thumbnailUrl: true,
          coverUrl: true,
          contentType: true,
        },
      },
    },
  });

  if (!event) notFound();

  const inv = event.invitation;
  const previewImg = inv?.thumbnailUrl ?? inv?.coverUrl ?? null;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <Link href="/dashboard" className="back-btn" style={s.back}>
          <span aria-hidden>←</span> My Events
        </Link>
        <h1 style={s.title}>{event.title}</h1>
        <p style={s.sub}>
          {event.eventType} &nbsp;·&nbsp;{" "}
          {new Date(event.eventDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          {event.venueName && <> &nbsp;·&nbsp; {event.venueName}</>}
        </p>
      </div>

      {/* Status banner */}
      <div style={{ ...s.statusBar, ...(inv?.isPublished ? s.statusPublished : s.statusDraft) }}>
        {inv?.isPublished ? (
          <>
            <span style={s.statusDot} />
            <strong>Live</strong> — your invitation is published and visible to guests.
          </>
        ) : inv ? (
          <>
            <span style={{ ...s.statusDot, background: "#f59e0b" }} />
            <strong>Pending</strong> — your administrator is finalising the invitation.
          </>
        ) : (
          <>
            <span style={{ ...s.statusDot, background: "#94a3b8" }} />
            <strong>Not set up yet</strong> — waiting for your administrator to configure this event.
          </>
        )}
      </div>

      <div style={s.grid}>
        {/* Invitation preview card */}
        <div style={s.card}>
          <div style={s.cardLabel}>Your Invitation</div>
          {inv ? (
            <div style={s.themeRow}>
              {previewImg && (
                <img src={previewImg} alt={event.title} style={s.themeThumbnail} />
              )}
              <div style={s.themeInfo}>
                <div style={s.themeName}>{event.title}</div>
                <div style={s.themeType}>{inv.contentType ?? "photo"} style</div>
                <div style={s.adminNote}>Managed by administrator</div>
              </div>
            </div>
          ) : (
            <div style={s.placeholder}>
              Your invitation will appear here once your administrator configures it.
            </div>
          )}
        </div>

        {/* Share link card */}
        <div style={s.card}>
          <div style={s.cardLabel}>Invitation Link</div>
          {inv?.shareLink ? (
            <ShareLinkCopy shareLink={inv.shareLink} isPublished={inv.isPublished} />
          ) : (
            <div style={s.placeholder}>
              Your share link will appear here once the invitation is published.
            </div>
          )}
        </div>
      </div>

      {/* Primary actions */}
      <div style={s.actions}>
        <Link href={`/dashboard/events/${eventId}/guests`} style={s.primaryBtn}>
          Manage Guests
        </Link>
        {inv?.isPublished && inv.shareLink && (
          <a href={inv.shareLink} target="_blank" rel="noreferrer" style={s.secondaryBtn}>
            View Live Invitation ↗
          </a>
        )}
      </div>

      {/* Info note */}
      <div style={s.infoBox}>
        <strong>What you can do:</strong> Add, edit and remove guests from your guest list. Your
        administrator manages the invitation design, sections, photos, music, and all other theme
        settings — any updates they make will appear on your invitation automatically.
      </div>
    </div>
  );
}

const s = {
  page: { maxWidth: "720px" },
  header: { marginBottom: "1.5rem" },
  back: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    color: "var(--c-muted)",
    textDecoration: "none",
    fontSize: "0.8125rem",
    marginBottom: "0.75rem",
  },
  title: { margin: "0 0 0.375rem", fontSize: "1.625rem", fontWeight: 700, color: "var(--c-text)" },
  sub: { margin: 0, fontSize: "0.9rem", color: "var(--c-muted)", textTransform: "capitalize" as const },

  statusBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    fontSize: "0.875rem",
    marginBottom: "1.5rem",
    border: "1px solid",
  },
  statusPublished: { background: "#dcfce7", borderColor: "#86efac", color: "#15803d" },
  statusDraft: { background: "var(--c-surface)", borderColor: "var(--c-border)", color: "var(--c-muted)" },
  statusDot: { width: 8, height: 8, borderRadius: "50%", background: "#16a34a", flexShrink: 0 },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.25rem" },

  card: {
    background: "var(--c-surface)",
    border: "1px solid var(--c-border)",
    borderRadius: "14px",
    padding: "1.25rem",
  },
  cardLabel: { fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--c-muted)", marginBottom: "0.875rem" },

  themeRow: { display: "flex", gap: "1rem", alignItems: "flex-start" },
  themeThumbnail: { width: 72, height: 96, objectFit: "cover" as const, borderRadius: "8px", flexShrink: 0, border: "1px solid var(--c-border)" },
  themeInfo: { display: "flex", flexDirection: "column" as const, gap: "0.25rem" },
  themeName: { fontSize: "1rem", fontWeight: 600, color: "var(--c-text)" },
  themeType: { fontSize: "0.8125rem", color: "var(--c-muted)", textTransform: "capitalize" as const },
  adminNote: {
    marginTop: "0.5rem",
    display: "inline-block",
    fontSize: "0.6875rem",
    fontWeight: 600,
    color: "var(--c-accent)",
    background: "var(--c-accent-soft)",
    borderRadius: "999px",
    padding: "0.2rem 0.6rem",
  },

  placeholder: { fontSize: "0.875rem", color: "var(--c-muted)", fontStyle: "italic" },

  actions: { display: "flex", gap: "0.75rem", flexWrap: "wrap" as const, marginBottom: "1.5rem" },
  primaryBtn: {
    padding: "0.6875rem 1.5rem",
    background: "var(--c-accent)",
    color: "#fff",
    borderRadius: "9px",
    textDecoration: "none",
    fontSize: "0.9375rem",
    fontWeight: 600,
  },
  secondaryBtn: {
    padding: "0.6875rem 1.25rem",
    background: "var(--c-surface)",
    border: "1px solid var(--c-border)",
    color: "var(--c-text)",
    borderRadius: "9px",
    textDecoration: "none",
    fontSize: "0.9375rem",
    fontWeight: 500,
  },

  infoBox: {
    fontSize: "0.875rem",
    color: "var(--c-muted)",
    background: "var(--c-surface)",
    border: "1px solid var(--c-border)",
    borderRadius: "10px",
    padding: "1rem 1.125rem",
    lineHeight: 1.6,
  },
} as const;
