import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

export default async function AdminGuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ invitationId?: string; eventId?: string; q?: string }>;
}) {
  const { invitationId, eventId, q } = await searchParams;

  // Load all events with invitations for the filter dropdown
  const events = await prisma.event.findMany({
    where: { invitation: { isNot: null } },
    select: { id: true, title: true, slug: true, invitation: { select: { id: true } } },
    orderBy: { eventDate: "desc" },
  });

  // Build guest query
  const guests = await prisma.guest.findMany({
    where: {
      ...(eventId ? { eventId } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    include: {
      event: { select: { id: true, title: true, slug: true } },
    },
    orderBy: [{ event: { title: "asc" } }, { name: "asc" }],
    take: 500,
  });

  // Group guests by event
  const grouped = guests.reduce<Record<string, typeof guests>>((acc, g) => {
    const key = g.event.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});

  const attending = guests.filter((g) => g.rsvpStatus === "attending").length;
  const declined  = guests.filter((g) => g.rsvpStatus === "declined").length;
  const pending   = guests.filter((g) => !g.rsvpStatus).length;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.h1}>Guest List</h1>
        <div style={s.stats}>
          <span style={s.stat}><strong>{guests.length}</strong> total</span>
          <span style={{ ...s.stat, color: "#16a34a" }}><strong>{attending}</strong> attending</span>
          <span style={{ ...s.stat, color: "#dc2626" }}><strong>{declined}</strong> declined</span>
          <span style={{ ...s.stat, color: "var(--c-muted)" }}><strong>{pending}</strong> pending</span>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" style={s.filters}>
        <select name="eventId" defaultValue={eventId ?? ""} style={s.select}>
          <option value="">All Invitations</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name…"
          style={s.search}
        />
        <button type="submit" style={s.btn}>Search</button>
        {(eventId || q) && (
          <Link href="/admin/guests" style={s.clear}>✕ Clear</Link>
        )}
      </form>

      {/* Guest table grouped by invitation */}
      {Object.keys(grouped).length === 0 ? (
        <div style={s.empty}>No guests found.</div>
      ) : (
        Object.entries(grouped).map(([eid, list]) => {
          const ev = list[0].event;
          return (
            <div key={eid} style={s.group}>
              <div style={s.groupHead}>
                <span style={s.groupTitle}>{ev.title}</span>
                <Link href={`/admin/events/${eid}`} style={s.groupLink}>Edit event →</Link>
                <a href={`/invite/${ev.slug}`} target="_blank" rel="noreferrer" style={s.groupLink}>View invite ↗</a>
                <span style={s.groupCount}>{list.length} guests</span>
              </div>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Name</th>
                    <th style={s.th}>RSVP</th>
                    <th style={s.th}>Token link</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((g) => (
                    <tr key={g.id} style={s.tr}>
                      <td style={s.td}>{g.name}</td>
                      <td style={s.td}>
                        <span style={{
                          ...s.badge,
                          background: g.rsvpStatus === "attending" ? "#dcfce7" : g.rsvpStatus === "declined" ? "#fee2e2" : "var(--c-surface-2)",
                          color: g.rsvpStatus === "attending" ? "#16a34a" : g.rsvpStatus === "declined" ? "#dc2626" : "var(--c-muted)",
                        }}>
                          {g.rsvpStatus ?? "Pending"}
                        </span>
                      </td>
                      <td style={s.td}>
                        {g.token ? (
                          <a
                            href={`/invite/${ev.slug}?g=${g.token}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "var(--c-accent)", fontSize: "0.8125rem" }}
                          >
                            /invite/{ev.slug}?g={g.token.slice(0, 8)}…
                          </a>
                        ) : (
                          <span style={{ color: "var(--c-muted)", fontSize: "0.8125rem" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
}

const s = {
  page:       { maxWidth: 1100, margin: "0 auto", padding: "1.5rem" } as const,
  header:     { display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" as const, marginBottom: "1.25rem" },
  h1:         { margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--c-text)" },
  stats:      { display: "flex", gap: "1rem", flexWrap: "wrap" as const },
  stat:       { fontSize: "0.875rem", color: "var(--c-text)" },
  filters:    { display: "flex", gap: "0.625rem", flexWrap: "wrap" as const, marginBottom: "1.5rem", alignItems: "center" },
  select:     { padding: "0.4375rem 0.75rem", border: "1px solid var(--c-border)", borderRadius: 7, background: "var(--c-surface)", color: "var(--c-text)", fontSize: "0.875rem", minWidth: 220 } as const,
  search:     { padding: "0.4375rem 0.75rem", border: "1px solid var(--c-border)", borderRadius: 7, background: "var(--c-surface)", color: "var(--c-text)", fontSize: "0.875rem", width: 200 } as const,
  btn:        { padding: "0.4375rem 1rem", border: "none", borderRadius: 7, background: "var(--c-accent)", color: "var(--c-lime-text)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" } as const,
  clear:      { padding: "0.4375rem 0.75rem", border: "1px solid var(--c-border)", borderRadius: 7, background: "none", color: "var(--c-muted)", fontSize: "0.875rem", textDecoration: "none" },
  empty:      { padding: "3rem", textAlign: "center" as const, color: "var(--c-muted)", background: "var(--c-surface)", borderRadius: 10, border: "1px solid var(--c-border)" },
  group:      { marginBottom: "1.5rem", border: "1px solid var(--c-border)", borderRadius: 10, overflow: "hidden" },
  groupHead:  { display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: "var(--c-surface)", borderBottom: "1px solid var(--c-border)", flexWrap: "wrap" as const },
  groupTitle: { fontWeight: 700, color: "var(--c-text)", fontSize: "0.9375rem" },
  groupLink:  { fontSize: "0.8125rem", color: "var(--c-accent)", textDecoration: "none" },
  groupCount: { marginLeft: "auto", fontSize: "0.8125rem", color: "var(--c-muted)", fontWeight: 600 },
  table:      { width: "100%", borderCollapse: "collapse" as const, fontSize: "0.875rem" },
  th:         { padding: "0.5rem 1rem", textAlign: "left" as const, fontSize: "0.75rem", fontWeight: 600, color: "var(--c-muted)", textTransform: "uppercase" as const, letterSpacing: "0.04em", background: "var(--c-surface-2)" },
  tr:         { borderTop: "1px solid var(--c-border)" },
  td:         { padding: "0.625rem 1rem", color: "var(--c-text)" },
  badge:      { display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, textTransform: "capitalize" as const },
} as const;
