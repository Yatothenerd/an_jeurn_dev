import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { GuestManager } from "./_components/GuestManager";

export const metadata = { title: "Event — Guests" };

// Step 4 — Guests: who's invited, their personalized links, and RSVP status.
export default async function EventGuestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      guests: { orderBy: { name: "asc" } },
    },
  });
  if (!event) notFound();

  return (
    <GuestManager
      eventId={event.id}
      slug={event.slug}
      initialGuests={event.guests.map((g) => ({
        id: g.id,
        name: g.name,
        contact: g.contact,
        token: g.token,
        rsvpStatus: g.rsvpStatus,
      }))}
    />
  );
}
