"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavLink } from "./NavLink";
import { LogoutButton } from "./LogoutButton";
import { Icon } from "./Icon";
import { useAdminTheme } from "./ThemeProvider";

const GROUPS: { label: string; items: { href: string; icon: string; label: string }[] }[] = [
  { label: "Overview", items: [{ href: "/admin", icon: "dashboard", label: "Dashboard" }] },
  {
    label: "Clients",
    items: [
      { href: "/admin/clients", icon: "client", label: "Clients" },
      { href: "/admin/packages", icon: "package", label: "Packages" },
    ],
  },
  {
    label: "Events",
    items: [
      { href: "/admin/events/new", icon: "new-invitation", label: "New Event" },
      { href: "/admin/invitations", icon: "invitation", label: "Invitations" },
    ],
  },
  { label: "Design", items: [{ href: "/admin/themes", icon: "theme", label: "Themes" }] },
];

const BOTTOM_NAV = [
  { href: "/admin", icon: "dashboard", label: "Overview" },
  { href: "/admin/clients", icon: "client", label: "Clients" },
  { href: "/admin/invitations", icon: "invitation", label: "Events" },
  { href: "/admin/themes", icon: "theme", label: "Design" },
];

export function AdminShell({ children, userName = "Admin" }: { children: React.ReactNode; userName?: string }) {
  const pathname = usePathname();
  const { theme, toggle } = useAdminTheme();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const initial = userName.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-name">Anjeurn</span>
        </div>

        {GROUPS.map((g) => {
          const isCollapsed = collapsed[g.label];
          return (
            <div key={g.label} className="admin-navgroup">
              <button
                className="admin-group-label"
                onClick={() => setCollapsed((c) => ({ ...c, [g.label]: !c[g.label] }))}
              >
                <span>{g.label}</span>
                <span aria-hidden>{isCollapsed ? "▸" : "▾"}</span>
              </button>
              {!isCollapsed &&
                g.items.map((it) => (
                  <NavLink key={it.href} href={it.href} icon={it.icon}>
                    {it.label}
                  </NavLink>
                ))}
            </div>
          );
        })}
      </aside>

      <main className="admin-main">
        <header className="dash-topbar">
          <div className="topbar-search">
            <span aria-hidden>🔍</span>
            <input type="search" placeholder="Search…" aria-label="Search" />
          </div>
          <div className="topbar-right">
            <button className="icon-btn" title="Notifications" aria-label="Notifications">🔔</button>
            <button className="icon-btn" title="Messages" aria-label="Messages">✉️</button>
            <button className="icon-btn" onClick={toggle} title="Toggle dark mode" aria-label="Toggle dark mode">
              <Icon name={theme === "dark" ? "day" : "night"} size={16} />
            </button>
            <div className="topbar-profile">
              <span className="topbar-avatar">{initial}</span>
              <span className="topbar-name">{userName}</span>
            </div>
            <LogoutButton />
          </div>
        </header>
        {children}
      </main>

      {/* Mobile bottom navigation (icon-based, app-style) */}
      <nav className="admin-bottomnav">
        {BOTTOM_NAV.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={active ? "active" : undefined}>
              <span className="bico"><Icon name={item.icon} size={20} /></span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
