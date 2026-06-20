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

  const n = invitations.length;

  return (
    <div>
      <h1 className="page-title">All Invitations</h1>
      <p className="page-summary">
        {n} invitation{n === 1 ? "" : "s"} across all clients
      </p>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Client</th>
              <th>Theme</th>
              <th>Date</th>
              <th>Status</th>
              <th className="num col-hide-sm">Sections</th>
              <th className="num col-hide-sm">Photos</th>
              <th className="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {n === 0 ? (
              <tr>
                <td colSpan={8} className="data-empty">No invitations yet.</td>
              </tr>
            ) : (
              invitations.map((inv) => (
                <tr key={inv.id}>
                  <td data-label="Event">
                    <div className="cell-title">{inv.event.title}</div>
                    <div className="cell-sub">/invite/{inv.event.slug}</div>
                  </td>
                  <td data-label="Client">
                    <div>{inv.event.user.name}</div>
                    <div className="cell-sub">{inv.event.user.email}</div>
                  </td>
                  <td data-label="Theme">{inv.theme.name}</td>
                  <td data-label="Date" style={{ color: "var(--c-muted)" }}>
                    {new Date(inv.event.eventDate).toLocaleDateString()}
                  </td>
                  <td data-label="Status">
                    <span className={`status-pill ${inv.isPublished ? "published" : "draft"}`}>
                      {inv.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td data-label="Sections" className="num col-hide-sm">{inv._count.sections}</td>
                  <td data-label="Photos" className="num col-hide-sm">{inv._count.photos}</td>
                  <td data-label="Actions" className="actions">
                    <span className="cell-actions">
                      {inv.isPublished ? (
                        <>
                          <a
                            className="btn-pill btn-view"
                            href={`/invite/${inv.event.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            title="View invite"
                          >
                            <span className="bi" aria-hidden>↗</span>
                            <span className="bl">View</span>
                          </a>
                          <ForceUnpublishButton invitationId={inv.id} />
                        </>
                      ) : (
                        <span className="cell-sub">—</span>
                      )}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
