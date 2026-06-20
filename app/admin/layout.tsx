import { redirect } from "next/navigation";
import { getSession } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db/prisma";
import { ThemeProvider } from "./_components/ThemeProvider";
import { AdminShell } from "./_components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.sub }, select: { name: true } });

  return (
    <ThemeProvider>
      <AdminShell userName={user?.name ?? "Admin"}>{children}</AdminShell>
    </ThemeProvider>
  );
}
