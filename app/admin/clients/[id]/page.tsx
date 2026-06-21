import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { ClientActions } from "../_components/ClientActions";
import { GrantPackage } from "../_components/GrantPackage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;

  const client = await prisma.user.findUnique({
    where: { id, role: "client" },
    include: {
      userPackages: {
        orderBy: { grantedAt: "desc" },
        include: {
          package: true,
          grantedBy: { select: { name: true, email: true } },
        },
      },
      events: {
        orderBy: { createdAt: "desc" },
        include: {
          invitation: { select: { isPublished: true, id: true, shareLink: true } },
        },
      },
    },
  });

  if (!client) notFound();

  const up = client.userPackages[0];
  const activeUp = client.userPackages.find((p) => p.status === "active");

  const packages = await prisma.package.findMany({
    orderBy: { priceUsd: "asc" },
    select: { id: true, name: true, priceUsd: true },
  });
  const packageOptions = packages.map((p) => ({ id: p.id, name: p.name, price: Number(p.priceUsd) }));

  return (
    <div>
      <div style={s.breadcrumb}>
        <Link href="/admin/clients" className="back-btn"><span className="ico" aria-hidden>←</span> Clients</Link>
      </div>

      <div style={s.header}>
        <div>
          <h1 style={s.name}>{client.name}</h1>
          <p style={s.email}>{client.email}</p>
        </div>
        <p style={s.joined}>Joined {new Date(client.createdAt).toLocaleDateString()}</p>
      </div>

      <div style={s.grid}>
        {/* Package Card */}
        <section style={s.card}>
          <h2 style={s.cardTitle}>Package</h2>
          {up ? (
            <div style={s.detail}>
              <Row label="Package" value={up.package.name} />
              <Row label="Status"><StatusBadge status={up.status} /></Row>
              <Row label="Granted" value={new Date(up.grantedAt).toLocaleDateString()} />
              <Row label="Expires" value={up.expiresAt ? new Date(up.expiresAt).toLocaleDateString() : "Never"} />
              <Row label="Granted by" value={up.grantedBy.name} />
              {up.notes && <Row label="Notes" value={up.notes} />}
              <div style={{ marginTop: "1rem" }}>
                <ClientActions userPackageId={up.id} status={up.status} />
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                <GrantPackage userId={client.id} packages={packageOptions} currentPackageId={activeUp?.packageId} />
              </div>
            </div>
          ) : (
            <div>
              <p style={s.none}>No active package.</p>
              <div style={{ marginTop: "0.75rem" }}>
                <GrantPackage userId={client.id} packages={packageOptions} />
              </div>
            </div>
          )}
        </section>

        {/* Events Card */}
        <section style={s.card}>
          <h2 style={s.cardTitle}>Events ({client.events.length})</h2>
          {client.events.length === 0 ? (
            <p style={s.none}>No events created yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {client.events.map((ev) => (
                <div key={ev.id} style={s.eventCard}>
                  <div style={s.eventRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.eventTitle}>{ev.title}</div>
                      <div style={s.eventMeta}>
                        {ev.eventType} · {new Date(ev.eventDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={s.eventStatus}>{ev.status}</span>
                      {ev.invitation?.isPublished && (
                        <span style={{ ...s.eventStatus, background: "#dcfce7", color: "#15803d" }}>published</span>
                      )}
                    </div>
                  </div>
                  <div style={s.eventActions}>
                    <Link href={`/admin/events/${ev.id}`} style={s.editBtn}>Edit invitation →</Link>
                    {ev.invitation?.shareLink && (
                      <a href={ev.invitation.shareLink} target="_blank" rel="noreferrer" style={s.viewBtn}>View ↗</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div style={s.row}>
      <span style={s.rowLabel}>{label}</span>
      <span style={s.rowValue}>{children ?? value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    active:  { bg: "#dcfce7", color: "#15803d" },
    expired: { bg: "#fef9c3", color: "#854d0e" },
    revoked: { bg: "#fee2e2", color: "#b91c1c" },
  };
  const c = colors[status] ?? { bg: "#f3f4f6", color: "#6b7280" };
  return (
    <span style={{ padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, background: c.bg, color: c.color }}>
      {status}
    </span>
  );
}

const s = {
  breadcrumb:   { marginBottom: "1.25rem" },
  header:       { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", gap: "0.75rem", flexWrap: "wrap" as const },
  name:         { margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 700, color: "var(--c-text)" },
  email:        { margin: 0, color: "var(--c-muted)", fontSize: "0.9375rem" },
  joined:       { margin: 0, color: "var(--c-muted)", fontSize: "0.875rem" },
  grid:         { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" },
  card:         { background: "var(--c-surface)", color: "var(--c-text)", borderRadius: "10px", padding: "1.5rem", border: "1px solid var(--c-border)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  cardTitle:    { margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600, color: "var(--c-text)" },
  detail:       { display: "flex", flexDirection: "column" as const, gap: "0.625rem" },
  row:          { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" },
  rowLabel:     { fontSize: "0.875rem", color: "var(--c-muted)" },
  rowValue:     { fontSize: "0.875rem", color: "var(--c-text)", fontWeight: 500, textAlign: "right" as const },
  none:         { color: "var(--c-muted)", fontSize: "0.875rem", margin: 0 },
  eventCard:    { padding: "0.75rem", background: "var(--c-surface-2)", borderRadius: "6px", border: "1px solid var(--c-border)", display: "flex", flexDirection: "column" as const, gap: "0.5rem" },
  eventRow:     { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" },
  eventTitle:   { fontSize: "0.875rem", fontWeight: 500, color: "var(--c-text)" },
  eventMeta:    { fontSize: "0.75rem", color: "var(--c-muted)", marginTop: "0.125rem" },
  eventStatus:  { fontSize: "0.6875rem", padding: "0.125rem 0.375rem", borderRadius: "4px", background: "var(--c-surface-2)", color: "var(--c-muted)", fontWeight: 500 },
  eventActions: { display: "flex", gap: "0.5rem", flexWrap: "wrap" as const },
  editBtn:      { padding: "0.3rem 0.75rem", background: "var(--c-accent)", color: "#fff", borderRadius: 6, textDecoration: "none", fontSize: "0.8125rem", fontWeight: 600 },
  viewBtn:      { padding: "0.3rem 0.75rem", background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-text)", borderRadius: 6, textDecoration: "none", fontSize: "0.8125rem" },
} as const;
