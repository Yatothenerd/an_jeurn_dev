import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Admin — Dashboard" };

async function getData() {
  const now = new Date();
  const [totalClients, activeSubs, totalEvents, totalInvitations, inactiveClients, upcoming] =
    await Promise.all([
      prisma.user.count({ where: { role: "client" } }),
      prisma.userPackage.count({ where: { status: "active" } }),
      prisma.event.count(),
      prisma.invitation.count(),
      prisma.user.count({ where: { role: "client", userPackages: { none: { status: "active" } } } }),
      prisma.event.findMany({
        where: { eventDate: { gte: now } },
        orderBy: { eventDate: "asc" },
        take: 6,
        include: {
          user: { select: { name: true } },
          guests: { select: { rsvpStatus: true } },
          invitation: { select: { isPublished: true } },
        },
      }),
    ]);

  const events = upcoming.map((e) => {
    const attending = e.guests.filter((g) => g.rsvpStatus === "attending").length;
    const pending = e.guests.filter((g) => !g.rsvpStatus).length;
    return {
      id: e.id,
      title: e.title,
      date: e.eventDate,
      client: e.user.name,
      total: e.guests.length,
      attending,
      pending,
      published: e.invitation?.isPublished ?? false,
    };
  });
  const totalPending = events.reduce((sum, e) => sum + e.pending, 0);

  return { totalClients, activeSubs, totalEvents, totalInvitations, inactiveClients, events, totalPending };
}

const METRICS = (d: Awaited<ReturnType<typeof getData>>) => [
  { label: "Clients", value: d.totalClients, icon: "👥", color: "#7c3aed", href: "/admin/clients", action: "+ New Client" },
  { label: "Active Subscriptions", value: d.activeSubs, icon: "💳", color: "#16a34a", href: "/admin/packages", action: "Manage" },
  { label: "Events", value: d.totalEvents, icon: "📅", color: "#2563eb", href: "/admin/events/new", action: "+ New Event" },
  { label: "Invitations", value: d.totalInvitations, icon: "✉️", color: "#d97706", href: "/admin/invitations", action: "View" },
];

export default async function AdminDashboard() {
  const d = await getData();

  return (
    <div>
      <h1 style={s.heading}>Dashboard</h1>

      {/* Alerts */}
      {(d.totalPending > 0 || d.inactiveClients > 0) && (
        <div style={s.alerts}>
          {d.totalPending > 0 && (
            <div style={{ ...s.alert, ...s.alertWarn }}>
              ⏳ <strong>{d.totalPending}</strong> guest response{d.totalPending === 1 ? "" : "s"} pending across upcoming events
            </div>
          )}
          {d.inactiveClients > 0 && (
            <div style={{ ...s.alert, ...s.alertDanger }}>
              ⚠️ <strong>{d.inactiveClients}</strong> client{d.inactiveClients === 1 ? "" : "s"} without an active subscription
            </div>
          )}
        </div>
      )}

      {/* Metric cards */}
      <div style={s.metricGrid}>
        {METRICS(d).map((m) => (
          <div key={m.label} className="admin-card" style={s.metricCard}>
            <div style={s.metricTop}>
              <span style={{ ...s.metricIcon, background: `${m.color}1a`, color: m.color }}>{m.icon}</span>
              <span style={{ ...s.metricBar, background: m.color }} />
            </div>
            <div style={s.metricValue}>{m.value}</div>
            <div style={s.metricLabel}>{m.label}</div>
            <Link href={m.href} style={{ ...s.metricAction, color: m.color }}>{m.action} →</Link>
          </div>
        ))}
      </div>

      {/* Upcoming events */}
      <section className="admin-card" style={s.panel}>
        <div style={s.panelHead}>
          <h2 style={s.panelTitle}>Upcoming Events</h2>
          <Link href="/admin/invitations" style={s.panelLink}>All invitations →</Link>
        </div>
        {d.events.length === 0 ? (
          <p style={s.empty}>No upcoming events.</p>
        ) : (
          <div style={s.eventList}>
            {d.events.map((e) => (
              <div key={e.id} style={s.eventRow}>
                <div style={s.eventMain}>
                  <div style={s.eventTitle}>{e.title}</div>
                  <div style={s.eventMeta}>
                    {e.client} · {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
                <div style={s.eventStats}>
                  <span style={{ ...s.pill, ...s.pillGreen }}>{e.attending} attending</span>
                  {e.pending > 0 && <span style={{ ...s.pill, ...s.pillAmber }}>{e.pending} pending</span>}
                  <span style={{ ...s.pill, background: e.published ? "#dcfce7" : "var(--c-surface-2)", color: e.published ? "#15803d" : "var(--c-muted)" }}>
                    {e.published ? "published" : "draft"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const s = {
  heading: { fontSize: "1.5rem", fontWeight: 700, color: "var(--c-text)", margin: "0 0 1.25rem" },
  alerts: { display: "flex", flexWrap: "wrap" as const, gap: "0.75rem", marginBottom: "1.25rem" },
  alert: { flex: "1 1 240px", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.875rem", border: "1px solid" },
  alertWarn: { background: "#fffbeb", borderColor: "#fde68a", color: "#92400e" },
  alertDanger: { background: "#fef2f2", borderColor: "#fecaca", color: "#991b1b" },
  metricGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" },
  metricCard: { padding: "1.25rem", display: "flex", flexDirection: "column" as const, gap: "0.15rem" },
  metricTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" },
  metricIcon: { width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" },
  metricBar: { width: "36px", height: "4px", borderRadius: "999px", opacity: 0.85 },
  metricValue: { fontSize: "2rem", fontWeight: 700, color: "var(--c-text)", lineHeight: 1.1 },
  metricLabel: { fontSize: "0.875rem", color: "var(--c-muted)" },
  metricAction: { marginTop: "0.75rem", fontSize: "0.8125rem", fontWeight: 600, textDecoration: "none" },
  panel: { padding: "1.25rem 1.5rem" },
  panelHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap" as const, gap: "0.5rem" },
  panelTitle: { margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--c-text)" },
  panelLink: { fontSize: "0.8125rem", color: "var(--c-accent)", textDecoration: "none", fontWeight: 500 },
  empty: { color: "var(--c-muted)", fontSize: "0.9375rem", margin: 0 },
  eventList: { display: "flex", flexDirection: "column" as const, gap: "0.5rem" },
  eventRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" as const, padding: "0.75rem", background: "var(--c-surface-2)", borderRadius: "8px" },
  eventMain: { minWidth: 0 },
  eventTitle: { fontSize: "0.9375rem", fontWeight: 600, color: "var(--c-text)" },
  eventMeta: { fontSize: "0.8125rem", color: "var(--c-muted)", marginTop: "0.125rem" },
  eventStats: { display: "flex", gap: "0.4rem", flexWrap: "wrap" as const },
  pill: { fontSize: "0.6875rem", fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: "999px", whiteSpace: "nowrap" as const },
  pillGreen: { background: "#dcfce7", color: "#15803d" },
  pillAmber: { background: "#fef3c7", color: "#92400e" },
} as const;
