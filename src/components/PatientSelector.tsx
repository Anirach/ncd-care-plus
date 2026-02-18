'use client'

import { useState, useEffect } from 'react'
import { type PatientProfile } from '@/lib/ncd-cie-engine'
import { loadPatients, getActivePatientId, setActivePatientId } from '@/lib/store'
import { cn } from '@/lib/utils'

interface PatientSelectorProps {
  onSelect: (patient: PatientProfile) => void
  selected?: string
}

export default function PatientSelector({ onSelect, selected }: PatientSelectorProps) {
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const p = loadPatients()
    setPatients(p)
    const id = selected || getActivePatientId()
    setActiveId(id)
    const active = p.find(pt => pt.id === id) || p[0]
    if (active) onSelect(active)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelect = (patient: PatientProfile) => {
    setActiveId(patient.id)
    setActivePatientId(patient.id)
    onSelect(patient)
  }

  const riskBadge = (name: string) => {
    if (name === 'Sarah Chen') return { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Low Risk' }
    if (name === 'James Wilson') return { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Moderate' }
    return { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'High Risk' }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {patients.map((p) => {
        const badge = riskBadge(p.name)
        return (
          <button
            key={p.id}
            onClick={() => handleSelect(p)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left',
              activeId === p.id
                ? 'border-clinical-500 bg-clinical-50 dark:bg-clinical-950 shadow-md'
                : 'border-slate-200 dark:border-slate-700 hover:border-clinical-300 bg-white dark:bg-slate-900'
            )}
          >
            <div className="w-10 h-10 rounded-full bg-clinical-100 dark:bg-clinical-900 flex items-center justify-center text-lg">
              {p.sex === 0 ? '👩' : '👨'}
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{p.name}</div>
              <div className="text-xs text-slate-500">{p.age}{p.sex === 0 ? 'F' : 'M'} • BMI {p.bmi}</div>
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', badge.color)}>
                {badge.label}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
