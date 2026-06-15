"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      style={{
        ...s.link,
        ...(active ? s.active : {}),
      }}
    >
      {children}
    </Link>
  );
}

const s = {
  link: {
    color: "#9ca3af",
    textDecoration: "none",
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.875rem",
    display: "block",
    transition: "background 0.1s, color 0.1s",
  },
  active: {
    background: "#1f2937",
    color: "#f9fafb",
  },
} as const;
