import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { DetailsForm } from "./_components/DetailsForm";

export const metadata = { title: "Event — Details" };

// Step 1 — Details: the event's identity. Nothing about design or content.
export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          userPackages: {
            where: { status: "active" },
            include: { package: { select: { name: true } } },
            orderBy: { grantedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });
  if (!event) notFound();

  return (
    <DetailsForm
      event={{
        id: event.id,
        title: event.title,
        eventType: event.eventType,
        eventDate: event.eventDate.toISOString(),
        venueName: event.venueName ?? "",
        venueMapUrl: event.venueMapUrl ?? "",
        slug: event.slug,
      }}
      client={{
        name: event.user.name,
        email: event.user.email,
        packageName: event.user.userPackages[0]?.package.name ?? null,
      }}
    />
  );
}
