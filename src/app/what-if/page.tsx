'use client'

import { useState, useEffect, useMemo } from 'react'
import { type PatientProfile, computeAllRisksWithCI, whatIfIntervention, type FullRiskResult, type CascadeResult, getRiskColor, biomarkerRanges } from '@/lib/ncd-cie-engine'
import { edges as graphEdges, getNode } from '@/lib/knowledge-graph'
import { loadPatients, getActivePatientId } from '@/lib/store'
import RiskGauge from '@/components/RiskGauge'
import { formatPercent, cn } from '@/lib/utils'

const presetScenarios = [
  {
    name: 'Start Statin Therapy',
    icon: '💊',
    interventions: { statin: 1 },
    description: 'Add high-intensity statin therapy',
  },
  {
    name: 'Lose 10kg (≈3 BMI)',
    icon: '⚖️',
    interventions: { bmi: -3 },
    description: 'Moderate weight loss program',
    relative: true,
  },
  {
    name: 'Exercise 150min/week',
    icon: '🏃',
    interventions: { exercise: 5 },
    description: 'WHO recommended physical activity',
  },
  {
    name: 'Quit Smoking',
    icon: '🚭',
    interventions: { smoking: 0 },
    description: 'Complete smoking cessation',
  },
  {
    name: 'Start SGLT2i + ACEi',
    icon: '💉',
    interventions: { sglt2i: 1, ace_arb: 1 },
    description: 'Cardio-renal protection combo',
  },
  {
    name: 'Full Lifestyle Change',
    icon: '🌟',
    interventions: { exercise: 5, diet: 0.8, smoking: 0, alcohol: 0 },
    description: 'Comprehensive lifestyle modification',
  },
]

const modifiableFactors = [
  { key: 'sbp', label: 'Systolic BP', min: 80, max: 220, step: 1, unit: 'mmHg' },
  { key: 'dbp', label: 'Diastolic BP', min: 40, max: 130, step: 1, unit: 'mmHg' },
  { key: 'ldl', label: 'LDL-C', min: 30, max: 300, step: 1, unit: 'mg/dL' },
  { key: 'hdl', label: 'HDL-C', min: 15, max: 100, step: 1, unit: 'mg/dL' },
  { key: 'tg', label: 'Triglycerides', min: 30, max: 600, step: 1, unit: 'mg/dL' },
  { key: 'hba1c', label: 'HbA1c', min: 3.5, max: 14, step: 0.1, unit: '%' },
  { key: 'fpg', label: 'Fasting Glucose', min: 50, max: 300, step: 1, unit: 'mg/dL' },
  { key: 'bmi', label: 'BMI', min: 14, max: 55, step: 0.1, unit: 'kg/m²' },
  { key: 'egfr', label: 'eGFR', min: 10, max: 140, step: 1, unit: 'mL/min' },
  { key: 'exercise', label: 'Exercise', min: 0, max: 7, step: 1, unit: 'days/wk' },
  { key: 'diet', label: 'Diet Quality', min: 0, max: 1, step: 0.1, unit: '' },
  { key: 'smoking', label: 'Smoking', min: 0, max: 1, step: 0.5, unit: '' },
  { key: 'alcohol', label: 'Alcohol', min: 0, max: 1, step: 0.5, unit: '' },
]

