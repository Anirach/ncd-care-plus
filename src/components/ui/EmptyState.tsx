'use client'

import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  variant?: 'default' | 'compact' | 'card'
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  className,
  variant = 'default'
}: EmptyStateProps) {
  if (variant === 'compact') {
    return (
      <div
        className={cn('text-center py-6', className)}
        role="status"
        aria-label={title}
      >
        <span className="text-2xl" role="img" aria-hidden="true">{icon}</span>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{title}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-3 text-sm text-clinical-600 dark:text-clinical-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-clinical-500 focus-visible:ring-offset-2 rounded"
          >
            {action.label}
          </button>
        )}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div
        className={cn('card-clinical text-center py-8', className)}
        role="status"
        aria-label={title}
      >
        <span className="text-4xl mb-3 block" role="img" aria-hidden="true">{icon}</span>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">{description}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="btn-primary mt-4 text-sm"
          >
            {action.label}
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn('flex flex-col items-center justify-center py-12 px-4', className)}
      role="status"
      aria-label={title}
    >
      <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <span className="text-4xl" role="img" aria-hidden="true">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 text-center">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center max-w-md">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary mt-6"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export function NoDataPlaceholder({
  message = 'No data available',
  suggestion,
  className
}: {
  message?: string
  suggestion?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl',
        className
      )}
      role="status"
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
        <svg
          className="w-6 h-6 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{message}</p>
      {suggestion && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{suggestion}</p>
      )}
    </div>
  )
}
