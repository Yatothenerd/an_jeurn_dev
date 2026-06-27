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
      <div className="brand-panel-head">
        <span className="brand-eyebrow">New invitation</span>
        <h1 className="brand-h1">Create Event</h1>
        <p className="brand-lead">
          Create and assign an invitation event to a client. The client manages content and guests afterward.
        </p>
      </div>
      <NewEventForm clients={list} />
    </div>
  );
}