export default function WhatIfPage() {
  const [patient, setPatient] = useState<PatientProfile | null>(null)
  const [baseRisks, setBaseRisks] = useState<FullRiskResult | null>(null)
  const [simValues, setSimValues] = useState<Record<string, number>>({})
  const [cascade, setCascade] = useState<CascadeResult | null>(null)

  useEffect(() => {
    const pts = loadPatients()
    const id = getActivePatientId()
    const active = pts.find(p => p.id === id) || pts[1]
    setPatient(active)
    setBaseRisks(computeAllRisksWithCI(active))
    // Initialize sim values from patient
    const vals: Record<string, number> = {}
    modifiableFactors.forEach(f => {
      vals[f.key] = (active as unknown as Record<string, number>)[f.key] ?? 0
    })
    setSimValues(vals)
  }, [])

  // Recompute cascade when sim values change
  useEffect(() => {
    if (!patient) return
    const interventions: Partial<PatientProfile> = {}
    let hasChanges = false
    modifiableFactors.forEach(f => {
      const current = (patient as unknown as Record<string, number>)[f.key] ?? 0
      if (Math.abs(simValues[f.key] - current) > 0.001) {
        (interventions as unknown as Record<string, number>)[f.key] = simValues[f.key]
        hasChanges = true
      }
    })
    if (hasChanges) {
      setCascade(whatIfIntervention(patient, interventions))
    } else {
      setCascade(null)
    }
  }, [patient, simValues])

  const handleSliderChange = (key: string, value: number) => {
    setSimValues(prev => ({ ...prev, [key]: value }))
  }

  const applyPreset = (preset: typeof presetScenarios[0]) => {
    if (!patient) return
    const newVals = { ...simValues }
    for (const [key, val] of Object.entries(preset.interventions)) {
      if (preset.relative) {
        newVals[key] = ((patient as unknown as Record<string, number>)[key] ?? 0) + (val as number)
      } else {
        newVals[key] = val as number
      }
    }
    setSimValues(newVals)
  }

  const resetAll = () => {
    if (!patient) return
    const vals: Record<string, number> = {}
    modifiableFactors.forEach(f => {
      vals[f.key] = (patient as unknown as Record<string, number>)[f.key] ?? 0
    })
    setSimValues(vals)
  }

  if (!patient || !baseRisks) {
    return <div className="animate-pulse h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
  }

  const simRisks = cascade?.risks || baseRisks
  const diseaseKeys = ['cad', 'stroke', 'hf', 'pad', 't2dm', 'ckd', 'nafld', 'cvd_composite', 'ncd_composite'] as const
  const diseaseLabels: Record<string, string> = {
    cad: 'CAD', stroke: 'Stroke', hf: 'Heart Failure', pad: 'PAD',
    t2dm: 'T2DM', ckd: 'CKD', nafld: 'NAFLD',
    cvd_composite: 'CVD (Total)', ncd_composite: 'NCD (Total)',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">🔬 What-If Simulator</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Explore causal interventions using Pearl&apos;s do-calculus (γ=0.7, d<sub>max</sub>=3)
          </p>
        </div>
        <button onClick={resetAll} className="btn-secondary text-sm">Reset All</button>
      </div>

      {/* Preset scenarios */}
      <div className="card-clinical">
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-3">Quick Intervention Scenarios</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {presetScenarios.map(preset => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-clinical-400 hover:bg-clinical-50 dark:hover:bg-clinical-950 transition-all text-left"
            >
              <div className="text-xl mb-1">{preset.icon}</div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{preset.name}</div>
              <div className="text-[10px] text-slate-400">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sliders */}
        <div className="lg:col-span-1 space-y-3">
          <div className="card-clinical max-h-[70vh] overflow-y-auto">
            <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-3 sticky top-0 bg-white dark:bg-slate-900 py-1">
              Adjust Risk Factors
            </h2>
            <div className="space-y-4">
              {modifiableFactors.map(f => {
                const original = (patient as unknown as Record<string, number>)[f.key] ?? 0
                const current = simValues[f.key] ?? original
                const changed = Math.abs(current - original) > 0.001
                return (
                  <div key={f.key} className={cn('p-2 rounded-lg transition-colors', changed && 'bg-clinical-50 dark:bg-clinical-950')}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{f.label}</span>
                      <div className="flex items-center gap-1">
                        {changed && (
                          <span className="text-[10px] text-slate-400 line-through">{original.toFixed(f.step < 1 ? 1 : 0)}</span>
                        )}
                        <span className={cn('text-xs font-bold', changed ? 'text-clinical-600 dark:text-clinical-400' : 'text-slate-700 dark:text-slate-300')}>
                          {current.toFixed(f.step < 1 ? 1 : 0)} {f.unit}
                        </span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={f.min}
                      max={f.max}
                      step={f.step}
                      value={current}
                      onChange={e => handleSliderChange(f.key, parseFloat(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none bg-slate-200 dark:bg-slate-700 accent-clinical-600"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Side-by-side comparison */}
          <div className="card-clinical">
            <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-4">Risk Comparison</h2>
            <div className="space-y-3">
              {diseaseKeys.map(d => {
                const base = (baseRisks[d] as { value: number }).value
                const sim = (simRisks[d] as { value: number }).value
                const delta = sim - base
                const isComposite = d.includes('composite')
                return (
                  <div key={d} className={cn('flex items-center gap-3', isComposite && 'pt-2 border-t border-slate-200 dark:border-slate-700')}>
                    <div className="w-24 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {diseaseLabels[d]}
                    </div>
                    {/* Base bar */}
                    <div className="flex-1">
                      <div className="relative h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                          style={{ width: `${base * 100}%`, backgroundColor: getRiskColor(base), opacity: 0.4 }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                          style={{ width: `${sim * 100}%`, backgroundColor: getRiskColor(sim) }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right text-xs font-bold" style={{ color: getRiskColor(sim) }}>
                      {formatPercent(sim)}
                    </div>
                    <div className={cn(
                      'w-16 text-right text-xs font-semibold',
                      delta < -0.001 ? 'text-green-600 dark:text-green-400' :
                      delta > 0.001 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'
                    )}>
                      {delta > 0.001 ? '+' : ''}{delta !== 0 ? formatPercent(delta) : '—'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Activated pathways */}
          {cascade && cascade.activatedEdges.length > 0 && (
            <div className="card-clinical">
              <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-3">
                ⚡ Activated Causal Pathways ({cascade.activatedEdges.length} edges)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {cascade.activatedEdges.map(edgeId => {
                  const edge = graphEdges.find(e => e.id === edgeId)
                  if (!edge) return null
                  const sNode = getNode(edge.source)
                  const tNode = getNode(edge.target)
                  return (
                    <div key={edgeId} className="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-slate-800 text-xs">
                      <span className="font-medium text-clinical-600 dark:text-clinical-400">
                        {sNode?.label || edge.source}
                      </span>
                      <span className={cn(
                        'text-[10px] font-mono',
                        edge.weight > 0 ? 'text-red-500' : 'text-green-500'
                      )}>
                        →{edge.weight > 0 ? '+' : ''}{edge.weight.toFixed(2)}→
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {tNode?.label || edge.target}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Cascaded changes */}
          {cascade && Object.keys(cascade.deltas).length > 0 && (
            <div className="card-clinical">
              <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-3">
                🔄 Cascaded Changes (γ=0.7 attenuation)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {Object.entries(cascade.deltas).map(([key, delta]) => {
                  const node = getNode(key)
                  return (
                    <div key={key} className={cn(
                      'p-2 rounded-lg text-center text-xs',
                      delta > 0 ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300' :
                      'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                    )}>
                      <div className="font-semibold">{node?.label || key}</div>
                      <div className="font-mono text-sm font-bold">
                        {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(2)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
