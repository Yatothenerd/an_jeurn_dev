import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/services/auth.service";
import { redirect } from "next/navigation";
import { ForceUnpublishButton } from "./_components/ForceUnpublishButton";

export const metadata = { title: "Admin — Invitations" };

export default async function AdminInvitationsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  const invitations = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      theme: { select: { name: true } },
      event: {
        select: {
          title: true,
          slug: true,
          eventDate: true,
          user: { select: { name: true, email: true } },
        },
      },
      _count: { select: { sections: true, photos: true } },
    },
    take: 200,
  });

  return (
    <div>
      <h1 style={s.heading}>All Invitations</h1>
      <p style={s.sub}>{invitations.length} invitations across all clients</p>

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              {["Event", "Client", "Theme", "Date", "Status", "Sections", "Photos", "Actions"].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invitations.map((inv) => (
              <tr key={inv.id} style={s.tr}>
                <td style={s.td}>
                  <div style={{ fontWeight: 600 }}>{inv.event.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>/invite/{inv.event.slug}</div>
                </td>
                <td style={s.td}>
                  <div>{inv.event.user.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{inv.event.user.email}</div>
                </td>
                <td style={s.td}>{inv.theme.name}</td>
                <td style={{ ...s.td, fontSize: "0.8125rem", color: "#6b7280" }}>
                  {new Date(inv.event.eventDate).toLocaleDateString()}
                </td>
                <td style={s.td}>
                  <span style={{
                    padding: "0.2rem 0.625rem",
                    borderRadius: "999px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    background: inv.isPublished ? "#dcfce7" : "#f3f4f6",
                    color: inv.isPublished ? "#166534" : "#6b7280",
                  }}>
                    {inv.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
                <td style={{ ...s.td, textAlign: "center" as const }}>{inv._count.sections}</td>
                <td style={{ ...s.td, textAlign: "center" as const }}>{inv._count.photos}</td>
                <td style={s.td}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    {inv.isPublished && (
                      <a
                        href={`/invite/${inv.event.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        style={s.viewLink}
                      >
                        View ↗
                      </a>
                    )}
                    {inv.isPublished && (
                      <ForceUnpublishButton invitationId={inv.id} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const s = {
  heading: { margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 700, color: "#111" },
  sub: { margin: "0 0 1.5rem", color: "#6b7280", fontSize: "0.875rem" },
  tableWrap: { overflowX: "auto" as const },
  table: { width: "100%", borderCollapse: "collapse" as const, background: "#fff", borderRadius: "10px", overflow: "hidden", border: "1px solid #e5e7eb", fontSize: "0.875rem" },
  th: { padding: "0.75rem 1rem", textAlign: "left" as const, fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: "0.05em", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "0.875rem 1rem", verticalAlign: "middle" as const },
  viewLink: { padding: "0.25rem 0.625rem", background: "#eff6ff", color: "#1d4ed8", borderRadius: "5px", textDecoration: "none", fontSize: "0.8125rem", fontWeight: 500 },
} as const;
