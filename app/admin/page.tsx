import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { AdminLauncher } from "./_components/AdminLauncher";

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

  const events = upcoming.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.eventType,
    date: e.eventDate,
    client: e.user.name,
    attending: e.guests.filter((g) => g.rsvpStatus === "attending").length,
    pending: e.guests.filter((g) => !g.rsvpStatus).length,
    published: e.invitation?.isPublished ?? false,
  }));
  const totalPending = events.reduce((sum, e) => sum + e.pending, 0);

  return { totalClients, activeSubs, totalEvents, totalInvitations, inactiveClients, events, totalPending };
}

export default async function AdminDashboard() {
  const d = await getData();

  const metrics = [
    { label: "Clients", value: d.totalClients, icon: "👥", href: "/admin/clients", action: "+ New Client", highlight: false },
    { label: "Active Subscriptions", value: d.activeSubs, icon: "💳", href: "/admin/packages", action: "Manage", highlight: true },
    { label: "Events", value: d.totalEvents, icon: "📅", href: "/admin/events/new", action: "+ New Event", highlight: false },
    { label: "Invitations", value: d.totalInvitations, icon: "✉️", href: "/admin/invitations", action: "View", highlight: false },
  ];

  return (
    <div>
      <h1 style={s.heading}>Dashboard</h1>

      {/* Mobile app-style launcher (hidden on desktop) */}
      <AdminLauncher />

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
        {metrics.map((m) => {
          const lime = m.highlight;
          return (
            <div
              key={m.label}
              className="admin-card"
              style={{ ...s.metricCard, ...(lime ? { background: "var(--c-lime)", color: "var(--c-lime-text)", border: "none" } : {}) }}
            >
              <span style={{ ...s.metricIcon, background: lime ? "rgba(0,0,0,0.12)" : "var(--c-accent-soft)", color: lime ? "var(--c-lime-text)" : "var(--c-accent)" }}>
                {m.icon}
              </span>
              <div style={{ ...s.metricValue, color: lime ? "var(--c-lime-text)" : "var(--c-text)" }}>{m.value}</div>
              <div style={{ ...s.metricLabel, color: lime ? "var(--c-lime-text)" : "var(--c-muted)", opacity: lime ? 0.75 : 1 }}>{m.label}</div>
              <Link href={m.href} style={{ ...s.metricAction, color: lime ? "var(--c-lime-text)" : "var(--c-accent)" }}>{m.action} →</Link>
            </div>
          );
        })}
      </div>

      {/* Upcoming events — "recent transactions" style */}
      <section className="admin-card" style={s.panel}>
        <div style={s.panelHead}>
          <h2 style={s.panelTitle}>Upcoming Events</h2>
          <Link href="/admin/invitations" style={s.arrowBtn} aria-label="All invitations">↗</Link>
        </div>

        {d.events.length === 0 ? (
          <p style={s.empty}>No upcoming events.</p>
        ) : (
          <div className="data-table-wrap" style={{ boxShadow: "none", border: "none" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th className="col-hide-sm">Date</th>
                  <th className="num">Attending</th>
                </tr>
              </thead>
              <tbody>
                {d.events.map((e) => (
                  <tr key={e.id}>
                    <td data-label="Event">
                      <span style={s.rowItem}>
                        <span style={s.rowIcon}>🎉</span>
                        <span>
                          <span className="cell-title" style={{ display: "block" }}>{e.title}</span>
                          <span className="cell-sub" style={{ textTransform: "capitalize" }}>{e.type}</span>
                        </span>
                      </span>
                    </td>
                    <td data-label="Client" style={{ color: "var(--c-muted)" }}>{e.client}</td>
                    <td data-label="Status">
                      <span className="status-pill" style={e.published ? { background: "var(--c-lime)", color: "var(--c-lime-text)" } : { background: "var(--c-surface-2)", color: "var(--c-muted)" }}>
                        {e.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td data-label="Date" className="col-hide-sm" style={{ color: "var(--c-muted)" }}>
                      {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td data-label="Attending" className="num" style={{ color: "var(--c-text)", fontWeight: 700 }}>{e.attending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const s = {
  heading: { fontSize: "1.5rem", fontWeight: 700, color: "var(--c-text)", margin: "0 0 1.25rem" },
  alerts: { display: "flex", flexWrap: "wrap" as const, gap: "0.75rem", marginBottom: "1.25rem" },
  alert: { flex: "1 1 240px", padding: "0.75rem 1rem", borderRadius: "12px", fontSize: "0.875rem", border: "1px solid" },
  alertWarn: { background: "#fffbeb", borderColor: "#fde68a", color: "#92400e" },
  alertDanger: { background: "#fef2f2", borderColor: "#fecaca", color: "#991b1b" },
  metricGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" },
  metricCard: { padding: "1.4rem 1.5rem", display: "flex", flexDirection: "column" as const, gap: "0.15rem" },
  metricIcon: { width: "46px", height: "46px", borderRadius: "13px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", marginBottom: "0.75rem" },
  metricValue: { fontSize: "2.25rem", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em" },
  metricLabel: { fontSize: "0.875rem", fontWeight: 500 },
  metricAction: { marginTop: "0.85rem", fontSize: "0.8125rem", fontWeight: 700, textDecoration: "none" },
  panel: { padding: "1.4rem 1.6rem" },
  panelHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", gap: "0.5rem" },
  panelTitle: { margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--c-text)" },
  arrowBtn: { width: "40px", height: "40px", borderRadius: "50%", background: "var(--c-accent-soft)", color: "var(--c-accent)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", fontSize: "1.1rem", flexShrink: 0 },
  empty: { color: "var(--c-muted)", fontSize: "0.9375rem", margin: 0 },
  rowItem: { display: "inline-flex", alignItems: "center", gap: "0.7rem" },
  rowIcon: { width: "38px", height: "38px", borderRadius: "11px", background: "var(--c-surface-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.05rem", flexShrink: 0 },
} as const;
