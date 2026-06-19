"use client";

import { useEffect, useState } from "react";
import { NavLink } from "./NavLink";
import { LogoutButton } from "./LogoutButton";

const GROUPS: { label: string; items: { href: string; icon: string; label: string }[] }[] = [
  { label: "Overview", items: [{ href: "/admin", icon: "📊", label: "Dashboard" }] },
  {
    label: "Clients",
    items: [
      { href: "/admin/clients", icon: "👥", label: "Clients" },
      { href: "/admin/packages", icon: "📦", label: "Packages" },
    ],
  },
  {
    label: "Events",
    items: [
      { href: "/admin/events/new", icon: "➕", label: "New Event" },
      { href: "/admin/invitations", icon: "✉️", label: "Invitations" },
    ],
  },
  { label: "Design", items: [{ href: "/admin/themes", icon: "🎨", label: "Themes" }] },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem("admin-theme");
    if (saved === "dark" || saved === "light") setTheme(saved);
  }, []);

  function toggleTheme() {
    setTheme((t) => {
      const next = t === "light" ? "dark" : "light";
      localStorage.setItem("admin-theme", next);
      return next;
    });
  }

  return (
    <div className="admin-root" data-theme={theme}>
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <span className="admin-brand-name">Anjeurn</span>
            <button
              className="admin-icon-btn"
              onClick={toggleTheme}
              title="Toggle dark mode"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
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

          <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
            <LogoutButton />
          </div>
        </aside>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
