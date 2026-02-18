'use client'

import { useState, useEffect, useCallback } from 'react'
import { type PatientProfile, demoPatients, biomarkerRanges } from '@/lib/ncd-cie-engine'
import { loadPatients, savePatients, getActivePatientId, setActivePatientId } from '@/lib/store'
import { cn } from '@/lib/utils'

const labSections = [
  {
    title: 'Demographics',
    icon: '👤',
    fields: [
      { key: 'age', label: 'Age', type: 'number' as const },
      { key: 'sex', label: 'Sex', type: 'select' as const, options: [{ value: 0, label: 'Female' }, { value: 1, label: 'Male' }] },
    ],
  },
  {
    title: 'Lipid Panel',
    icon: '🩸',
    fields: [
      { key: 'ldl', label: 'LDL Cholesterol (mg/dL)', type: 'number' as const },
      { key: 'hdl', label: 'HDL Cholesterol (mg/dL)', type: 'number' as const },
      { key: 'tc', label: 'Total Cholesterol (mg/dL)', type: 'number' as const },
      { key: 'tg', label: 'Triglycerides (mg/dL)', type: 'number' as const },
    ],
  },
  {
    title: 'Blood Pressure',
    icon: '💓',
    fields: [
      { key: 'sbp', label: 'Systolic BP (mmHg)', type: 'number' as const },
      { key: 'dbp', label: 'Diastolic BP (mmHg)', type: 'number' as const },
    ],
  },
  {
    title: 'Glycaemic Control',
    icon: '🍬',
    fields: [
      { key: 'hba1c', label: 'HbA1c (%)', type: 'number' as const },
      { key: 'fpg', label: 'Fasting Plasma Glucose (mg/dL)', type: 'number' as const },
    ],
  },
  {
    title: 'Renal Function',
    icon: '🫘',
    fields: [
      { key: 'egfr', label: 'eGFR (mL/min/1.73m²)', type: 'number' as const },
    ],
  },
  {
    title: 'Anthropometrics',
    icon: '📏',
    fields: [
      { key: 'bmi', label: 'BMI (kg/m²)', type: 'number' as const },
    ],
  },
  {
    title: 'Lifestyle',
    icon: '🏃',
    fields: [
      { key: 'smoking', label: 'Smoking', type: 'select' as const, options: [{ value: 0, label: 'Never' }, { value: 0.5, label: 'Former' }, { value: 1, label: 'Current' }] },
      { key: 'exercise', label: 'Exercise (days/week)', type: 'number' as const },
      { key: 'alcohol', label: 'Alcohol', type: 'select' as const, options: [{ value: 0, label: 'None' }, { value: 0.5, label: 'Moderate' }, { value: 1, label: 'Heavy' }] },
      { key: 'diet', label: 'Diet Quality (0-1)', type: 'number' as const },
    ],
  },
  {
    title: 'Medications',
    icon: '💊',
    fields: [
      { key: 'statin', label: 'Statin', type: 'toggle' as const },
      { key: 'htn_med', label: 'Antihypertensive', type: 'toggle' as const },
      { key: 'sglt2i', label: 'SGLT2 Inhibitor', type: 'toggle' as const },
      { key: 'metformin', label: 'Metformin', type: 'toggle' as const },
      { key: 'aspirin', label: 'Aspirin', type: 'toggle' as const },
      { key: 'ace_arb', label: 'ACEi/ARB', type: 'toggle' as const },
    ],
  },
]

export default function ProfilePage() {
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [activeId, setActiveId2] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const pts = loadPatients()
    setPatients(pts)
    setActiveId2(getActivePatientId())
  }, [])

  const patient = patients.find(p => p.id === activeId) || patients[0]

  const updateField = useCallback((key: string, value: number) => {
    setPatients(prev => {
      const updated = prev.map(p =>
        p.id === activeId ? { ...p, [key]: value } : p
      )
      return updated
    })
  }, [activeId])

  const handleSave = () => {
    savePatients(patients)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    const demo = demoPatients.find(d => d.id === activeId)
    if (demo) {
      setPatients(prev => prev.map(p => p.id === activeId ? { ...demo } : p))
    }
  }

  const selectPatient = (id: string) => {
    setActiveId2(id)
    setActivePatientId(id)
  }

  if (!patient) return <div className="animate-pulse h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />

  const getStatus = (key: string, value: number): string => {
    const range = biomarkerRanges[key]
    if (!range) return 'normal'
    // Simple status check based on some common thresholds
    return 'normal'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Patient Profile & Lab Data</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Enter lab values organized by clinical domain</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="btn-secondary text-sm">Reset to Demo</button>
          <button onClick={handleSave} className={cn('btn-primary text-sm', saved && 'bg-green-600')}>
            {saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Patient tabs */}
      <div className="flex gap-2 flex-wrap">
        {patients.map(p => (
          <button
            key={p.id}
            onClick={() => selectPatient(p.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all border-2',
              activeId === p.id
                ? 'border-clinical-500 bg-clinical-50 dark:bg-clinical-950 text-clinical-700 dark:text-clinical-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-clinical-300'
            )}
          >
            {p.sex === 0 ? '👩' : '👨'} {p.name}
          </button>
        ))}
      </div>

      {/* Lab sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {labSections.map(section => (
          <div key={section.title} className="card-clinical">
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <span>{section.icon}</span> {section.title}
            </h3>
            <div className="space-y-3">
              {section.fields.map(field => (
                <div key={field.key}>
                  {field.type === 'number' && (
                    <div>
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">{field.label}</label>
                      <input
                        type="number"
                        value={(patient as unknown as Record<string, number>)[field.key] ?? 0}
                        onChange={e => updateField(field.key, parseFloat(e.target.value) || 0)}
                        step={biomarkerRanges[field.key]?.step || 1}
                        className="input-clinical"
                      />
                    </div>
                  )}
                  {field.type === 'select' && (
                    <div>
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">{field.label}</label>
                      <select
                        value={(patient as unknown as Record<string, number>)[field.key] ?? 0}
                        onChange={e => updateField(field.key, parseFloat(e.target.value))}
                        className="input-clinical"
                      >
                        {field.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {field.type === 'toggle' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{field.label}</span>
                      <button
                        onClick={() => updateField(field.key, (patient as unknown as Record<string, number>)[field.key] ? 0 : 1)}
                        className={cn(
                          'relative w-11 h-6 rounded-full transition-colors',
                          (patient as unknown as Record<string, number>)[field.key]
                            ? 'bg-clinical-600'
                            : 'bg-slate-300 dark:bg-slate-600'
                        )}
                      >
                        <div className={cn(
                          'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                          (patient as unknown as Record<string, number>)[field.key] ? 'translate-x-5' : 'translate-x-0.5'
                        )} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
