// Shared types for NCD-Care+ clinical decision support platform

import type { PatientProfile, RiskWithCI, FullRiskResult } from './ncd-cie-engine'

// Type-safe patient profile value accessor
export type PatientProfileKey = keyof PatientProfile

// Disease identifiers used throughout the app
export type DiseaseId = 'cad' | 'stroke' | 'hf' | 'pad' | 't2dm' | 'ckd' | 'nafld'
export type CompositeRiskId = 'cvd_composite' | 'ncd_composite'
export type RiskId = DiseaseId | CompositeRiskId

// Vital status for clinical indicators
export type VitalStatus = 'normal' | 'borderline' | 'high'

// Risk level categories
export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Very High'

// Evidence grades from knowledge graph
export type { EvidenceGrade, ClinicalDomain, NodeType, KGNode, KGEdge } from './knowledge-graph'

// Re-export core types for convenience
export type { PatientProfile, RiskWithCI, FullRiskResult }

// Disease information for UI display
export interface DiseaseInfo {
  id: DiseaseId
  label: string
  abbr: string
}

// Vital sign display information
export interface VitalDisplay {
  label: string
  value: string
  unit: string
  status: VitalStatus
}

// Biomarker target information
export interface BiomarkerTarget {
  key: PatientProfileKey
  label: string
  unit: string
  target: number
}

// Type guard for checking if a key is a valid PatientProfile key
export function isPatientProfileKey(key: string): key is PatientProfileKey {
  const validKeys: PatientProfileKey[] = [
    'id', 'name', 'age', 'sex', 'sbp', 'dbp', 'ldl', 'hdl', 'tc', 'tg',
    'hba1c', 'fpg', 'bmi', 'egfr', 'smoking', 'exercise', 'alcohol', 'diet',
    'statin', 'htn_med', 'sglt2i', 'metformin', 'aspirin', 'ace_arb',
    'diabetes', 'hypertension'
  ]
  return validKeys.includes(key as PatientProfileKey)
}

// Type-safe getter for numeric patient profile values
export function getPatientNumericValue(profile: PatientProfile, key: PatientProfileKey): number {
  const value = profile[key]
  return typeof value === 'number' ? value : 0
}
