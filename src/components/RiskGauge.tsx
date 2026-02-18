'use client'

import { getRiskColor, getRiskLevel, type RiskWithCI } from '@/lib/ncd-cie-engine'
import { formatPercent } from '@/lib/utils'

interface RiskGaugeProps {
  label: string
  risk: RiskWithCI
  size?: 'sm' | 'md' | 'lg'
  showCI?: boolean
}

export default function RiskGauge({ label, risk, size = 'md', showCI = true }: RiskGaugeProps) {
  const sizes = {
    sm: { width: 100, stroke: 6, fontSize: 14, labelSize: 10 },
    md: { width: 140, stroke: 8, fontSize: 20, labelSize: 12 },
    lg: { width: 180, stroke: 10, fontSize: 28, labelSize: 14 },
  }
  const s = sizes[size]
  const radius = (s.width - s.stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(risk.value, 1)
  const offset = circumference * (1 - progress)
  const color = getRiskColor(risk.value)
  const level = getRiskLevel(risk.value)

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: s.width, height: s.width }}>
        <svg width={s.width} height={s.width} className="-rotate-90">
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
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold" style={{ fontSize: s.fontSize, color }}>
            {formatPercent(risk.value)}
          </span>
          <span
            className="font-medium text-slate-500 dark:text-slate-400"
            style={{ fontSize: s.labelSize }}
          >
            {level}
          </span>
        </div>
      </div>
      <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{label}</span>
      {showCI && (
        <span className="text-xs text-slate-400 dark:text-slate-500">
          CI: {formatPercent(risk.ci_low)} – {formatPercent(risk.ci_high)}
        </span>
      )}
    </div>
  )
}
