'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PatientProfile, FullRiskResult } from './ncd-cie-engine'
import { computeAllRisksWithCI } from './ncd-cie-engine'
import { loadPatients, getActivePatientId, setActivePatientId } from './store'

/**
 * Hook for managing patient state with automatic risk computation.
 * Reduces code duplication across pages that need patient data.
 */
export function usePatient() {
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [patient, setPatient] = useState<PatientProfile | null>(null)
  const [risks, setRisks] = useState<FullRiskResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load patients on mount
  useEffect(() => {
    const pts = loadPatients()
    setPatients(pts)
    const id = getActivePatientId()
    const active = pts.find(p => p.id === id) || pts[0]
    if (active) {
      setPatient(active)
      setRisks(computeAllRisksWithCI(active))
    }
    setIsLoading(false)
  }, [])

  // Select a patient and compute risks
  const selectPatient = useCallback((p: PatientProfile) => {
    setPatient(p)
    setActivePatientId(p.id)
    setRisks(computeAllRisksWithCI(p))
  }, [])

  // Update patients list
  const updatePatients = useCallback((updater: (prev: PatientProfile[]) => PatientProfile[]) => {
    setPatients(updater)
  }, [])

  return {
    patients,
    patient,
    risks,
    isLoading,
    selectPatient,
    updatePatients,
    setPatients,
  }
}

/**
 * Hook for managing patient selection with a callback.
 * Used by PatientSelector component.
 */
export function usePatientSelector(onSelect: (patient: PatientProfile) => void, initialSelected?: string) {
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const pts = loadPatients()
    setPatients(pts)
    const id = initialSelected || getActivePatientId()
    setActiveId(id)
    const active = pts.find(pt => pt.id === id) || pts[0]
    if (active) {
      onSelect(active)
    }
  }, [initialSelected, onSelect])

  const handleSelect = useCallback((patient: PatientProfile) => {
    setActiveId(patient.id)
    setActivePatientId(patient.id)
    onSelect(patient)
  }, [onSelect])

  return { patients, activeId, handleSelect }
}
