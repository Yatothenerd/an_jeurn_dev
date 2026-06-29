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
    label: "Event",
    items: [
      { href: "/admin/events/new", icon: "new-invitation", label: "New Event" },
      { href: "/admin/events", icon: "theme", label: "Event Format" },
      { href: "/admin/themes", icon: "theme", label: "Theme Builder" },
      { href: "/admin/invitations", icon: "invitation", label: "Invitations" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", icon: "settings", label: "Settings" },
    ],
  },
];

const BOTTOM_NAV = [
  { href: "/admin", icon: "dashboard", label: "Overview" },
  { href: "/admin/clients", icon: "client", label: "Clients" },
  { href: "/admin/events", icon: "theme", label: "Events" },
  { href: "/admin/invitations", icon: "invitation", label: "Invitations" },
];

// Destinations not in the bottom bar — surfaced via the "More" sheet on mobile.
const MORE_NAV = [
  { href: "/admin/events/new", icon: "new-invitation", label: "New Event" },
  { href: "/admin/packages", icon: "package", label: "Packages" },
  { href: "/admin/guests", icon: "guest", label: "Guests" },
  { href: "/admin/settings", icon: "settings", label: "Settings" },
];

export function AdminShell({ children, userName = "Admin" }: { children: React.ReactNode; userName?: string }) {
  const pathname = usePathname();
  const { theme, toggle } = useAdminTheme();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [moreOpen, setMoreOpen] = useState(false);
  const initial = userName.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-name">DASHBOARD</span>
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
            <button className="admin-icon-btn" onClick={toggle} title="Toggle dark mode" aria-label="Toggle dark mode">
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

      {/* Mobile "More" sheet — surfaces destinations not in the bottom bar */}
      {moreOpen && (
        <>
          <div className="admin-more-backdrop" onClick={() => setMoreOpen(false)} />
          <div className="admin-more-sheet" role="menu">
            <div className="admin-more-grip" />
            <div className="admin-more-grid">
              {MORE_NAV.map((item) => (
                <Link key={item.href} href={item.href} className="admin-more-item" onClick={() => setMoreOpen(false)}>
                  <span className="admin-more-ico"><Icon name={item.icon} size={22} /></span>
                  <span>{item.label}</span>
                </Link>
              ))}
              <button className="admin-more-item" onClick={() => { toggle(); setMoreOpen(false); }}>
                <span className="admin-more-ico"><Icon name={theme === "dark" ? "day" : "night"} size={22} /></span>
                <span>{theme === "dark" ? "Day Mode" : "Night Mode"}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile bottom navigation (icon-based, app-style) */}
      <nav className="admin-bottomnav">
        {BOTTOM_NAV.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={active ? "active" : undefined} onClick={() => setMoreOpen(false)}>
              <span className="bico"><Icon name={item.icon} size={20} /></span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button type="button" className={moreOpen ? "active" : undefined} onClick={() => setMoreOpen((o) => !o)} aria-label="More">
          <span className="bico"><Icon name="more" size={20} /></span>
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
