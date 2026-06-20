"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

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
      {icon && <span className="ico"><Icon name={icon} size={18} /></span>}
      <span>{children}</span>
    </Link>
  );
}
