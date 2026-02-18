// Shared constants for NCD-Care+ clinical decision support platform

import type { DiseaseId, DiseaseInfo, BiomarkerTarget, PatientProfileKey } from './types'

// Risk thresholds for categorization
export const RISK_THRESHOLDS = {
  LOW: 0.10,
  MODERATE: 0.20,
  HIGH: 0.30,
} as const

// What-If cascade parameters
export const CASCADE_PARAMS = {
  /** Attenuation factor for cascade effects */
  GAMMA: 0.7,
  /** Maximum depth for cascade propagation */
  D_MAX: 3,
  /** Minimum delta threshold for significance */
  DELTA_THRESHOLD: 0.001,
} as const

// Risk color palette
export const RISK_COLORS = {
  LOW: '#22c55e',
  MODERATE: '#eab308',
  HIGH: '#f97316',
  VERY_HIGH: '#ef4444',
} as const

// Disease labels for display
export const DISEASE_LABELS: Record<DiseaseId, string> = {
  cad: 'Coronary Artery Disease',
  stroke: 'Stroke',
  hf: 'Heart Failure',
  pad: 'Peripheral Artery Disease',
  t2dm: 'Type 2 Diabetes',
  ckd: 'Chronic Kidney Disease',
  nafld: 'Fatty Liver Disease',
} as const

// Disease abbreviations for compact display
export const DISEASE_ABBR: Record<DiseaseId, string> = {
  cad: 'CAD',
  stroke: 'Stroke',
  hf: 'HF',
  pad: 'PAD',
  t2dm: 'T2DM',
  ckd: 'CKD',
  nafld: 'NAFLD',
} as const

// Complete disease info array for iteration
export const DISEASES: readonly DiseaseInfo[] = [
  { id: 'cad', label: 'Coronary Artery Disease', abbr: 'CAD' },
  { id: 'stroke', label: 'Stroke', abbr: 'Stroke' },
  { id: 'hf', label: 'Heart Failure', abbr: 'HF' },
  { id: 'pad', label: 'Peripheral Artery Disease', abbr: 'PAD' },
  { id: 't2dm', label: 'Type 2 Diabetes', abbr: 'T2DM' },
  { id: 'ckd', label: 'Chronic Kidney Disease', abbr: 'CKD' },
  { id: 'nafld', label: 'Fatty Liver Disease', abbr: 'NAFLD' },
] as const

// All disease keys for iteration
export const DISEASE_KEYS: readonly DiseaseId[] = ['cad', 'stroke', 'hf', 'pad', 't2dm', 'ckd', 'nafld'] as const

// All risk keys including composites
export const ALL_RISK_KEYS = ['cad', 'stroke', 'hf', 'pad', 't2dm', 'ckd', 'nafld', 'cvd_composite', 'ncd_composite'] as const

// Biomarker targets for progress tracking
export const BIOMARKER_TARGETS: readonly BiomarkerTarget[] = [
  { key: 'sbp' as PatientProfileKey, label: 'SBP', unit: 'mmHg', target: 120 },
  { key: 'ldl' as PatientProfileKey, label: 'LDL-C', unit: 'mg/dL', target: 100 },
  { key: 'hba1c' as PatientProfileKey, label: 'HbA1c', unit: '%', target: 5.7 },
  { key: 'bmi' as PatientProfileKey, label: 'BMI', unit: 'kg/m\u00b2', target: 25 },
  { key: 'egfr' as PatientProfileKey, label: 'eGFR', unit: 'mL/min', target: 90 },
  { key: 'hdl' as PatientProfileKey, label: 'HDL-C', unit: 'mg/dL', target: 50 },
] as const

// Clinical thresholds for vital status determination
export const CLINICAL_THRESHOLDS = {
  sbp: { borderline: 130, high: 140 },
  dbp: { borderline: 85, high: 90 },
  ldl: { borderline: 130, high: 160 },
  hdl: { low: 40 }, // inverse - low is bad
  hba1c: { borderline: 5.7, high: 6.5 },
  fpg: { borderline: 100, high: 126 },
  bmi: { borderline: 25, high: 30 },
  egfr: { borderline: 90, low: 60 }, // inverse - low is bad
  tg: { borderline: 150, high: 200 },
} as const

// Storage keys for localStorage
export const STORAGE_KEYS = {
  PATIENTS: 'ncd-care-plus-patients',
  ACTIVE_PATIENT: 'ncd-care-plus-active',
  HISTORY_PREFIX: 'ncd-care-plus-history',
  THEME: 'ncd-care-plus-theme',
} as const

// Default patient ID when none selected
export const DEFAULT_PATIENT_ID = 'demo-moderate'
