'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  className?: string;
  activeClassName?: string;
  children: ReactNode;
  [key: string]: any;
}

const NavLink = ({
  href,
  className,
  activeClassName,
  children,
  ...props
}: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(className, isActive && activeClassName)}
      {...props}
    >
      {children}
    </Link>
  );
};

NavLink.displayName = "NavLink";

export { NavLink };
