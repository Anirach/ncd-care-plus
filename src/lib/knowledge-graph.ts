// NCD-CIE Knowledge Graph — 107-edge causal knowledge graph
// Based on NCD-CIE v16 paper: 51 nodes, 8 clinical domains

export type ClinicalDomain =
  | 'Lipid Metabolism'
  | 'Glycaemic Regulation'
  | 'Blood Pressure'
  | 'Renal Function'
  | 'Inflammatory Markers'
  | 'Anthropometrics'
  | 'Lifestyle'
  | 'Disease Endpoints'
  | 'Interventions'

export type EvidenceGrade = 'A' | 'B' | 'C' | 'D'

export type NodeType = 'biomarker' | 'disease' | 'lifestyle' | 'medication' | 'demographic'

export interface KGNode {
  id: string
  label: string
  domain: ClinicalDomain
  type: NodeType
  unit?: string
  normalRange?: { min: number; max: number }
  description: string
  bradfordHill?: number
}

export interface KGEdge {
  id: string
  source: string
  target: string
  weight: number
  ci: [number, number]
  evidenceGrade: EvidenceGrade
  domain: ClinicalDomain
  description: string
  bradfordHill?: number
}

// Domain colors for visualization
export const domainColors: Record<ClinicalDomain, string> = {
  'Lipid Metabolism': '#3b82f6',
  'Glycaemic Regulation': '#8b5cf6',
  'Blood Pressure': '#ef4444',
  'Renal Function': '#f59e0b',
  'Inflammatory Markers': '#ec4899',
  'Anthropometrics': '#06b6d4',
  'Lifestyle': '#22c55e',
  'Disease Endpoints': '#dc2626',
  'Interventions': '#6366f1',
}

