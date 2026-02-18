'use client'

import { useMemo } from 'react'
import { getRiskColor, getRiskLevel, type RiskWithCI } from '@/lib/ncd-cie-engine'
import { formatPercent, cn } from '@/lib/utils'

interface RiskGaugeProps {
  label: string
  risk: RiskWithCI
  size?: 'sm' | 'md' | 'lg'
  showCI?: boolean
  className?: string
  animate?: boolean
}

const sizes = {
  sm: { width: 100, stroke: 6, fontSize: 14, labelSize: 10 },
  md: { width: 140, stroke: 8, fontSize: 20, labelSize: 12 },
  lg: { width: 180, stroke: 10, fontSize: 28, labelSize: 14 },
}

export default function RiskGauge({
  label,
  risk,
  size = 'md',
  showCI = true,
  className,
  animate = true
}: RiskGaugeProps) {
  const s = sizes[size]
  const radius = (s.width - s.stroke) / 2
  const circumference = 2 * Math.PI * radius

  const { progress, offset, color, level } = useMemo(() => {
    const progress = Math.min(Math.max(risk.value, 0), 1)
    const offset = circumference * (1 - progress)
    const color = getRiskColor(risk.value)
    const level = getRiskLevel(risk.value)
    return { progress, offset, color, level }
  }, [risk.value, circumference])

  const riskPercentage = formatPercent(risk.value)
  const ariaLabel = `${label || 'Risk'}: ${riskPercentage}, ${level} risk${showCI ? `. 95% confidence interval: ${formatPercent(risk.ci_low)} to ${formatPercent(risk.ci_high)}` : ''}`

  return (
    <div
      className={cn('flex flex-col items-center gap-1', className)}
      role="figure"
      aria-label={ariaLabel}
    >
      <div
        className="relative"
        style={{ width: s.width, height: s.width }}
      >
        <svg
          width={s.width}
          height={s.width}
          className="-rotate-90"
          aria-hidden="true"
          focusable="false"
        >
          {/* Background circle */}
          <circle
            cx={s.width / 2}
            cy={s.width / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            className="text-slate-200 dark:text-slate-700"
          />
          {/* Progress circle */}
          <circle
            cx={s.width / 2}
            cy={s.width / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={s.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn(
              animate && 'animate-gauge-fill',
              'transition-all duration-700 ease-out'
            )}
            style={{
              filter: `drop-shadow(0 0 6px ${color}40)`,
              '--initial-offset': circumference,
            } as React.CSSProperties}
          />
        </svg>

        {/* Center content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          aria-hidden="true"
        >
          <span
            className="font-bold tabular-nums"
            style={{ fontSize: s.fontSize, color }}
          >
            {riskPercentage}
          </span>
          <span
            className="font-medium text-slate-500 dark:text-slate-400"
            style={{ fontSize: s.labelSize }}
          >
            {level}
          </span>
        </div>
      </div>

      {/* Label */}
      {label && (
        <span
          className={cn(
            'font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight',
            size === 'sm' ? 'text-xs max-w-[90px]' : size === 'md' ? 'text-sm max-w-[130px]' : 'text-base max-w-[170px]'
          )}
        >
          {label}
        </span>
      )}

      {/* Confidence interval */}
      {showCI && (
        <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
          <span className="sr-only">95% confidence interval:</span>
          {formatPercent(risk.ci_low)} – {formatPercent(risk.ci_high)}
        </span>
      )}
    </div>
  )
}

// Compact inline variant for tables/lists
export function RiskIndicator({
  value,
  showLabel = true,
  size = 'sm',
  className
}: {
  value: number
  showLabel?: boolean
  size?: 'xs' | 'sm' | 'md'
  className?: string
}) {
  const color = getRiskColor(value)
  const level = getRiskLevel(value)
  const percentage = formatPercent(value)

  const dotSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3'
  }

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      role="img"
      aria-label={`${percentage} ${level} risk`}
    >
      <span
        className={cn('rounded-full flex-shrink-0', dotSizes[size])}
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="font-semibold tabular-nums" style={{ color }}>
        {percentage}
      </span>
      {showLabel && (
        <span className="text-slate-500 dark:text-slate-400 text-xs">
          {level}
        </span>
      )}
    </span>
  )
}

// Mini gauge for dense layouts
export function MiniGauge({
  value,
  size = 32,
  strokeWidth = 3,
  className
}: {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(value, 0), 1)
  const offset = circumference * (1 - progress)
  const color = getRiskColor(value)

  return (
    <div
      className={cn('relative inline-flex', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${formatPercent(value)} risk`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-2xs font-bold tabular-nums"
        style={{ color }}
        aria-hidden="true"
      >
        {Math.round(value * 100)}
      </span>
    </div>
  )
}
