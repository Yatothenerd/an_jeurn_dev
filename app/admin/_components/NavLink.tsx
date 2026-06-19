"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  icon?: string;
  children: React.ReactNode;
}

export function NavLink({ href, icon, children }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));

  return (
    <Link href={href} className={`admin-navlink${active ? " active" : ""}`}>
      {icon && <span className="ico" aria-hidden>{icon}</span>}
      <span>{children}</span>
    </Link>
  );
}
