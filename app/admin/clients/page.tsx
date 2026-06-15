import { prisma } from "@/lib/db/prisma";
import { ClientsPageClient } from "./_components/ClientsPageClient";

export const metadata = { title: "Admin — Clients" };

export default async function ClientsPage() {
  const [clients, packages] = await Promise.all([
    prisma.user.findMany({
      where: { role: "client" },
      orderBy: { createdAt: "desc" },
      include: {
        userPackages: {
          orderBy: { grantedAt: "desc" },
          take: 1,
          include: { package: { select: { name: true } } },
        },
      },
    }),
    prisma.package.findMany({
      orderBy: { priceUsd: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return <ClientsPageClient clients={clients as never} packages={packages} />;
}
