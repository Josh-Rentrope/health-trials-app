'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * A nav link that shows where you are.
 *
 * The header lives in a server component, so it cannot call `usePathname`
 * itself; this is the small client island that can. Without it the navigation
 * gives no feedback at all — every link looks equally inactive on every page.
 */
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  // "/" would otherwise match every route.
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={
        'rounded-md px-2.5 py-1.5 text-[13px] transition-colors ' +
        (active
          ? 'bg-accent-soft font-medium text-accent'
          : 'text-muted hover:bg-canvas hover:text-ink')
      }
    >
      {children}
    </Link>
  );
}
