'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/time-management/today', label: 'Today' },
  { href: '/time-management/records', label: 'Records' },
  { href: '/time-management/review', label: 'Review' },
]

export default function TimeNavigation() {
  const pathname = usePathname()
  return (
    <nav aria-label="Time management" className="flex gap-2 overflow-x-auto border-b border-border pb-3">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={pathname === link.href ? 'page' : undefined}
          className={`inline-flex min-h-11 items-center rounded-lg px-4 font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
            pathname === link.href ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-border'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