export const nodes: KGNode[] = [
  // Demographics
  { id: 'age', label: 'Age', domain: 'Lifestyle', type: 'demographic', unit: 'years', description: 'Patient age in years' },
  { id: 'sex', label: 'Sex', domain: 'Lifestyle', type: 'demographic', description: 'Biological sex (0=Female, 1=Male)' },

  // Lipid Metabolism
  { id: 'ldl', label: 'LDL-C', domain: 'Lipid Metabolism', type: 'biomarker', unit: 'mg/dL', normalRange: { min: 0, max: 100 }, description: 'Low-density lipoprotein cholesterol' },
  { id: 'hdl', label: 'HDL-C', domain: 'Lipid Metabolism', type: 'biomarker', unit: 'mg/dL', normalRange: { min: 40, max: 60 }, description: 'High-density lipoprotein cholesterol' },
  { id: 'tc', label: 'Total-C', domain: 'Lipid Metabolism', type: 'biomarker', unit: 'mg/dL', normalRange: { min: 0, max: 200 }, description: 'Total cholesterol' },
  { id: 'tg', label: 'TG', domain: 'Lipid Metabolism', type: 'biomarker', unit: 'mg/dL', normalRange: { min: 0, max: 150 }, description: 'Triglycerides' },

  // Blood Pressure
  { id: 'sbp', label: 'SBP', domain: 'Blood Pressure', type: 'biomarker', unit: 'mmHg', normalRange: { min: 90, max: 120 }, description: 'Systolic blood pressure' },
  { id: 'dbp', label: 'DBP', domain: 'Blood Pressure', type: 'biomarker', unit: 'mmHg', normalRange: { min: 60, max: 80 }, description: 'Diastolic blood pressure' },

  // Glycaemic Regulation
  { id: 'hba1c', label: 'HbA1c', domain: 'Glycaemic Regulation', type: 'biomarker', unit: '%', normalRange: { min: 4, max: 5.7 }, description: 'Glycated hemoglobin' },
  { id: 'fpg', label: 'FPG', domain: 'Glycaemic Regulation', type: 'biomarker', unit: 'mg/dL', normalRange: { min: 70, max: 100 }, description: 'Fasting plasma glucose' },

  // Renal Function
  { id: 'egfr', label: 'eGFR', domain: 'Renal Function', type: 'biomarker', unit: 'mL/min/1.73m²', normalRange: { min: 90, max: 120 }, description: 'Estimated glomerular filtration rate' },

  // Anthropometrics
  { id: 'bmi', label: 'BMI', domain: 'Anthropometrics', type: 'biomarker', unit: 'kg/m²', normalRange: { min: 18.5, max: 25 }, description: 'Body mass index' },

  // Lifestyle
  { id: 'smoking', label: 'Smoking', domain: 'Lifestyle', type: 'lifestyle', description: 'Smoking status (0=Never, 0.5=Former, 1=Current)' },
  { id: 'exercise', label: 'Exercise', domain: 'Lifestyle', type: 'lifestyle', unit: 'days/week', description: 'Exercise frequency (0-7 days per week)' },
  { id: 'alcohol', label: 'Alcohol', domain: 'Lifestyle', type: 'lifestyle', description: 'Alcohol intake (0=None, 0.5=Moderate, 1=Heavy)' },
  { id: 'diet', label: 'Diet Quality', domain: 'Lifestyle', type: 'lifestyle', description: 'Diet quality score (0-1, higher=healthier)' },

  // Interventions
  { id: 'statin', label: 'Statin', domain: 'Interventions', type: 'medication', description: 'Statin therapy (0=No, 1=Yes)' },
  { id: 'htn_med', label: 'HTN-med', domain: 'Interventions', type: 'medication', description: 'Antihypertensive medication (0=No, 1=Yes)' },
  { id: 'sglt2i', label: 'SGLT2i', domain: 'Interventions', type: 'medication', description: 'SGLT2 inhibitor (0=No, 1=Yes)' },
  { id: 'metformin', label: 'Metformin', domain: 'Interventions', type: 'medication', description: 'Metformin therapy (0=No, 1=Yes)' },
  { id: 'aspirin', label: 'Aspirin', domain: 'Interventions', type: 'medication', description: 'Aspirin therapy (0=No, 1=Yes)' },
  { id: 'ace_arb', label: 'ACEi/ARB', domain: 'Interventions', type: 'medication', description: 'ACE inhibitor or ARB (0=No, 1=Yes)' },

  // Intermediate conditions
  { id: 'diabetes', label: 'Diabetes', domain: 'Glycaemic Regulation', type: 'biomarker', description: 'Diabetes status (derived from HbA1c/FPG)' },
  { id: 'hypertension', label: 'Hypertension', domain: 'Blood Pressure', type: 'biomarker', description: 'Hypertension status (derived from SBP/DBP)' },

  // Disease Endpoints
  { id: 'cad', label: 'CAD', domain: 'Disease Endpoints', type: 'disease', description: 'Coronary artery disease' },
  { id: 'stroke', label: 'Stroke', domain: 'Disease Endpoints', type: 'disease', description: 'Cerebrovascular accident' },
  { id: 'hf', label: 'Heart Failure', domain: 'Disease Endpoints', type: 'disease', description: 'Heart failure' },
  { id: 'pad', label: 'PAD', domain: 'Disease Endpoints', type: 'disease', description: 'Peripheral artery disease' },
  { id: 't2dm', label: 'T2DM', domain: 'Disease Endpoints', type: 'disease', description: 'Type 2 diabetes mellitus' },
  { id: 'ckd', label: 'CKD', domain: 'Disease Endpoints', type: 'disease', description: 'Chronic kidney disease' },
  { id: 'nafld', label: 'NAFLD', domain: 'Disease Endpoints', type: 'disease', description: 'Non-alcoholic fatty liver disease' },
]

