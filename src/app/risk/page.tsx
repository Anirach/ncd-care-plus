'use client'

import { useState, useEffect } from 'react'
import { type PatientProfile, computeAllRisksWithCI, computeRiskContributions, type FullRiskResult, getRiskColor, getRiskLevel, getRiskBgClass, type RiskContribution } from '@/lib/ncd-cie-engine'
import { loadPatients, getActivePatientId } from '@/lib/store'
import RiskGauge from '@/components/RiskGauge'
import { formatPercent, cn } from '@/lib/utils'

const diseases = [
  { id: 'cad', label: 'Coronary Artery Disease', abbr: 'CAD' },
  { id: 'stroke', label: 'Stroke', abbr: 'Stroke' },
  { id: 'hf', label: 'Heart Failure', abbr: 'HF' },
  { id: 'pad', label: 'Peripheral Artery Disease', abbr: 'PAD' },
  { id: 't2dm', label: 'Type 2 Diabetes', abbr: 'T2DM' },
  { id: 'ckd', label: 'Chronic Kidney Disease', abbr: 'CKD' },
  { id: 'nafld', label: 'Fatty Liver Disease', abbr: 'NAFLD' },
] as const

export default function RiskPage() {
  const [patient, setPatient] = useState<PatientProfile | null>(null)
  const [risks, setRisks] = useState<FullRiskResult | null>(null)
  const [selectedDisease, setSelectedDisease] = useState<string>('cad')
  const [contributions, setContributions] = useState<RiskContribution[]>([])

  useEffect(() => {
    const pts = loadPatients()
    const id = getActivePatientId()
    const active = pts.find(p => p.id === id) || pts[1]
    setPatient(active)
    const r = computeAllRisksWithCI(active)
    setRisks(r)
    setContributions(computeRiskContributions(active, 'cad'))
  }, [])

  useEffect(() => {
    if (patient) {
      setContributions(computeRiskContributions(patient, selectedDisease))
    }
  }, [patient, selectedDisease])

  if (!patient || !risks) {
    return <div className="animate-pulse h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
  }

  const maxContrib = Math.max(...contributions.map(c => Math.abs(c.contribution)), 0.01)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Risk Assessment</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Detailed risk breakdown for {patient.name} using NCD-CIE logistic-link scoring
        </p>
      </div>

      {/* Risk overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {diseases.map(d => {
          const risk = risks[d.id as keyof FullRiskResult] as { value: number; ci_low: number; ci_high: number }
          return (
            <button
              key={d.id}
              onClick={() => setSelectedDisease(d.id)}
              className={cn(
                'card-clinical cursor-pointer transition-all hover:shadow-md text-center',
                selectedDisease === d.id && 'ring-2 ring-clinical-500 shadow-md',
                getRiskBgClass(risk.value)
              )}
            >
              <RiskGauge label={d.abbr} risk={risk} size="sm" showCI={false} />
            </button>
          )
        })}
      </div>

      {/* Detailed view */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk detail */}
        <div className="card-clinical">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
            {diseases.find(d => d.id === selectedDisease)?.label} — Detailed Analysis
          </h2>
          {(() => {
            const risk = risks[selectedDisease as keyof FullRiskResult] as { value: number; ci_low: number; ci_high: number }
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <RiskGauge label="" risk={risk} size="lg" />
                  <div className="space-y-2">
                    <div className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-semibold inline-block',
                      risk.value < 0.1 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      risk.value < 0.2 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      risk.value < 0.3 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    )}>
                      {getRiskLevel(risk.value)} Risk
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      <strong>Point estimate:</strong> {formatPercent(risk.value)}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      <strong>95% CI:</strong> {formatPercent(risk.ci_low)} – {formatPercent(risk.ci_high)}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      <strong>Interpretation:</strong> {
                        risk.value < 0.1 ? 'Risk is within normal population range. Continue preventive measures.' :
                        risk.value < 0.2 ? 'Moderately elevated risk. Lifestyle modifications recommended.' :
                        risk.value < 0.3 ? 'High risk. Consider pharmacological intervention.' :
                        'Very high risk. Immediate clinical intervention recommended.'
                      }
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>

        {/* Risk factor contributions */}
        <div className="card-clinical">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Risk Factor Contributions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Showing which factors drive risk most (weight × z-score)
          </p>
          <div className="space-y-2">
            {contributions.slice(0, 10).map(c => (
              <div key={c.nodeId} className="flex items-center gap-3">
                <div className="w-20 text-xs font-medium text-slate-600 dark:text-slate-400 text-right truncate">
                  {c.label}
                </div>
                <div className="flex-1 relative h-6">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-slate-300 dark:bg-slate-600" />
                  <div
                    className={cn(
                      'absolute top-0.5 h-5 rounded transition-all',
                      c.contribution > 0 ? 'bg-red-400 dark:bg-red-600' : 'bg-green-400 dark:bg-green-600'
                    )}
                    style={{
                      left: c.contribution > 0 ? '50%' : undefined,
                      right: c.contribution <= 0 ? '50%' : undefined,
                      width: `${(Math.abs(c.contribution) / maxContrib) * 50}%`,
                    }}
                  />
                </div>
                <div className="w-16 text-xs text-slate-500 text-right">
                  {c.contribution > 0 ? '+' : ''}{c.contribution.toFixed(3)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-400" /> Increases risk
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-400" /> Decreases risk
            </div>
          </div>
        </div>
      </div>

      {/* Risk categories explanation */}
      <div className="card-clinical">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Risk Category Guide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { level: 'Low', range: '< 10%', color: 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700', text: 'text-green-800 dark:text-green-200', desc: 'Within normal population risk. Maintain healthy lifestyle.' },
            { level: 'Moderate', range: '10% – 20%', color: 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700', text: 'text-yellow-800 dark:text-yellow-200', desc: 'Above average risk. Lifestyle modification strongly recommended.' },
            { level: 'High', range: '20% – 30%', color: 'bg-orange-100 dark:bg-orange-900 border-orange-300 dark:border-orange-700', text: 'text-orange-800 dark:text-orange-200', desc: 'Significantly elevated. Consider pharmacological intervention.' },
            { level: 'Very High', range: '> 30%', color: 'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700', text: 'text-red-800 dark:text-red-200', desc: 'Critical risk level. Immediate intervention recommended.' },
          ].map(cat => (
            <div key={cat.level} className={cn('p-4 rounded-lg border', cat.color)}>
              <div className={cn('font-semibold text-sm mb-1', cat.text)}>{cat.level}</div>
              <div className={cn('text-xs font-mono mb-2', cat.text)}>{cat.range}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">{cat.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
