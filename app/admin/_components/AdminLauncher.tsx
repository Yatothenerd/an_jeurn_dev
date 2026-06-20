"use client";

import Link from "next/link";
import { Icon } from "./Icon";
import { useAdminTheme } from "./ThemeProvider";

// App-style icon grid shown on mobile in place of the desktop sidebar/tables.
const LINKS = [
  { href: "/admin", icon: "dashboard", label: "Dashboard" },
  { href: "/admin/invitations", icon: "invitation", label: "Invitations" },
  { href: "/admin/events/new", icon: "new-invitation", label: "New Invitation" },
  { href: "/admin/clients", icon: "client", label: "Clients" },
  { href: "/admin/packages", icon: "package", label: "Packages" },
  { href: "/admin/themes", icon: "theme", label: "Themes" },
  { href: "/admin/invitations", icon: "guest", label: "Guests" },
  { href: "/admin/events/new", icon: "new-guest", label: "Add Guest" },
];

export function AdminLauncher() {
  const { theme, setTheme } = useAdminTheme();

  return (
    <div className="launcher">
      {LINKS.map((l) => (
        <Link key={l.label} href={l.href} className="launcher-card">
          <span className="launcher-ico"><Icon name={l.icon} size={26} /></span>
          <span className="launcher-label">{l.label}</span>
        </Link>
      ))}
      <button
        className={`launcher-card${theme === "light" ? " active" : ""}`}
        onClick={() => setTheme("light")}
      >
        <span className="launcher-ico"><Icon name="day" size={26} /></span>
        <span className="launcher-label">Day Mode</span>
      </button>
      <button
        className={`launcher-card${theme === "dark" ? " active" : ""}`}
        onClick={() => setTheme("dark")}
      >
        <span className="launcher-ico"><Icon name="night" size={26} /></span>
        <span className="launcher-label">Night Mode</span>
      </button>
    </div>
  );
}
