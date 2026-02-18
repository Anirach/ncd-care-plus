'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/profile', label: 'Patient Profile', icon: '👤' },
  { href: '/risk', label: 'Risk Assessment', icon: '⚠️' },
  { href: '/what-if', label: 'What-If Simulator', icon: '🔬' },
  { href: '/knowledge-graph', label: 'Knowledge Graph', icon: '🧠' },
  { href: '/progress', label: 'Progress Tracker', icon: '📈' },
  { href: '/report', label: 'Clinical Report', icon: '📋' },
  { href: '/about', label: 'About & Evidence', icon: '📖' },
]

export default function Navigation() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const isDark = localStorage.getItem('ncd-care-plus-theme') === 'dark' ||
      (!localStorage.getItem('ncd-care-plus-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('ncd-care-plus-theme', next ? 'dark' : 'light')
  }

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between no-print">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <span className="text-xl">☰</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">🏥</span>
          <span className="font-bold text-clinical-700 dark:text-clinical-400">NCD-Care+</span>
        </div>
        <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          {dark ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 no-print flex flex-col',
        collapsed ? 'w-16' : 'w-64',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        {/* Logo */}
        <div className={cn('p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3', collapsed && 'justify-center')}>
          <span className="text-2xl">🏥</span>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg text-clinical-700 dark:text-clinical-400">NCD-Care+</h1>
              <p className="text-[10px] text-slate-400 leading-tight">Clinical Decision Support</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                pathname === item.href
                  ? 'bg-clinical-50 dark:bg-clinical-950 text-clinical-700 dark:text-clinical-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800',
                collapsed && 'justify-center px-2',
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className={cn('p-3 border-t border-slate-200 dark:border-slate-800 space-y-2', collapsed && 'flex flex-col items-center')}>
          <button onClick={toggleDark} className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 w-full text-sm text-slate-600 dark:text-slate-400">
            <span>{dark ? '☀️' : '🌙'}</span>
            {!collapsed && <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 w-full text-sm text-slate-600 dark:text-slate-400"
          >
            <span>{collapsed ? '→' : '←'}</span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Spacer for main content */}
      <div className={cn('hidden lg:block flex-shrink-0 transition-all duration-300', collapsed ? 'w-16' : 'w-64')} />
    </>
  )
}
