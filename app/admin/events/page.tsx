import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Events" };

export default async function AdminEventsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      invitation: { select: { isPublished: true, thumbnailUrl: true, coverUrl: true, shareLink: true } },
    },
  });

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-hd">
        <div className="page-hd-left">
          <h1 className="page-hd-title">Events</h1>
          <span className="page-hd-help" title="All invitation events">?</span>
        </div>
        <Link href="/admin/events/new" className="btn-create">+ CREATE</Link>
      </div>

      {events.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📅</div>
          <p style={{ margin: "0 0 0.25rem", fontWeight: 600, color: "var(--c-text)" }}>No events yet</p>
          <p style={{ margin: "0 0 1rem", color: "var(--c-muted)", fontSize: "0.9375rem" }}>Create the first event to get started.</p>
          <Link href="/admin/events/new" style={s.newBtn}>+ Create event</Link>
        </div>
      ) : (
        <div style={s.list}>
          {events.map(ev => {
            const thumb = ev.invitation?.thumbnailUrl ?? ev.invitation?.coverUrl ?? null;
            const pub   = ev.invitation?.isPublished ?? false;
            return (
              <Link key={ev.id} href={`/admin/events/${ev.id}`} style={s.card}>
                <div style={s.cardThumb}>
                  {thumb
                    ? <img src={thumb} alt="" style={s.thumbImg} />
                    : <span style={{ fontSize: "1.75rem", color: "var(--c-muted)" }}>📋</span>
                  }
                </div>
                <div style={s.cardBody}>
                  <div style={s.cardTop}>
                    <span style={s.evTitle}>{ev.title}</span>
                    <span style={{ ...s.badge, ...(pub ? s.badgePub : s.badgeDraft) }}>
                      {pub ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div style={s.cardMeta}>
                    <span>{ev.eventType}</span>
                    <span style={s.dot}>·</span>
                    <span>{new Date(ev.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    {ev.venueName && <><span style={s.dot}>·</span><span>{ev.venueName}</span></>}
                  </div>
                  <div style={s.clientRow}>
                    <span style={s.clientLbl}>Client:</span>
                    <span>{ev.user.name}</span>
                    <span style={{ color: "var(--c-muted)", fontSize: "0.8125rem" }}>({ev.user.email})</span>
                  </div>
                </div>
                <div style={s.arrow}>→</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  header:     { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem", flexWrap: "wrap" as const, gap: "0.75rem" },
  title:      { margin: "0 0 0.25rem", fontSize: "1.625rem", fontWeight: 700, color: "var(--c-text)" },
  sub:        { margin: 0, color: "var(--c-muted)", fontSize: "0.9375rem" },
  newBtn:     { padding: "0.5625rem 1.25rem", background: "var(--c-accent)", color: "var(--c-lime-text)", borderRadius: 8, textDecoration: "none", fontSize: "0.9375rem", fontWeight: 600, display: "inline-block" },
  empty:      { textAlign: "center" as const, padding: "3.5rem 1rem", background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12 },
  list:       { display: "flex", flexDirection: "column" as const, gap: "0.625rem" },
  card:       { display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 1rem", background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 10, textDecoration: "none", transition: "border-color 0.15s" },
  cardThumb:  { width: 64, height: 56, flexShrink: 0, borderRadius: 7, background: "var(--c-surface-2)", border: "1px solid var(--c-border)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
  thumbImg:   { width: "100%", height: "100%", objectFit: "cover" as const },
  cardBody:   { flex: 1, minWidth: 0 },
  cardTop:    { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" },
  evTitle:    { fontSize: "1rem", fontWeight: 600, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  badge:      { fontSize: "0.6875rem", fontWeight: 700, borderRadius: 4, padding: "0.15rem 0.5rem", flexShrink: 0 },
  badgePub:   { background: "#dcfce7", color: "#16a34a" },
  badgeDraft: { background: "var(--c-surface-2)", color: "var(--c-muted)", border: "1px solid var(--c-border)" },
  cardMeta:   { display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", color: "var(--c-muted)", marginBottom: "0.2rem" },
  dot:        { opacity: 0.5 },
  clientRow:  { display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", color: "var(--c-text)" },
  clientLbl:  { fontWeight: 600, color: "var(--c-muted)", fontSize: "0.8125rem" },
  arrow:      { fontSize: "1.125rem", color: "var(--c-muted)", flexShrink: 0 },
} as const;
