'use client'

import { cn } from '@/lib/utils'

interface SkipLinkProps {
  href?: string
  className?: string
  children?: React.ReactNode
}

export function SkipLink({
  href = '#main-content',
  className,
  children = 'Skip to main content'
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100]',
        'bg-clinical-600 text-white px-4 py-2 rounded-lg font-medium',
        'focus:outline-none focus:ring-2 focus:ring-clinical-400 focus:ring-offset-2',
        'transition-transform transform -translate-y-16 focus:translate-y-0',
        className
      )}
    >
      {children}
    </a>
  )
}

export function SkipLinks() {
  return (
    <div className="skip-links">
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#navigation" className="focus:left-48">Skip to navigation</SkipLink>
    </div>
  )
}