export const edges: KGEdge[] = [
  // LDL-C edges
  { id: 'e1', source: 'ldl', target: 'cad', weight: 0.28, ci: [0.22, 0.34], evidenceGrade: 'A', domain: 'Lipid Metabolism', description: 'LDL-C increases CAD risk', bradfordHill: 7.5 },
  { id: 'e2', source: 'ldl', target: 'stroke', weight: 0.14, ci: [0.08, 0.20], evidenceGrade: 'A', domain: 'Lipid Metabolism', description: 'LDL-C increases stroke risk', bradfordHill: 6.0 },
  { id: 'e3', source: 'ldl', target: 'pad', weight: 0.22, ci: [0.15, 0.29], evidenceGrade: 'B', domain: 'Lipid Metabolism', description: 'LDL-C increases PAD risk', bradfordHill: 5.5 },
  { id: 'e4', source: 'ldl', target: 'nafld', weight: 0.12, ci: [0.06, 0.18], evidenceGrade: 'B', domain: 'Lipid Metabolism', description: 'LDL-C increases NAFLD risk', bradfordHill: 4.5 },

  // HDL-C edges
  { id: 'e5', source: 'hdl', target: 'cad', weight: -0.18, ci: [-0.24, -0.12], evidenceGrade: 'A', domain: 'Lipid Metabolism', description: 'HDL-C is protective against CAD', bradfordHill: 7.0 },
  { id: 'e6', source: 'hdl', target: 'stroke', weight: -0.10, ci: [-0.16, -0.04], evidenceGrade: 'B', domain: 'Lipid Metabolism', description: 'HDL-C is protective against stroke', bradfordHill: 5.0 },
  { id: 'e7', source: 'hdl', target: 'pad', weight: -0.14, ci: [-0.20, -0.08], evidenceGrade: 'B', domain: 'Lipid Metabolism', description: 'HDL-C is protective against PAD', bradfordHill: 5.5 },

  // Total cholesterol
  { id: 'e8', source: 'tc', target: 'cad', weight: 0.20, ci: [0.14, 0.26], evidenceGrade: 'A', domain: 'Lipid Metabolism', description: 'Total cholesterol increases CAD risk', bradfordHill: 7.0 },
  { id: 'e9', source: 'tc', target: 'stroke', weight: 0.10, ci: [0.04, 0.16], evidenceGrade: 'B', domain: 'Lipid Metabolism', description: 'Total cholesterol increases stroke risk', bradfordHill: 5.0 },

  // Triglycerides
  { id: 'e10', source: 'tg', target: 'cad', weight: 0.15, ci: [0.09, 0.21], evidenceGrade: 'B', domain: 'Lipid Metabolism', description: 'Triglycerides increase CAD risk', bradfordHill: 5.5 },
  { id: 'e11', source: 'tg', target: 'nafld', weight: 0.25, ci: [0.18, 0.32], evidenceGrade: 'A', domain: 'Lipid Metabolism', description: 'Triglycerides increase NAFLD risk', bradfordHill: 7.0 },
  { id: 'e12', source: 'tg', target: 't2dm', weight: 0.12, ci: [0.06, 0.18], evidenceGrade: 'B', domain: 'Lipid Metabolism', description: 'Triglycerides increase T2DM risk', bradfordHill: 5.0 },

  // SBP edges
  { id: 'e13', source: 'sbp', target: 'cad', weight: 0.35, ci: [0.28, 0.42], evidenceGrade: 'A', domain: 'Blood Pressure', description: 'SBP increases CAD risk', bradfordHill: 8.0 },
  { id: 'e14', source: 'sbp', target: 'stroke', weight: 0.42, ci: [0.35, 0.49], evidenceGrade: 'A', domain: 'Blood Pressure', description: 'SBP increases stroke risk (strongest BP-stroke link)', bradfordHill: 8.5 },
  { id: 'e15', source: 'sbp', target: 'hf', weight: 0.25, ci: [0.18, 0.32], evidenceGrade: 'A', domain: 'Blood Pressure', description: 'SBP increases heart failure risk', bradfordHill: 7.5 },
  { id: 'e16', source: 'sbp', target: 'ckd', weight: 0.18, ci: [0.12, 0.24], evidenceGrade: 'A', domain: 'Blood Pressure', description: 'SBP increases CKD risk', bradfordHill: 7.0 },
  { id: 'e17', source: 'sbp', target: 'pad', weight: 0.20, ci: [0.13, 0.27], evidenceGrade: 'B', domain: 'Blood Pressure', description: 'SBP increases PAD risk', bradfordHill: 6.0 },

  // DBP edges
  { id: 'e18', source: 'dbp', target: 'cad', weight: 0.20, ci: [0.14, 0.26], evidenceGrade: 'A', domain: 'Blood Pressure', description: 'DBP increases CAD risk', bradfordHill: 7.0 },
  { id: 'e19', source: 'dbp', target: 'stroke', weight: 0.25, ci: [0.18, 0.32], evidenceGrade: 'A', domain: 'Blood Pressure', description: 'DBP increases stroke risk', bradfordHill: 7.5 },
  { id: 'e20', source: 'dbp', target: 'hf', weight: 0.15, ci: [0.09, 0.21], evidenceGrade: 'B', domain: 'Blood Pressure', description: 'DBP increases heart failure risk', bradfordHill: 5.5 },

  // Smoking edges
  { id: 'e21', source: 'smoking', target: 'cad', weight: 0.45, ci: [0.38, 0.52], evidenceGrade: 'A', domain: 'Lifestyle', description: 'Smoking strongly increases CAD risk', bradfordHill: 8.5 },
  { id: 'e22', source: 'smoking', target: 'stroke', weight: 0.32, ci: [0.25, 0.39], evidenceGrade: 'A', domain: 'Lifestyle', description: 'Smoking increases stroke risk', bradfordHill: 8.0 },
  { id: 'e23', source: 'smoking', target: 'pad', weight: 0.50, ci: [0.42, 0.58], evidenceGrade: 'A', domain: 'Lifestyle', description: 'Smoking strongly increases PAD risk', bradfordHill: 9.0 },
  { id: 'e24', source: 'smoking', target: 'ckd', weight: 0.15, ci: [0.08, 0.22], evidenceGrade: 'B', domain: 'Lifestyle', description: 'Smoking increases CKD risk', bradfordHill: 5.5 },
  { id: 'e25', source: 'smoking', target: 'hf', weight: 0.20, ci: [0.13, 0.27], evidenceGrade: 'B', domain: 'Lifestyle', description: 'Smoking increases heart failure risk', bradfordHill: 6.0 },

  // Age edges
  { id: 'e26', source: 'age', target: 'cad', weight: 0.50, ci: [0.44, 0.56], evidenceGrade: 'A', domain: 'Lifestyle', description: 'Age is the strongest CAD risk factor', bradfordHill: 9.0 },
  { id: 'e27', source: 'age', target: 'stroke', weight: 0.48, ci: [0.42, 0.54], evidenceGrade: 'A', domain: 'Lifestyle', description: 'Age strongly increases stroke risk', bradfordHill: 9.0 },
  { id: 'e28', source: 'age', target: 'hf', weight: 0.45, ci: [0.38, 0.52], evidenceGrade: 'A', domain: 'Lifestyle', description: 'Age increases heart failure risk', bradfordHill: 8.5 },
  { id: 'e29', source: 'age', target: 't2dm', weight: 0.30, ci: [0.24, 0.36], evidenceGrade: 'A', domain: 'Lifestyle', description: 'Age increases T2DM risk', bradfordHill: 7.0 },
  { id: 'e30', source: 'age', target: 'ckd', weight: 0.40, ci: [0.33, 0.47], evidenceGrade: 'A', domain: 'Lifestyle', description: 'Age increases CKD risk', bradfordHill: 8.5 },
  { id: 'e31', source: 'age', target: 'pad', weight: 0.38, ci: [0.31, 0.45], evidenceGrade: 'A', domain: 'Lifestyle', description: 'Age increases PAD risk', bradfordHill: 8.0 },
  { id: 'e32', source: 'age', target: 'nafld', weight: 0.15, ci: [0.08, 0.22], evidenceGrade: 'B', domain: 'Lifestyle', description: 'Age increases NAFLD risk', bradfordHill: 5.0 },

  // Sex edges
  { id: 'e33', source: 'sex', target: 'cad', weight: 0.25, ci: [0.18, 0.32], evidenceGrade: 'A', domain: 'Lifestyle', description: 'Male sex increases CAD risk', bradfordHill: 7.0 },
  { id: 'e34', source: 'sex', target: 'stroke', weight: 0.12, ci: [0.06, 0.18], evidenceGrade: 'B', domain: 'Lifestyle', description: 'Male sex slightly increases stroke risk', bradfordHill: 5.0 },
  { id: 'e35', source: 'sex', target: 'pad', weight: 0.18, ci: [0.11, 0.25], evidenceGrade: 'B', domain: 'Lifestyle', description: 'Male sex increases PAD risk', bradfordHill: 5.5 },
  { id: 'e36', source: 'sex', target: 'hf', weight: 0.15, ci: [0.08, 0.22], evidenceGrade: 'B', domain: 'Lifestyle', description: 'Male sex increases heart failure risk', bradfordHill: 5.5 },

  // BMI edges
  { id: 'e37', source: 'bmi', target: 'cad', weight: 0.15, ci: [0.09, 0.21], evidenceGrade: 'A', domain: 'Anthropometrics', description: 'BMI increases CAD risk', bradfordHill: 6.5 },
  { id: 'e38', source: 'bmi', target: 'hf', weight: 0.22, ci: [0.15, 0.29], evidenceGrade: 'A', domain: 'Anthropometrics', description: 'BMI increases heart failure risk', bradfordHill: 7.0 },
  { id: 'e39', source: 'bmi', target: 't2dm', weight: 0.38, ci: [0.31, 0.45], evidenceGrade: 'A', domain: 'Anthropometrics', description: 'BMI strongly increases T2DM risk', bradfordHill: 8.0 },
  { id: 'e40', source: 'bmi', target: 'nafld', weight: 0.35, ci: [0.28, 0.42], evidenceGrade: 'A', domain: 'Anthropometrics', description: 'BMI strongly increases NAFLD risk', bradfordHill: 8.0 },
  { id: 'e41', source: 'bmi', target: 'ckd', weight: 0.12, ci: [0.06, 0.18], evidenceGrade: 'B', domain: 'Anthropometrics', description: 'BMI increases CKD risk', bradfordHill: 5.0 },
  { id: 'e42', source: 'bmi', target: 'stroke', weight: 0.10, ci: [0.04, 0.16], evidenceGrade: 'B', domain: 'Anthropometrics', description: 'BMI increases stroke risk', bradfordHill: 5.0 },
  { id: 'e43', source: 'bmi', target: 'sbp', weight: 0.22, ci: [0.16, 0.28], evidenceGrade: 'A', domain: 'Anthropometrics', description: 'BMI raises blood pressure', bradfordHill: 7.5 },
  { id: 'e44', source: 'bmi', target: 'tg', weight: 0.20, ci: [0.14, 0.26], evidenceGrade: 'A', domain: 'Anthropometrics', description: 'BMI raises triglycerides', bradfordHill: 7.0 },
  { id: 'e45', source: 'bmi', target: 'hba1c', weight: 0.18, ci: [0.12, 0.24], evidenceGrade: 'A', domain: 'Anthropometrics', description: 'BMI raises HbA1c', bradfordHill: 7.0 },
  { id: 'e46', source: 'bmi', target: 'hdl', weight: -0.15, ci: [-0.21, -0.09], evidenceGrade: 'A', domain: 'Anthropometrics', description: 'BMI lowers HDL-C', bradfordHill: 6.5 },

  // Exercise edges
  { id: 'e47', source: 'exercise', target: 'cad', weight: -0.20, ci: [-0.27, -0.13], evidenceGrade: 'A', domain: 'Lifestyle', description: 'Exercise reduces CAD risk', bradfordHill: 7.0 },
  { id: 'e48', source: 'exercise', target: 'bmi', weight: -0.12, ci: [-0.18, -0.06], evidenceGrade: 'A', domain: 'Lifestyle', description: 'Exercise reduces BMI', bradfordHill: 6.5 },
  { id: 'e49', source: 'exercise', target: 'sbp', weight: -0.10, ci: [-0.16, -0.04], evidenceGrade: 'A', domain: 'Lifestyle', description: 'Exercise reduces SBP', bradfordHill: 6.0 },
  { id: 'e50', source: 'exercise', target: 'hba1c', weight: -0.08, ci: [-0.14, -0.02], evidenceGrade: 'B', domain: 'Lifestyle', description: 'Exercise reduces HbA1c', bradfordHill: 5.5 },
  { id: 'e51', source: 'exercise', target: 'hdl', weight: 0.10, ci: [0.04, 0.16], evidenceGrade: 'A', domain: 'Lifestyle', description: 'Exercise raises HDL-C', bradfordHill: 6.0 },
  { id: 'e52', source: 'exercise', target: 'tg', weight: -0.08, ci: [-0.14, -0.02], evidenceGrade: 'B', domain: 'Lifestyle', description: 'Exercise reduces triglycerides', bradfordHill: 5.5 },
  { id: 'e53', source: 'exercise', target: 't2dm', weight: -0.15, ci: [-0.22, -0.08], evidenceGrade: 'A', domain: 'Lifestyle', description: 'Exercise reduces T2DM risk', bradfordHill: 7.0 },
  { id: 'e54', source: 'exercise', target: 'stroke', weight: -0.12, ci: [-0.18, -0.06], evidenceGrade: 'B', domain: 'Lifestyle', description: 'Exercise reduces stroke risk', bradfordHill: 5.5 },
  { id: 'e55', source: 'exercise', target: 'hf', weight: -0.14, ci: [-0.20, -0.08], evidenceGrade: 'B', domain: 'Lifestyle', description: 'Exercise reduces heart failure risk', bradfordHill: 6.0 },

  // Alcohol edges
  { id: 'e56', source: 'alcohol', target: 'cad', weight: 0.10, ci: [0.03, 0.17], evidenceGrade: 'C', domain: 'Lifestyle', description: 'Heavy alcohol increases CAD risk', bradfordHill: 4.0 },
  { id: 'e57', source: 'alcohol', target: 'nafld', weight: 0.30, ci: [0.23, 0.37], evidenceGrade: 'A', domain: 'Lifestyle', description: 'Alcohol increases NAFLD risk', bradfordHill: 8.0 },
  { id: 'e58', source: 'alcohol', target: 'stroke', weight: 0.15, ci: [0.08, 0.22], evidenceGrade: 'B', domain: 'Lifestyle', description: 'Alcohol increases stroke risk', bradfordHill: 5.5 },
  { id: 'e59', source: 'alcohol', target: 'sbp', weight: 0.12, ci: [0.06, 0.18], evidenceGrade: 'B', domain: 'Lifestyle', description: 'Alcohol raises blood pressure', bradfordHill: 6.0 },

  // Diet edges
  { id: 'e60', source: 'diet', target: 'bmi', weight: -0.15, ci: [-0.22, -0.08], evidenceGrade: 'B', domain: 'Lifestyle', description: 'Good diet reduces BMI', bradfordHill: 5.5 },
  { id: 'e61', source: 'diet', target: 'ldl', weight: -0.12, ci: [-0.18, -0.06], evidenceGrade: 'B', domain: 'Lifestyle', description: 'Good diet reduces LDL-C', bradfordHill: 5.5 },
  { id: 'e62', source: 'diet', target: 'sbp', weight: -0.08, ci: [-0.14, -0.02], evidenceGrade: 'B', domain: 'Lifestyle', description: 'Good diet reduces SBP', bradfordHill: 5.0 },
  { id: 'e63', source: 'diet', target: 'fpg', weight: -0.10, ci: [-0.16, -0.04], evidenceGrade: 'B', domain: 'Lifestyle', description: 'Good diet reduces FPG', bradfordHill: 5.5 },
  { id: 'e64', source: 'diet', target: 'tg', weight: -0.10, ci: [-0.16, -0.04], evidenceGrade: 'B', domain: 'Lifestyle', description: 'Good diet reduces triglycerides', bradfordHill: 5.5 },

  // T2DM Domain
  { id: 'e65', source: 'hba1c', target: 't2dm', weight: 0.68, ci: [0.60, 0.76], evidenceGrade: 'A', domain: 'Glycaemic Regulation', description: 'HbA1c is the primary T2DM predictor', bradfordHill: 9.0 },
  { id: 'e66', source: 'fpg', target: 't2dm', weight: 0.55, ci: [0.48, 0.62], evidenceGrade: 'A', domain: 'Glycaemic Regulation', description: 'FPG is a strong T2DM predictor', bradfordHill: 8.5 },
  { id: 'e67', source: 'hba1c', target: 'cad', weight: 0.18, ci: [0.12, 0.24], evidenceGrade: 'A', domain: 'Glycaemic Regulation', description: 'HbA1c increases CAD risk (glycemic burden)', bradfordHill: 7.0 },
  { id: 'e68', source: 'hba1c', target: 'ckd', weight: 0.22, ci: [0.15, 0.29], evidenceGrade: 'A', domain: 'Glycaemic Regulation', description: 'HbA1c increases CKD risk', bradfordHill: 7.5 },
  { id: 'e69', source: 'hba1c', target: 'stroke', weight: 0.15, ci: [0.09, 0.21], evidenceGrade: 'B', domain: 'Glycaemic Regulation', description: 'HbA1c increases stroke risk', bradfordHill: 6.0 },
  { id: 'e70', source: 'fpg', target: 'cad', weight: 0.12, ci: [0.06, 0.18], evidenceGrade: 'B', domain: 'Glycaemic Regulation', description: 'FPG increases CAD risk', bradfordHill: 5.5 },
  { id: 'e71', source: 'diabetes', target: 'ckd', weight: 0.35, ci: [0.28, 0.42], evidenceGrade: 'A', domain: 'Glycaemic Regulation', description: 'Diabetes is a major CKD risk factor', bradfordHill: 8.0 },
  { id: 'e72', source: 'diabetes', target: 'cad', weight: 0.30, ci: [0.23, 0.37], evidenceGrade: 'A', domain: 'Glycaemic Regulation', description: 'Diabetes increases CAD risk', bradfordHill: 8.0 },
  { id: 'e73', source: 'diabetes', target: 'stroke', weight: 0.25, ci: [0.18, 0.32], evidenceGrade: 'A', domain: 'Glycaemic Regulation', description: 'Diabetes increases stroke risk', bradfordHill: 7.5 },
  { id: 'e74', source: 'diabetes', target: 'hf', weight: 0.28, ci: [0.21, 0.35], evidenceGrade: 'A', domain: 'Glycaemic Regulation', description: 'Diabetes increases heart failure risk', bradfordHill: 7.5 },
  { id: 'e75', source: 'diabetes', target: 'pad', weight: 0.32, ci: [0.25, 0.39], evidenceGrade: 'A', domain: 'Glycaemic Regulation', description: 'Diabetes increases PAD risk', bradfordHill: 8.0 },

  // CKD Domain
  { id: 'e76', source: 'egfr', target: 'ckd', weight: -0.45, ci: [-0.52, -0.38], evidenceGrade: 'A', domain: 'Renal Function', description: 'Low eGFR strongly indicates CKD', bradfordHill: 9.0 },
  { id: 'e77', source: 'egfr', target: 'hf', weight: -0.15, ci: [-0.22, -0.08], evidenceGrade: 'B', domain: 'Renal Function', description: 'Low eGFR increases heart failure risk', bradfordHill: 6.0 },
  { id: 'e78', source: 'egfr', target: 'cad', weight: -0.12, ci: [-0.18, -0.06], evidenceGrade: 'B', domain: 'Renal Function', description: 'Low eGFR increases CAD risk', bradfordHill: 5.5 },

  // Hypertension intermediary
  { id: 'e79', source: 'hypertension', target: 'cad', weight: 0.32, ci: [0.25, 0.39], evidenceGrade: 'A', domain: 'Blood Pressure', description: 'Hypertension increases CAD risk', bradfordHill: 8.0 },
  { id: 'e80', source: 'hypertension', target: 'stroke', weight: 0.40, ci: [0.33, 0.47], evidenceGrade: 'A', domain: 'Blood Pressure', description: 'Hypertension is the top stroke risk factor', bradfordHill: 8.5 },
  { id: 'e81', source: 'hypertension', target: 'hf', weight: 0.30, ci: [0.23, 0.37], evidenceGrade: 'A', domain: 'Blood Pressure', description: 'Hypertension increases HF risk', bradfordHill: 8.0 },
  { id: 'e82', source: 'hypertension', target: 'ckd', weight: 0.25, ci: [0.18, 0.32], evidenceGrade: 'A', domain: 'Blood Pressure', description: 'Hypertension increases CKD risk', bradfordHill: 7.5 },

  // Statin
  { id: 'e83', source: 'statin', target: 'ldl', weight: -0.35, ci: [-0.42, -0.28], evidenceGrade: 'A', domain: 'Interventions', description: 'Statins reduce LDL-C significantly', bradfordHill: 9.0 },
  { id: 'e84', source: 'statin', target: 'cad', weight: -0.22, ci: [-0.29, -0.15], evidenceGrade: 'A', domain: 'Interventions', description: 'Statins directly reduce CAD risk', bradfordHill: 8.5 },
  { id: 'e85', source: 'statin', target: 'stroke', weight: -0.12, ci: [-0.18, -0.06], evidenceGrade: 'A', domain: 'Interventions', description: 'Statins reduce stroke risk', bradfordHill: 7.0 },
  { id: 'e86', source: 'statin', target: 'tc', weight: -0.30, ci: [-0.37, -0.23], evidenceGrade: 'A', domain: 'Interventions', description: 'Statins reduce total cholesterol', bradfordHill: 9.0 },
  { id: 'e87', source: 'statin', target: 'tg', weight: -0.10, ci: [-0.16, -0.04], evidenceGrade: 'B', domain: 'Interventions', description: 'Statins slightly reduce triglycerides', bradfordHill: 5.0 },

  // HTN medication
  { id: 'e88', source: 'htn_med', target: 'sbp', weight: -0.30, ci: [-0.37, -0.23], evidenceGrade: 'A', domain: 'Interventions', description: 'HTN meds reduce SBP significantly', bradfordHill: 9.0 },
  { id: 'e89', source: 'htn_med', target: 'dbp', weight: -0.25, ci: [-0.32, -0.18], evidenceGrade: 'A', domain: 'Interventions', description: 'HTN meds reduce DBP', bradfordHill: 8.5 },
  { id: 'e90', source: 'htn_med', target: 'stroke', weight: -0.18, ci: [-0.25, -0.11], evidenceGrade: 'A', domain: 'Interventions', description: 'HTN meds reduce stroke risk directly', bradfordHill: 8.0 },
  { id: 'e91', source: 'htn_med', target: 'hf', weight: -0.15, ci: [-0.22, -0.08], evidenceGrade: 'A', domain: 'Interventions', description: 'HTN meds reduce heart failure risk', bradfordHill: 7.0 },

  // SGLT2i
  { id: 'e92', source: 'sglt2i', target: 'hba1c', weight: -0.15, ci: [-0.22, -0.08], evidenceGrade: 'A', domain: 'Interventions', description: 'SGLT2i reduces HbA1c', bradfordHill: 8.0 },
  { id: 'e93', source: 'sglt2i', target: 'hf', weight: -0.25, ci: [-0.32, -0.18], evidenceGrade: 'A', domain: 'Interventions', description: 'SGLT2i significantly reduces HF risk', bradfordHill: 8.5 },
  { id: 'e94', source: 'sglt2i', target: 'ckd', weight: -0.28, ci: [-0.35, -0.21], evidenceGrade: 'A', domain: 'Interventions', description: 'SGLT2i significantly reduces CKD progression', bradfordHill: 8.5 },
  { id: 'e95', source: 'sglt2i', target: 'egfr', weight: 0.12, ci: [0.06, 0.18], evidenceGrade: 'A', domain: 'Interventions', description: 'SGLT2i preserves eGFR', bradfordHill: 7.0 },
  { id: 'e96', source: 'sglt2i', target: 'bmi', weight: -0.08, ci: [-0.14, -0.02], evidenceGrade: 'B', domain: 'Interventions', description: 'SGLT2i causes modest weight loss', bradfordHill: 5.5 },
  { id: 'e97', source: 'sglt2i', target: 'sbp', weight: -0.06, ci: [-0.12, 0.00], evidenceGrade: 'B', domain: 'Interventions', description: 'SGLT2i slightly reduces SBP', bradfordHill: 5.0 },

  // Metformin
  { id: 'e98', source: 'metformin', target: 'hba1c', weight: -0.20, ci: [-0.27, -0.13], evidenceGrade: 'A', domain: 'Interventions', description: 'Metformin reduces HbA1c', bradfordHill: 8.5 },
  { id: 'e99', source: 'metformin', target: 'fpg', weight: -0.22, ci: [-0.29, -0.15], evidenceGrade: 'A', domain: 'Interventions', description: 'Metformin reduces FPG', bradfordHill: 8.5 },
  { id: 'e100', source: 'metformin', target: 't2dm', weight: -0.18, ci: [-0.25, -0.11], evidenceGrade: 'A', domain: 'Interventions', description: 'Metformin reduces T2DM risk/progression', bradfordHill: 8.0 },
  { id: 'e101', source: 'metformin', target: 'bmi', weight: -0.05, ci: [-0.11, 0.01], evidenceGrade: 'C', domain: 'Interventions', description: 'Metformin has modest weight effect', bradfordHill: 3.5 },
  { id: 'e102', source: 'metformin', target: 'cad', weight: -0.08, ci: [-0.15, -0.01], evidenceGrade: 'B', domain: 'Interventions', description: 'Metformin may reduce CAD risk', bradfordHill: 5.0 },

  // Aspirin
  { id: 'e103', source: 'aspirin', target: 'cad', weight: -0.15, ci: [-0.22, -0.08], evidenceGrade: 'A', domain: 'Interventions', description: 'Aspirin reduces CAD risk', bradfordHill: 7.5 },
  { id: 'e104', source: 'aspirin', target: 'stroke', weight: -0.10, ci: [-0.17, -0.03], evidenceGrade: 'B', domain: 'Interventions', description: 'Aspirin reduces stroke risk', bradfordHill: 6.0 },

  // ACEi/ARB
  { id: 'e105', source: 'ace_arb', target: 'ckd', weight: -0.22, ci: [-0.29, -0.15], evidenceGrade: 'A', domain: 'Interventions', description: 'ACEi/ARB slows CKD progression', bradfordHill: 8.5 },
  { id: 'e106', source: 'ace_arb', target: 'hf', weight: -0.20, ci: [-0.27, -0.13], evidenceGrade: 'A', domain: 'Interventions', description: 'ACEi/ARB reduces heart failure risk', bradfordHill: 8.0 },
  { id: 'e107', source: 'ace_arb', target: 'sbp', weight: -0.25, ci: [-0.32, -0.18], evidenceGrade: 'A', domain: 'Interventions', description: 'ACEi/ARB reduces blood pressure', bradfordHill: 8.5 },
]

export function getEdgesFrom(nodeId: string): KGEdge[] {
  return edges.filter(e => e.source === nodeId)
}

export function getEdgesTo(nodeId: string): KGEdge[] {
  return edges.filter(e => e.target === nodeId)
}

export function getNode(nodeId: string): KGNode | undefined {
  return nodes.find(n => n.id === nodeId)
}

export const topologicalOrder: string[] = [
  'statin', 'htn_med', 'sglt2i', 'metformin', 'aspirin', 'ace_arb',
  'exercise', 'diet', 'smoking', 'alcohol',
  'age', 'sex',
  'bmi', 'ldl', 'hdl', 'tc', 'tg', 'sbp', 'dbp', 'hba1c', 'fpg', 'egfr',
  'diabetes', 'hypertension',
  'cad', 'stroke', 'hf', 'pad', 't2dm', 'ckd', 'nafld',
]
