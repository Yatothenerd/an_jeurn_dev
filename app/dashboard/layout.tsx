import { redirect } from "next/navigation";
import { getSession } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db/prisma";
import { NavLink } from "./_components/NavLink";
import { LogoutButton } from "./_components/LogoutButton";
import { ClientThemeProvider, ClientThemeToggle } from "./_components/ClientThemeProvider";

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
    <ClientThemeProvider>
      <div className="app-shell">
        <aside className="app-sidebar">
          <div style={s.brand} className="sidebar-brand-flourish">
            <img src="/logo/mark.svg" alt="Anjeurn" style={{ height: 36, display: "block" }} />
          </div>

          {activePackage && <div style={s.pkgBadge}>{activePackage.package.name}</div>}

          <nav className="app-nav">
            <NavLink href="/dashboard">My Events</NavLink>
          </nav>

          <div style={s.userSection}>
            <div style={s.userName}>{user.name}</div>
            <div style={s.userEmail}>{user.email}</div>
          </div>
        </aside>

        <main className="app-main">
          <header className="dash-topbar">
            <div className="topbar-search">
              <span aria-hidden>🔍</span>
              <input type="search" placeholder="Search…" aria-label="Search" />
            </div>
            <div className="topbar-right">
              <div className="topbar-profile">
                <span className="topbar-avatar">{user.name.trim().charAt(0).toUpperCase() || "U"}</span>
                <span className="topbar-name">{user.name}</span>
              </div>
              <ClientThemeToggle />
              <LogoutButton />
            </div>
          </header>
          {!activePackage && (
            <div style={s.noPackageBanner}>
              Your account does not have an active package. Please contact the administrator.
            </div>
          )}
          {children}
        </main>
      </div>
    </ClientThemeProvider>
  );
}

const s = {
  brand: {
    marginBottom: "0.75rem",
    paddingLeft: "0.75rem",
  },
  pkgBadge: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--c-accent)",
    background: "var(--c-accent-soft)",
    border: "1px solid transparent",
    borderRadius: "5px",
    padding: "0.25rem 0.625rem",
    marginBottom: "0.5rem",
    marginLeft: "0.25rem",
    display: "inline-block",
  },
  userSection: { borderTop: "1px solid var(--c-border)", paddingTop: "0.75rem", marginTop: "auto" },
  userName: { fontSize: "0.875rem", fontWeight: 600, color: "var(--c-text)", paddingLeft: "0.75rem" },
  userEmail: { fontSize: "0.75rem", color: "var(--c-muted)", paddingLeft: "0.75rem", marginTop: "0.125rem" },
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
