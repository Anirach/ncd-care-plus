'use client'

import { useState, useEffect } from 'react'
import { type PatientProfile, computeAllRisksWithCI, type FullRiskResult, getRiskColor, getRiskLevel } from '@/lib/ncd-cie-engine'
import { loadPatients, getActivePatientId, setActivePatientId } from '@/lib/store'
import RiskGauge from '@/components/RiskGauge'
import { cn, formatPercent } from '@/lib/utils'

const diseaseLabels: Record<string, string> = {
  cad: 'Coronary Artery Disease',
  stroke: 'Stroke',
  hf: 'Heart Failure',
  pad: 'Peripheral Artery Disease',
  t2dm: 'Type 2 Diabetes',
  ckd: 'Chronic Kidney Disease',
  nafld: 'Fatty Liver Disease',
}

export default function DashboardPage() {
  const [patient, setPatient] = useState<PatientProfile | null>(null)
  const [risks, setRisks] = useState<FullRiskResult | null>(null)
  const [patients, setPatients] = useState<PatientProfile[]>([])

  useEffect(() => {
    const pts = loadPatients()
    setPatients(pts)
    const id = getActivePatientId()
    const active = pts.find(p => p.id === id) || pts[1]
    setPatient(active)
    setRisks(computeAllRisksWithCI(active))
  }, [])

  const selectPatient = (p: PatientProfile) => {
    setPatient(p)
    setActivePatientId(p.id)
    setRisks(computeAllRisksWithCI(p))
  }

  if (!patient || !risks) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const alerts = Object.entries(risks)
    .filter(([key]) => !key.includes('composite'))
    .filter(([, val]) => (val as { value: number }).value >= 0.2)
    .map(([key, val]) => ({ key, ...(val as { value: number; ci_low: number; ci_high: number }) }))

  const vitals = [
    { label: 'Blood Pressure', value: `${patient.sbp}/${patient.dbp}`, unit: 'mmHg', status: patient.sbp > 140 ? 'high' : patient.sbp > 130 ? 'borderline' : 'normal' },
    { label: 'HbA1c', value: patient.hba1c.toFixed(1), unit: '%', status: patient.hba1c > 6.5 ? 'high' : patient.hba1c > 5.7 ? 'borderline' : 'normal' },
    { label: 'LDL-C', value: patient.ldl.toString(), unit: 'mg/dL', status: patient.ldl > 160 ? 'high' : patient.ldl > 130 ? 'borderline' : 'normal' },
    { label: 'BMI', value: patient.bmi.toFixed(1), unit: 'kg/m²', status: patient.bmi > 30 ? 'high' : patient.bmi > 25 ? 'borderline' : 'normal' },
    { label: 'eGFR', value: patient.egfr.toString(), unit: 'mL/min', status: patient.egfr < 60 ? 'high' : patient.egfr < 90 ? 'borderline' : 'normal' },
    { label: 'Triglycerides', value: patient.tg.toString(), unit: 'mg/dL', status: patient.tg > 200 ? 'high' : patient.tg > 150 ? 'borderline' : 'normal' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Clinical Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">NCD-CIE Risk Assessment Overview</p>
        </div>
        {/* Patient selector */}
        <div className="flex gap-2 flex-wrap">
          {patients.map(p => (
            <button
              key={p.id}
              onClick={() => selectPatient(p)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm',
                patient.id === p.id
                  ? 'border-clinical-500 bg-clinical-50 dark:bg-clinical-950 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 hover:border-clinical-300 bg-white dark:bg-slate-900'
              )}
            >
              <span>{p.sex === 0 ? '👩' : '👨'}</span>
              <div className="text-left">
                <div className="font-medium text-slate-800 dark:text-slate-200">{p.name}</div>
                <div className="text-[10px] text-slate-400">{p.age}{p.sex === 0 ? 'F' : 'M'}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Composite Risk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-clinical flex items-center gap-6">
          <RiskGauge label="NCD Composite" risk={risks.ncd_composite} size="lg" />
          <div className="flex-1">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Overall NCD Risk</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Combined risk for cardiovascular disease, diabetes, and kidney disease
            </p>
            <div className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
              risks.ncd_composite.value < 0.2 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              risks.ncd_composite.value < 0.4 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            )}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getRiskColor(risks.ncd_composite.value) }} />
              {getRiskLevel(risks.ncd_composite.value)} Risk Profile
            </div>
          </div>
        </div>
        <div className="card-clinical flex items-center gap-6">
          <RiskGauge label="CVD Composite" risk={risks.cvd_composite} size="lg" />
          <div className="flex-1">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Cardiovascular Risk</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Combined CAD, stroke, heart failure, and PAD risk
            </p>
            <div className="text-xs text-slate-400">
              95% CI: {formatPercent(risks.cvd_composite.ci_low)} – {formatPercent(risks.cvd_composite.ci_high)}
            </div>
          </div>
        </div>
      </div>

      {/* Disease Risk Gauges */}
      <div className="card-clinical">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Disease-Specific Risks</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6">
          {(['cad', 'stroke', 'hf', 'pad', 't2dm', 'ckd', 'nafld'] as const).map(d => (
            <RiskGauge key={d} label={diseaseLabels[d]} risk={risks[d]} size="sm" showCI={false} />
          ))}
        </div>
      </div>

      {/* Vitals + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Vitals */}
        <div className="lg:col-span-2 card-clinical">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Key Vitals</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {vitals.map(v => (
              <div key={v.label} className={cn(
                'p-4 rounded-lg border',
                v.status === 'high' ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' :
                v.status === 'borderline' ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800' :
                'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
              )}>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{v.label}</div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{v.value}</div>
                <div className="text-xs text-slate-400">{v.unit}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="card-clinical">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">⚠️ Alerts</h2>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">✅</span>
              <p className="text-sm text-slate-500 mt-2">No high-risk alerts</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map(a => (
                <div key={a.key} className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getRiskColor(a.value) }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-red-800 dark:text-red-200">
                      {diseaseLabels[a.key] || a.key}
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400">
                      {formatPercent(a.value)} risk ({getRiskLevel(a.value)})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Patient Info Summary */}
      <div className="card-clinical">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Patient Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Smoking:</span>
            <span className="ml-2 font-medium">{patient.smoking === 0 ? 'Never' : patient.smoking === 0.5 ? 'Former' : 'Current'}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Exercise:</span>
            <span className="ml-2 font-medium">{patient.exercise} days/week</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Alcohol:</span>
            <span className="ml-2 font-medium">{patient.alcohol === 0 ? 'None' : patient.alcohol === 0.5 ? 'Moderate' : 'Heavy'}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Diet Quality:</span>
            <span className="ml-2 font-medium">{Math.round(patient.diet * 100)}%</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Medications:</span>
            <span className="ml-2 font-medium">
              {[
                patient.statin && 'Statin',
                patient.htn_med && 'HTN med',
                patient.sglt2i && 'SGLT2i',
                patient.metformin && 'Metformin',
                patient.aspirin && 'Aspirin',
                patient.ace_arb && 'ACEi/ARB',
              ].filter(Boolean).join(', ') || 'None'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
