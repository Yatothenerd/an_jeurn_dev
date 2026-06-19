import { redirect } from "next/navigation";
import { getSession } from "@/lib/services/auth.service";
import { AdminShell } from "./_components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  return <AdminShell>{children}</AdminShell>;
}
