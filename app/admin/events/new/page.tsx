import { redirect } from "next/navigation";
import { getSession } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db/prisma";
import { NewEventForm } from "../_components/NewEventForm";

export const metadata = { title: "New Event" };

export default async function AdminNewEventPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  const clients = await prisma.user.findMany({
    where: { role: "client" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      userPackages: {
        where: { status: "active" },
        take: 1,
        orderBy: { grantedAt: "desc" },
        select: { package: { select: { name: true } } },
      },
    },
  });

  const list = clients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    packageName: c.userPackages[0]?.package.name ?? null,
  }));

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 700, color: "var(--c-text)" }}>
        Create Event
      </h1>
      <p style={{ margin: "0 0 1.5rem", color: "var(--c-muted)", fontSize: "0.9375rem" }}>
        Create and assign an invitation event to a client. The client manages content and guests afterward.
      </p>
      <NewEventForm clients={list} />
    </div>
  );
}
