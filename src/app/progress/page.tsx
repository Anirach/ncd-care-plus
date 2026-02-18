'use client'

import { useState, useEffect } from 'react'
import { type PatientProfile, computeAllRisksWithCI, type FullRiskResult, getRiskColor, getRiskLevel } from '@/lib/ncd-cie-engine'
import { loadPatients, getActivePatientId, loadHistory, addVisit } from '@/lib/store'
import { formatPercent, cn } from '@/lib/utils'

interface HistoryPoint {
  date: string
  risks: FullRiskResult
  profile: PatientProfile
}

export default function ProgressPage() {
  const [patient, setPatient] = useState<PatientProfile | null>(null)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [showAddVisit, setShowAddVisit] = useState(false)

  useEffect(() => {
    const pts = loadPatients()
    const id = getActivePatientId()
    const active = pts.find(p => p.id === id) || pts[1]
    setPatient(active)

    // Load visit history
    const rawHistory = loadHistory(active.id)
    const historyWithRisks: HistoryPoint[] = rawHistory.map(v => ({
      date: v.date,
      risks: computeAllRisksWithCI(v.profile),
      profile: v.profile,
    }))

    // Add current as latest if no history
    if (historyWithRisks.length === 0) {
      historyWithRisks.push({
        date: new Date().toISOString().split('T')[0],
        risks: computeAllRisksWithCI(active),
        profile: active,
      })
    }

    setHistory(historyWithRisks)
  }, [])

  const handleSaveVisit = () => {
    if (!patient) return
    addVisit(patient.id, patient)
    const newPoint: HistoryPoint = {
      date: new Date().toISOString().split('T')[0],
      risks: computeAllRisksWithCI(patient),
      profile: patient,
    }
    setHistory(prev => [...prev, newPoint])
    setShowAddVisit(false)
  }

  if (!patient) {
    return <div className="animate-pulse h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
  }

  const currentRisks = history.length > 0 ? history[history.length - 1].risks : computeAllRisksWithCI(patient)
  const previousRisks = history.length > 1 ? history[history.length - 2].risks : null

  const biomarkers = [
    { key: 'sbp', label: 'SBP', unit: 'mmHg', target: 120 },
    { key: 'ldl', label: 'LDL-C', unit: 'mg/dL', target: 100 },
    { key: 'hba1c', label: 'HbA1c', unit: '%', target: 5.7 },
    { key: 'bmi', label: 'BMI', unit: 'kg/m²', target: 25 },
    { key: 'egfr', label: 'eGFR', unit: 'mL/min', target: 90 },
    { key: 'hdl', label: 'HDL-C', unit: 'mg/dL', target: 50 },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">📈 Progress Tracker</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor risk trends and biomarker progress for {patient.name}
          </p>
        </div>
        <button onClick={handleSaveVisit} className="btn-primary text-sm">
          + Save Current Visit
        </button>
      </div>

      {/* Current risk summary */}
      <div className="card-clinical">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Current Risk Overview</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-4">
          {(['cad', 'stroke', 'hf', 'pad', 't2dm', 'ckd', 'nafld', 'cvd_composite', 'ncd_composite'] as const).map(d => {
            const risk = currentRisks[d]
            const prevRisk = previousRisks?.[d]
            const delta = prevRisk ? risk.value - prevRisk.value : 0
            const labels: Record<string, string> = {
              cad: 'CAD', stroke: 'Stroke', hf: 'HF', pad: 'PAD',
              t2dm: 'T2DM', ckd: 'CKD', nafld: 'NAFLD',
              cvd_composite: 'CVD', ncd_composite: 'NCD'
            }
            return (
              <div key={d} className="text-center">
                <div className="text-lg font-bold" style={{ color: getRiskColor(risk.value) }}>
                  {formatPercent(risk.value)}
                </div>
                <div className="text-[10px] text-slate-500">{labels[d]}</div>
                {delta !== 0 && (
                  <div className={cn('text-[10px] font-semibold', delta < 0 ? 'text-green-600' : 'text-red-600')}>
                    {delta > 0 ? '↑' : '↓'} {formatPercent(Math.abs(delta))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Biomarker tracking */}
      <div className="card-clinical">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Biomarker Goals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {biomarkers.map(bm => {
            const currentVal = (patient as unknown as Record<string, number>)[bm.key] ?? 0
            const isInverse = bm.key === 'egfr' || bm.key === 'hdl'
            const progress = isInverse
              ? Math.min(currentVal / bm.target, 1)
              : Math.min(bm.target / currentVal, 1)
            const atTarget = isInverse ? currentVal >= bm.target : currentVal <= bm.target

            return (
              <div key={bm.key} className={cn(
                'p-4 rounded-lg border',
                atTarget
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{bm.label}</span>
                  {atTarget && <span className="text-green-600 text-sm">✓</span>}
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    {typeof currentVal === 'number' ? currentVal.toFixed(bm.key === 'hba1c' || bm.key === 'bmi' ? 1 : 0) : currentVal}
                  </span>
                  <span className="text-xs text-slate-400">{bm.unit}</span>
                  <span className="text-xs text-slate-400 ml-auto">Target: {bm.target}</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      atTarget ? 'bg-green-500' : progress > 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Visit history */}
      <div className="card-clinical">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Visit History</h2>
        {history.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No visit history yet. Save your first visit to start tracking.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Date</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-slate-500">NCD Risk</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-slate-500">SBP</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-slate-500">LDL</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-slate-500">HbA1c</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-slate-500">BMI</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-slate-500">eGFR</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 px-3 font-medium">{h.date}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="font-semibold" style={{ color: getRiskColor(h.risks.ncd_composite.value) }}>
                        {formatPercent(h.risks.ncd_composite.value)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">{h.profile.sbp}</td>
                    <td className="py-2 px-3 text-center">{h.profile.ldl}</td>
                    <td className="py-2 px-3 text-center">{h.profile.hba1c}</td>
                    <td className="py-2 px-3 text-center">{h.profile.bmi}</td>
                    <td className="py-2 px-3 text-center">{h.profile.egfr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Milestones */}
      <div className="card-clinical">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">🏆 Milestones</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: '🩺', title: 'First Assessment', desc: 'Complete initial risk assessment', done: true },
            { icon: '🎯', title: 'Goals Set', desc: 'Set biomarker targets', done: history.length > 0 },
            { icon: '📊', title: 'Second Visit', desc: 'Compare with baseline', done: history.length > 1 },
            { icon: '⬇️', title: 'Risk Reduced', desc: 'Any disease risk decreased', done: previousRisks ? currentRisks.ncd_composite.value < previousRisks.ncd_composite.value : false },
          ].map(m => (
            <div key={m.title} className={cn(
              'p-4 rounded-lg border text-center transition-all',
              m.done
                ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60'
            )}>
              <div className="text-2xl mb-1">{m.icon}</div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{m.title}</div>
              <div className="text-[10px] text-slate-500">{m.desc}</div>
              {m.done && <div className="text-green-600 text-xs mt-1 font-semibold">✓ Achieved</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
