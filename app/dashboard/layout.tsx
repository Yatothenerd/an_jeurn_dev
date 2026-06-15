import { redirect } from "next/navigation";
import { getSession } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db/prisma";
import { NavLink } from "./_components/NavLink";
import { LogoutButton } from "./_components/LogoutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "client") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: {
      userPackages: {
        where: { status: "active" },
        orderBy: { grantedAt: "desc" },
        take: 1,
        include: { package: { select: { name: true } } },
      },
    },
  });

  if (!user) redirect("/login");

  const activePackage = user.userPackages[0];

  return (
    <div style={s.wrapper}>
      <aside style={s.sidebar}>
        <div style={s.brand}>Anjeurn</div>

        {activePackage && (
          <div style={s.pkgBadge}>{activePackage.package.name}</div>
        )}

        <nav style={s.nav}>
          <NavLink href="/dashboard">My Events</NavLink>
        </nav>

        <div style={s.userSection}>
          <div style={s.userName}>{user.name}</div>
          <div style={s.userEmail}>{user.email}</div>
          <div style={{ marginTop: "0.75rem" }}>
            <LogoutButton />
          </div>
        </div>
      </aside>

      <main style={s.main}>
        {!activePackage && (
          <div style={s.noPackageBanner}>
            Your account does not have an active package. Please contact the administrator.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

const s = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  sidebar: {
    width: "220px",
    background: "#fff",
    borderRight: "1px solid #e2e8f0",
    padding: "1.5rem 1rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
    flexShrink: 0,
    position: "sticky" as const,
    top: 0,
    height: "100vh",
  },
  brand: {
    fontWeight: 700,
    fontSize: "1.125rem",
    color: "#0f172a",
    marginBottom: "0.75rem",
    paddingLeft: "0.75rem",
    letterSpacing: "-0.02em",
  },
  pkgBadge: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#7c3aed",
    background: "#f5f3ff",
    border: "1px solid #ede9fe",
    borderRadius: "5px",
    padding: "0.25rem 0.625rem",
    marginBottom: "0.5rem",
    marginLeft: "0.25rem",
    display: "inline-block",
  },
  nav: { display: "flex", flexDirection: "column" as const, gap: "0.125rem", flex: 1 },
  userSection: { borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" },
  userName: { fontSize: "0.875rem", fontWeight: 600, color: "#0f172a", paddingLeft: "0.75rem" },
  userEmail: { fontSize: "0.75rem", color: "#94a3b8", paddingLeft: "0.75rem", marginTop: "0.125rem" },
  main: { flex: 1, padding: "2rem 2.5rem", background: "#f8fafc", overflowY: "auto" as const },
  noPackageBanner: {
    marginBottom: "1.5rem",
    padding: "0.875rem 1rem",
    background: "#fef9c3",
    border: "1px solid #fde047",
    borderRadius: "8px",
    color: "#854d0e",
    fontSize: "0.875rem",
  },
} as const;
