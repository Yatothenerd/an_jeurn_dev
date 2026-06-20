import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "My Events" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const events = await prisma.event.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
    include: { invitation: { select: { isPublished: true } } },
  });

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.heading}>My Events</h1>
      </div>

      {events.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>🎉</div>
          <div style={s.emptyTitle}>No events yet</div>
          <div style={s.emptyText}>
            Your events are set up by your administrator. Once an event is assigned to you,
            it will appear here for you to manage.
          </div>
        </div>
      ) : (
        <div style={s.grid}>
          {events.map((event) => (
            <div key={event.id} style={s.card}>
              <div style={s.cardTop}>
                <span style={s.eventType}>{event.eventType}</span>
                <StatusBadge status={event.status} published={event.invitation?.isPublished ?? false} />
              </div>
              <h2 style={s.eventTitle}>{event.title}</h2>
              <p style={s.eventDate}>
                {new Date(event.eventDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {event.venueName && <p style={s.venue}>{event.venueName}</p>}
              <div style={s.cardFooter}>
                <Link href={`/dashboard/events/${event.id}/builder`} style={s.builderBtn}>
                  Open Builder →
                </Link>
                <Link href={`/dashboard/events/${event.id}/guests`} style={s.guestsLink}>
                  Guest List
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, published }: { status: string; published: boolean }) {
  if (published) return <span style={{ ...s.badge, background: "var(--c-lime)", color: "var(--c-lime-text)" }}>Published</span>;
  if (status === "draft") return <span style={{ ...s.badge, background: "var(--c-surface-2)", color: "var(--c-muted)" }}>Draft</span>;
  return <span style={{ ...s.badge, background: "#fef9c3", color: "#854d0e" }}>{status}</span>;
}

const s = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  heading: { margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--c-text)" },
  newBtn: {
    padding: "0.5rem 1.125rem",
    background: "var(--c-accent)",
    color: "#fff",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "0.875rem",
    fontWeight: 600,
  },
  empty: {
    textAlign: "center" as const,
    padding: "4rem 2rem",
    background: "var(--c-surface)",
    borderRadius: "12px",
    border: "1px solid var(--c-border)",
  },
  emptyIcon: { fontSize: "3rem", marginBottom: "0.75rem" },
  emptyTitle: { fontSize: "1.125rem", fontWeight: 600, color: "var(--c-text)", marginBottom: "0.5rem" },
  emptyText: { color: "var(--c-muted)", marginBottom: "1.5rem", fontSize: "0.9375rem" },
  emptyBtn: {
    display: "inline-block",
    padding: "0.625rem 1.5rem",
    background: "var(--c-accent)",
    color: "#fff",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "0.9375rem",
    fontWeight: 600,
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" },
  card: {
    background: "var(--c-surface)",
    borderRadius: "18px",
    padding: "1.4rem",
    border: "1px solid var(--c-border)",
    boxShadow: "0 10px 30px var(--c-shadow)",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.375rem",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  eventType: { fontSize: "0.75rem", fontWeight: 600, color: "var(--c-accent)", textTransform: "capitalize" as const },
  badge: { fontSize: "0.6875rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "4px" },
  eventTitle: { margin: "0.375rem 0 0", fontSize: "1rem", fontWeight: 700, color: "var(--c-text)" },
  eventDate: { margin: 0, fontSize: "0.8125rem", color: "var(--c-muted)" },
  venue: { margin: 0, fontSize: "0.8125rem", color: "var(--c-muted)" },
  cardFooter: { marginTop: "auto", paddingTop: "0.875rem", display: "flex", flexDirection: "column" as const, gap: "0.5rem" },
  guestsLink: {
    display: "block",
    textAlign: "center" as const,
    padding: "0.4rem",
    background: "transparent",
    border: "1px solid var(--c-border)",
    borderRadius: "7px",
    textDecoration: "none",
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: "var(--c-muted)",
  },
  builderBtn: {
    display: "block",
    textAlign: "center" as const,
    padding: "0.5rem",
    background: "var(--c-surface-2)",
    border: "1px solid var(--c-border)",
    borderRadius: "7px",
    textDecoration: "none",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "var(--c-text)",
  },
} as const;
