import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db/prisma";
import { GuestListClient } from "./_components/GuestListClient";

export const metadata = { title: "Guest List" };

export default async function GuestListPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "client") redirect("/login");

  const { id } = await params;

  const event = await prisma.event.findFirst({
    where: { id, userId: session.sub },
  });
  if (!event) notFound();

  const [guests, userPkg] = await Promise.all([
    prisma.guest.findMany({
      where: { eventId: id },
      orderBy: [{ rsvpStatus: "asc" }, { name: "asc" }],
    }),
    prisma.userPackage.findFirst({
      where: { userId: session.sub, status: "active" },
      include: { package: { select: { maxGuests: true, hasGuestControl: true } } },
      orderBy: { grantedAt: "desc" },
    }),
  ]);

  const counts = {
    attending: guests.filter((g) => g.rsvpStatus === "attending").length,
    declined: guests.filter((g) => g.rsvpStatus === "declined").length,
    pending: guests.filter((g) => !g.rsvpStatus).length,
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <a href="/dashboard" className="back-btn" style={{ marginBottom: "0.6rem" }}>
            <span className="ico" aria-hidden>←</span> Dashboard
          </a>
          <h1 style={s.title}>{event.title} — Guests</h1>
        </div>
        <a
          href={`/api/dashboard/events/${id}/guests/export`}
          download
          style={s.exportBtn}
        >
          Export CSV
        </a>
      </div>

      {/* RSVP summary — single equal-width row (2 columns on phones) */}
      <div className="rsvp-stats">
        <div style={{ ...s.stat, background: "#dcfce7", color: "#166534" }}>
          <span style={s.statNum}>{counts.attending}</span>
          <span style={s.statLabel}>Attending</span>
        </div>
        <div style={{ ...s.stat, background: "#fee2e2", color: "#991b1b" }}>
          <span style={s.statNum}>{counts.declined}</span>
          <span style={s.statLabel}>Declined</span>
        </div>
        <div style={{ ...s.stat, background: "#fef3c7", color: "#92400e" }}>
          <span style={s.statNum}>{counts.pending}</span>
          <span style={s.statLabel}>Pending</span>
        </div>
        <div style={{ ...s.stat, background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
          <span style={s.statNum}>{guests.length}{userPkg?.package.maxGuests ? ` / ${userPkg.package.maxGuests}` : ""}</span>
          <span style={s.statLabel}>Total</span>
        </div>
      </div>

      {/* Compact event-info banner */}
      <div className="event-banner">
        {userPkg?.package.hasGuestControl && <span className="chip">🎛 Guest Control ON</span>}
        <span><strong>{guests.length}</strong> guest{guests.length === 1 ? "" : "s"}{userPkg?.package.maxGuests ? ` of ${userPkg.package.maxGuests}` : ""}</span>
      </div>

      <GuestListClient
        eventId={id}
        eventTitle={event.title}
        inviteBaseUrl={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/invite/${event.slug}`}
        initialGuests={guests.map((g) => ({
          id: g.id,
          name: g.name,
          token: g.token,
          contact: g.contact,
          contactType: g.contactType,
          rsvpStatus: g.rsvpStatus,
          mealPref: g.mealPref,
          rsvpAt: g.rsvpAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}

const s = {
  page: { maxWidth: "860px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem", flexWrap: "wrap" as const, gap: "0.75rem" },
  back: { color: "var(--c-muted)", textDecoration: "none", fontSize: "0.8125rem", display: "block", marginBottom: "0.25rem" },
  title: { margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--c-text)" },
  exportBtn: {
    padding: "0.5rem 1rem",
    background: "var(--c-surface)",
    border: "1px solid var(--c-border)",
    borderRadius: "7px",
    color: "var(--c-text)",
    textDecoration: "none",
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  stats: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" },
  stat: { borderRadius: "10px", padding: "1rem 1.25rem", display: "flex", flexDirection: "column" as const, gap: "0.25rem" },
  statNum: { fontSize: "1.625rem", fontWeight: 700, lineHeight: 1 },
  statLabel: { fontSize: "0.8125rem", fontWeight: 500 },
} as const;
