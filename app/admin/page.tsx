import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Admin — Dashboard" };

async function getStats() {
  const [totalClients, activeClients, totalEvents, totalInvitations] = await Promise.all([
    prisma.user.count({ where: { role: "client" } }),
    prisma.userPackage.count({ where: { status: "active" } }),
    prisma.event.count(),
    prisma.invitation.count(),
  ]);
  return { totalClients, activeClients, totalEvents, totalInvitations };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div>
      <h1 style={s.heading}>Dashboard</h1>
      <div style={s.grid}>
        <StatCard label="Total Clients" value={stats.totalClients} />
        <StatCard label="Active Subscriptions" value={stats.activeClients} />
        <StatCard label="Total Events" value={stats.totalEvents} />
        <StatCard label="Total Invitations" value={stats.totalInvitations} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={s.card}>
      <div style={s.value}>{value}</div>
      <div style={s.label}>{label}</div>
    </div>
  );
}

const s = {
  heading: { fontSize: "1.5rem", fontWeight: 700, color: "#111", margin: "0 0 1.5rem" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "1rem",
  },
  card: {
    background: "#fff",
    borderRadius: "10px",
    padding: "1.5rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
  },
  value: { fontSize: "2.25rem", fontWeight: 700, color: "#111", lineHeight: 1 },
  label: { fontSize: "0.875rem", color: "#6b7280", marginTop: "0.375rem" },
} as const;
