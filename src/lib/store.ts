'use client'

import { PatientProfile, demoPatients } from './ncd-cie-engine'
import { STORAGE_KEYS, DEFAULT_PATIENT_ID } from './constants'

const { PATIENTS: STORAGE_KEY, ACTIVE_PATIENT: ACTIVE_KEY, HISTORY_PREFIX: HISTORY_KEY } = STORAGE_KEYS

export interface LabVisit {
  date: string
  profile: PatientProfile
}

export function loadPatients(): PatientProfile[] {
  if (typeof window === 'undefined') return demoPatients
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Validate that parsed data is an array of patient profiles
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0].id === 'string') {
        return parsed as PatientProfile[]
      }
    }
  } catch (error) {
    console.error('Failed to load patients from localStorage:', error)
  }
  return demoPatients
}

export function savePatients(patients: PatientProfile[]): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients))
    return true
  } catch (error) {
    console.error('Failed to save patients to localStorage:', error)
    return false
  }
}

export function getActivePatientId(): string {
  if (typeof window === 'undefined') return DEFAULT_PATIENT_ID
  try {
    return localStorage.getItem(ACTIVE_KEY) || DEFAULT_PATIENT_ID
  } catch (error) {
    console.error('Failed to get active patient ID:', error)
    return DEFAULT_PATIENT_ID
  }
}

export function setActivePatientId(id: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.setItem(ACTIVE_KEY, id)
    return true
  } catch (error) {
    console.error('Failed to set active patient ID:', error)
    return false
  }
}

export function loadHistory(patientId: string): LabVisit[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(`${HISTORY_KEY}-${patientId}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Validate parsed data structure
      if (Array.isArray(parsed)) {
        return parsed as LabVisit[]
      }
    }
  } catch (error) {
    console.error(`Failed to load history for patient ${patientId}:`, error)
  }
  return []
}

export function saveHistory(patientId: string, history: LabVisit[]): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.setItem(`${HISTORY_KEY}-${patientId}`, JSON.stringify(history))
    return true
  } catch (error) {
    console.error(`Failed to save history for patient ${patientId}:`, error)
    return false
  }
}

export function addVisit(patientId: string, profile: PatientProfile): boolean {
  const history = loadHistory(patientId)
  const dateStr = new Date().toISOString().split('T')[0]
  history.push({ date: dateStr, profile })
  return saveHistory(patientId, history)
}
