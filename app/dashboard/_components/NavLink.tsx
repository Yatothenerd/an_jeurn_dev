"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link href={href} style={{ ...s.link, ...(active ? s.active : {}) }}>
      {children}
    </Link>
  );
}

const s = {
  link: {
    color: "#475569",
    textDecoration: "none",
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.875rem",
    display: "block",
    fontWeight: 500,
  },
  active: { background: "#f1f5f9", color: "#0f172a" },
} as const;
