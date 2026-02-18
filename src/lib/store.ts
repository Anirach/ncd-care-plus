'use client'

import { PatientProfile, demoPatients } from './ncd-cie-engine'

const STORAGE_KEY = 'ncd-care-plus-patients'
const ACTIVE_KEY = 'ncd-care-plus-active'
const HISTORY_KEY = 'ncd-care-plus-history'

export interface LabVisit {
  date: string
  profile: PatientProfile
}

export function loadPatients(): PatientProfile[] {
  if (typeof window === 'undefined') return demoPatients
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as PatientProfile[]
  } catch { /* empty */ }
  return demoPatients
}

export function savePatients(patients: PatientProfile[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients))
}

export function getActivePatientId(): string {
  if (typeof window === 'undefined') return 'demo-moderate'
  return localStorage.getItem(ACTIVE_KEY) || 'demo-moderate'
}

export function setActivePatientId(id: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACTIVE_KEY, id)
}

export function loadHistory(patientId: string): LabVisit[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(`${HISTORY_KEY}-${patientId}`)
    if (raw) return JSON.parse(raw) as LabVisit[]
  } catch { /* empty */ }
  return []
}

export function saveHistory(patientId: string, history: LabVisit[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${HISTORY_KEY}-${patientId}`, JSON.stringify(history))
}

export function addVisit(patientId: string, profile: PatientProfile): void {
  const history = loadHistory(patientId)
  history.push({ date: new Date().toISOString().split('T')[0], profile })
  saveHistory(patientId, history)
}
