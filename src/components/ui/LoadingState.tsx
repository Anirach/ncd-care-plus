'use client'

import { cn } from '@/lib/utils'

interface LoadingStateProps {
  variant?: 'page' | 'card' | 'inline'
  rows?: number
  className?: string
  label?: string
}

export function LoadingState({
  variant = 'page',
  rows = 3,
  className,
  label = 'Loading content'
}: LoadingStateProps) {
  if (variant === 'inline') {
    return (
      <div
        className={cn('flex items-center gap-2', className)}
        role="status"
        aria-label={label}
      >
        <div className="w-4 h-4 border-2 border-clinical-200 border-t-clinical-600 rounded-full animate-spin" />
        <span className="text-sm text-slate-500 dark:text-slate-400">{label}...</span>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div
        className={cn('card-clinical animate-pulse', className)}
        role="status"
        aria-label={label}
      >
        <div className="space-y-4">
          <div className="h-5 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded" style={{ width: `${100 - i * 15}%` }} />
          ))}
        </div>
        <span className="sr-only">{label}</span>
      </div>
    )
  }

  return (
    <div
      className={cn('space-y-6', className)}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-40 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}

export function LoadingSpinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  }

  return (
    <div
      className={cn(
        'border-clinical-200 border-t-clinical-600 rounded-full animate-spin',
        sizes[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading</span>
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('card-clinical animate-pulse', className)}>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  )
}
