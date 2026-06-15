import { redirect } from "next/navigation";
import { getSession } from "@/lib/services/auth.service";
import { NavLink } from "./_components/NavLink";
import { LogoutButton } from "./_components/LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  return (
    <div style={s.wrapper}>
      <aside style={s.sidebar}>
        <div style={s.logo}>Anjeurn</div>
        <nav style={s.nav}>
          <NavLink href="/admin">Dashboard</NavLink>
          <NavLink href="/admin/clients">Clients</NavLink>
          <NavLink href="/admin/packages">Packages</NavLink>
          <NavLink href="/admin/themes">Themes</NavLink>
          <NavLink href="/admin/invitations">Invitations</NavLink>
        </nav>
        <LogoutButton />
      </aside>
      <main style={s.main}>{children}</main>
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
    width: "224px",
    background: "#111827",
    color: "#fff",
    padding: "1.5rem 1rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.25rem",
    flexShrink: 0,
    position: "sticky" as const,
    top: 0,
    height: "100vh",
  },
  logo: {
    fontWeight: 700,
    fontSize: "1.125rem",
    color: "#f9fafb",
    marginBottom: "2rem",
    paddingLeft: "0.75rem",
    letterSpacing: "-0.02em",
  },
  nav: { display: "flex", flexDirection: "column" as const, gap: "0.125rem", flex: 1 },
  main: {
    flex: 1,
    padding: "2rem 2.5rem",
    background: "#f9fafb",
    overflowY: "auto" as const,
  },
} as const;
