'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊', description: 'Overview of patient risk assessment' },
  { href: '/profile', label: 'Patient Profile', icon: '👤', description: 'View and edit patient data' },
  { href: '/risk', label: 'Risk Assessment', icon: '⚠️', description: 'Detailed risk analysis' },
  { href: '/what-if', label: 'What-If Simulator', icon: '🔬', description: 'Simulate interventions' },
  { href: '/knowledge-graph', label: 'Knowledge Graph', icon: '🧠', description: 'Explore causal relationships' },
  { href: '/progress', label: 'Progress Tracker', icon: '📈', description: 'Track patient progress over time' },
  { href: '/report', label: 'Clinical Report', icon: '📋', description: 'Generate clinical reports' },
  { href: '/about', label: 'About & Evidence', icon: '📖', description: 'Methodology and validation' },
]

export default function Navigation() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const isDark = localStorage.getItem('ncd-care-plus-theme') === 'dark' ||
      (!localStorage.getItem('ncd-care-plus-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)

    // Restore collapsed state
    const savedCollapsed = localStorage.getItem('ncd-care-plus-nav-collapsed')
    if (savedCollapsed) {
      setCollapsed(savedCollapsed === 'true')
    }
  }, [])

  const toggleDark = useCallback(() => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('ncd-care-plus-theme', next ? 'dark' : 'light')
  }, [dark])

  const toggleCollapsed = useCallback(() => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('ncd-care-plus-nav-collapsed', String(next))
  }, [collapsed])

  const closeMobileMenu = useCallback(() => {
    setMobileOpen(false)
    mobileMenuButtonRef.current?.focus()
  }, [])

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        closeMobileMenu()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen, closeMobileMenu])

  // Trap focus within mobile menu when open
  useEffect(() => {
    if (mobileOpen && sidebarRef.current) {
      const focusableElements = sidebarRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      firstElement?.focus()
    }
  }, [mobileOpen])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <>
      {/* Mobile header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 no-print"
        role="banner"
      >
        <div className="flex items-center justify-between">
          <button
            ref={mobileMenuButtonRef}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            <svg
              className="w-6 h-6 text-slate-600 dark:text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinical-500 rounded-lg px-1"
            aria-label="NCD-Care+ Home"
          >
            <span className="text-xl" role="img" aria-hidden="true">🏥</span>
            <span className="font-bold text-clinical-700 dark:text-clinical-400">NCD-Care+</span>
          </Link>
          <button
            onClick={toggleDark}
            className="p-2 -mr-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="text-xl" role="img" aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar navigation */}
      <aside
        ref={sidebarRef}
        id="mobile-navigation"
        className={cn(
          'fixed top-0 left-0 h-full z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800',
          'transition-all duration-300 ease-out no-print flex flex-col',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className={cn(
          'p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 flex-shrink-0',
          collapsed && 'justify-center'
        )}>
          <Link
            href="/"
            className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinical-500 rounded-lg"
            aria-label="NCD-Care+ Home"
          >
            <span className="text-2xl" role="img" aria-hidden="true">🏥</span>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg text-clinical-700 dark:text-clinical-400">NCD-Care+</h1>
                <p className="text-[10px] text-slate-400 leading-tight">Clinical Decision Support</p>
              </div>
            )}
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto" aria-label="Primary">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-clinical-50 dark:bg-clinical-950 text-clinical-700 dark:text-clinical-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200',
                  collapsed && 'justify-center px-2',
                )}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
              >
                <span
                  className={cn(
                    'text-lg transition-transform duration-200',
                    !isActive && 'group-hover:scale-110'
                  )}
                  role="img"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {isActive && !collapsed && (
                  <span className="sr-only">(current page)</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer with controls */}
        <div className={cn(
          'p-3 border-t border-slate-200 dark:border-slate-800 space-y-1 flex-shrink-0',
          collapsed && 'flex flex-col items-center'
        )}>
          <button
            onClick={toggleDark}
            className={cn(
              'hidden lg:flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 w-full text-sm text-slate-600 dark:text-slate-400 transition-colors',
              collapsed && 'justify-center w-auto px-2'
            )}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span role="img" aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
            {!collapsed && <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button
            onClick={toggleCollapsed}
            className={cn(
              'hidden lg:flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 w-full text-sm text-slate-600 dark:text-slate-400 transition-colors',
              collapsed && 'justify-center w-auto px-2'
            )}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-expanded={!collapsed}
          >
            <svg
              className={cn(
                'w-4 h-4 transition-transform duration-300',
                collapsed && 'rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Spacer for main content on desktop */}
      <div
        className={cn(
          'hidden lg:block flex-shrink-0 transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
        aria-hidden="true"
      />
    </>
  )
}
