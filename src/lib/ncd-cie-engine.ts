// NCD-CIE Risk Prediction Engine
// Implements the NCD-CIE v16 paper's formulas exactly

import { edges, topologicalOrder, getEdgesTo } from './knowledge-graph'

export interface PatientProfile {
  id: string
  name: string
  age: number
  sex: number
  sbp: number
  dbp: number
  ldl: number
  hdl: number
  tc: number
  tg: number
  hba1c: number
  fpg: number
  bmi: number
  egfr: number
  smoking: number
  exercise: number
  alcohol: number
  diet: number
  statin: number
  htn_med: number
  sglt2i: number
  metformin: number
  aspirin: number
  ace_arb: number
  diabetes?: number
  hypertension?: number
}

export interface RiskWithCI {
  value: number
  ci_low: number
  ci_high: number
}

export interface FullRiskResult {
  cad: RiskWithCI
  stroke: RiskWithCI
  hf: RiskWithCI
  pad: RiskWithCI
  t2dm: RiskWithCI
  ckd: RiskWithCI
  nafld: RiskWithCI
  cvd_composite: RiskWithCI
  ncd_composite: RiskWithCI
}

export interface RiskContribution {
  nodeId: string
  label: string
  contribution: number
  zScore: number
}

const referenceStats: Record<string, { mean: number; std: number }> = {
  age: { mean: 55, std: 12 },
  sex: { mean: 0.5, std: 0.5 },
  sbp: { mean: 130, std: 18 },
  dbp: { mean: 82, std: 10 },
  ldl: { mean: 130, std: 35 },
  hdl: { mean: 50, std: 14 },
  tc: { mean: 210, std: 40 },
  tg: { mean: 150, std: 70 },
  hba1c: { mean: 5.8, std: 0.9 },
  fpg: { mean: 105, std: 25 },
  bmi: { mean: 26, std: 4.5 },
  egfr: { mean: 85, std: 22 },
  smoking: { mean: 0.25, std: 0.4 },
  exercise: { mean: 2.5, std: 2.0 },
  alcohol: { mean: 0.2, std: 0.3 },
  diet: { mean: 0.5, std: 0.25 },
  statin: { mean: 0.2, std: 0.4 },
  htn_med: { mean: 0.3, std: 0.45 },
  sglt2i: { mean: 0.05, std: 0.22 },
  metformin: { mean: 0.15, std: 0.35 },
  aspirin: { mean: 0.15, std: 0.35 },
  ace_arb: { mean: 0.2, std: 0.4 },
  diabetes: { mean: 0.15, std: 0.35 },
  hypertension: { mean: 0.35, std: 0.48 },
}

const diseaseIntercepts: Record<string, number> = {
  cad: -2.5,
  stroke: -3.0,
  hf: -3.2,
  pad: -3.5,
  t2dm: -2.8,
  ckd: -2.6,
  nafld: -2.0,
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

function standardize(nodeId: string, value: number): number {
  const stats = referenceStats[nodeId]
  if (!stats) return 0
  return (value - stats.mean) / stats.std
}

function deriveConditions(profile: PatientProfile): PatientProfile {
  const p = { ...profile }
  p.diabetes = (p.hba1c >= 6.5 || p.fpg >= 126) ? 1 : (p.hba1c >= 5.7 || p.fpg >= 100) ? 0.5 : 0
  p.hypertension = (p.sbp >= 140 || p.dbp >= 90) ? 1 : (p.sbp >= 130 || p.dbp >= 85) ? 0.5 : 0
  return p
}

function getPatientValue(profile: PatientProfile, nodeId: string): number {
  return (profile as unknown as Record<string, number>)[nodeId] ?? 0
}

export function computeDiseaseRiskWithCI(profile: PatientProfile, diseaseId: string): RiskWithCI {
  const p = deriveConditions(profile)
  const intercept = diseaseIntercepts[diseaseId] ?? -2.5
  const incomingEdges = getEdgesTo(diseaseId)

  let logit = intercept
  let logitLow = intercept
  let logitHigh = intercept

  for (const edge of incomingEdges) {
    const rawValue = getPatientValue(p, edge.source)
    const z = standardize(edge.source, rawValue)
    logit += edge.weight * z
    if (z >= 0) {
      logitLow += edge.ci[0] * z
      logitHigh += edge.ci[1] * z
    } else {
      logitLow += edge.ci[1] * z
      logitHigh += edge.ci[0] * z
    }
  }

  return {
    value: sigmoid(logit),
    ci_low: sigmoid(logitLow),
    ci_high: sigmoid(logitHigh),
  }
}

export function computeRiskContributions(profile: PatientProfile, diseaseId: string): RiskContribution[] {
  const p = deriveConditions(profile)
  const incomingEdges = getEdgesTo(diseaseId)
  const contributions: RiskContribution[] = []

  for (const edge of incomingEdges) {
    const rawValue = getPatientValue(p, edge.source)
    const z = standardize(edge.source, rawValue)
    const contribution = edge.weight * z
    const sourceNode = edges.find(e => e.source === edge.source)
    contributions.push({
      nodeId: edge.source,
      label: edge.source.toUpperCase(),
      contribution,
      zScore: z,
    })
  }

  return contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
}

export function computeAllRisksWithCI(profile: PatientProfile): FullRiskResult {
  const cad = computeDiseaseRiskWithCI(profile, 'cad')
  const stroke = computeDiseaseRiskWithCI(profile, 'stroke')
  const hf = computeDiseaseRiskWithCI(profile, 'hf')
  const pad = computeDiseaseRiskWithCI(profile, 'pad')
  const t2dm = computeDiseaseRiskWithCI(profile, 't2dm')
  const ckd = computeDiseaseRiskWithCI(profile, 'ckd')
  const nafld = computeDiseaseRiskWithCI(profile, 'nafld')

  const cvdVal = 1 - (1 - cad.value) * (1 - stroke.value) * (1 - hf.value) * (1 - pad.value)
  const cvdLow = 1 - (1 - cad.ci_low) * (1 - stroke.ci_low) * (1 - hf.ci_low) * (1 - pad.ci_low)
  const cvdHigh = 1 - (1 - cad.ci_high) * (1 - stroke.ci_high) * (1 - hf.ci_high) * (1 - pad.ci_high)

  const ncdVal = 1 - (1 - cvdVal) * (1 - t2dm.value) * (1 - ckd.value)
  const ncdLow = 1 - (1 - cvdLow) * (1 - t2dm.ci_low) * (1 - ckd.ci_low)
  const ncdHigh = 1 - (1 - cvdHigh) * (1 - t2dm.ci_high) * (1 - ckd.ci_high)

  return {
    cad, stroke, hf, pad, t2dm, ckd, nafld,
    cvd_composite: { value: cvdVal, ci_low: cvdLow, ci_high: cvdHigh },
    ncd_composite: { value: ncdVal, ci_low: ncdLow, ci_high: ncdHigh },
  }
}

// What-If Intervention Cascade
const GAMMA = 0.7
const D_MAX = 3

export interface CascadeResult {
  interventionProfile: PatientProfile
  risks: FullRiskResult
  deltas: Record<string, number>
  activatedEdges: string[]
}

export function whatIfIntervention(
  baseProfile: PatientProfile,
  interventions: Partial<PatientProfile>
): CascadeResult {
  const base = deriveConditions(baseProfile)
  const xINT: Record<string, number> = {}
  const deltas: Record<string, number> = {}
  const activatedEdges: string[] = []

  for (const nodeId of topologicalOrder) {
    xINT[nodeId] = getPatientValue(base, nodeId)
  }

  for (const [key, value] of Object.entries(interventions)) {
    if (value !== undefined) {
      const delta = (value as number) - (xINT[key] || 0)
      xINT[key] = value as number
      deltas[key] = delta
    }
  }

  function getDepth(source: string, target: string): number {
    const visited = new Set<string>()
    const queue: { node: string; depth: number }[] = [{ node: source, depth: 0 }]
    while (queue.length > 0) {
      const current = queue.shift()!
      if (current.node === target) return current.depth
      if (current.depth >= D_MAX) continue
      visited.add(current.node)
      const outEdges = edges.filter(e => e.source === current.node)
      for (const e of outEdges) {
        if (!visited.has(e.target)) {
          queue.push({ node: e.target, depth: current.depth + 1 })
        }
      }
    }
    return D_MAX + 1
  }

  for (const nodeId of topologicalOrder) {
    if (Object.prototype.hasOwnProperty.call(interventions, nodeId)) continue

    const incomingEdges = edges.filter(e => e.target === nodeId)
    let totalDelta = 0

    for (const edge of incomingEdges) {
      const parentDelta = (xINT[edge.source] ?? 0) - getPatientValue(base, edge.source)
      if (Math.abs(parentDelta) > 0.001) {
        let minDepth = D_MAX + 1
        for (const intKey of Object.keys(interventions)) {
          const d = getDepth(intKey, edge.source)
          minDepth = Math.min(minDepth, d + 1)
        }

        if (minDepth <= D_MAX) {
          const attenuation = Math.pow(GAMMA, minDepth)
          const cascade = edge.weight * parentDelta * attenuation
          totalDelta += cascade
          if (Math.abs(cascade) > 0.001) {
            activatedEdges.push(edge.id)
          }
        }
      }
    }

    if (Math.abs(totalDelta) > 0.001) {
      xINT[nodeId] = getPatientValue(base, nodeId) + totalDelta
      deltas[nodeId] = totalDelta
    }
  }

  const interventionProfile: PatientProfile = { ...baseProfile }
  for (const [key, value] of Object.entries(interventions)) {
    if (value !== undefined) {
      (interventionProfile as unknown as Record<string, number>)[key] = value as number
    }
  }
  for (const [key, delta] of Object.entries(deltas)) {
    if (!Object.prototype.hasOwnProperty.call(interventions, key)) {
      (interventionProfile as unknown as Record<string, number>)[key] =
        getPatientValue(base, key) + delta
    }
  }

  for (const key of Object.keys(interventions)) {
    const outEdges = edges.filter(e => e.source === key)
    for (const e of outEdges) {
      activatedEdges.push(e.id)
    }
  }

  const risks = computeAllRisksWithCI(interventionProfile)
  return { interventionProfile, risks, deltas, activatedEdges: Array.from(new Set(activatedEdges)) }
}

export function getRiskColor(risk: number): string {
  if (risk < 0.10) return '#22c55e'
  if (risk < 0.20) return '#eab308'
  if (risk < 0.30) return '#f97316'
  return '#ef4444'
}

export function getRiskLevel(risk: number): 'Low' | 'Moderate' | 'High' | 'Very High' {
  if (risk < 0.10) return 'Low'
  if (risk < 0.20) return 'Moderate'
  if (risk < 0.30) return 'High'
  return 'Very High'
}

export function getRiskBgClass(risk: number): string {
  if (risk < 0.10) return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
  if (risk < 0.20) return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
  if (risk < 0.30) return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
  return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
}

export const demoPatients: PatientProfile[] = [
  {
    id: 'demo-low',
    name: 'Sarah Chen',
    age: 40, sex: 0,
    sbp: 115, dbp: 72,
    ldl: 95, hdl: 62, tc: 185, tg: 90,
    hba1c: 5.2, fpg: 88,
    bmi: 22.5, egfr: 105,
    smoking: 0, exercise: 5, alcohol: 0, diet: 0.8,
    statin: 0, htn_med: 0, sglt2i: 0, metformin: 0, aspirin: 0, ace_arb: 0,
  },
  {
    id: 'demo-moderate',
    name: 'James Wilson',
    age: 55, sex: 1,
    sbp: 148, dbp: 92,
    ldl: 162, hdl: 38, tc: 245, tg: 210,
    hba1c: 6.1, fpg: 112,
    bmi: 29.5, egfr: 78,
    smoking: 0, exercise: 1, alcohol: 0.5, diet: 0.4,
    statin: 0, htn_med: 0, sglt2i: 0, metformin: 0, aspirin: 0, ace_arb: 0,
  },
  {
    id: 'demo-high',
    name: 'Robert Martinez',
    age: 65, sex: 1,
    sbp: 168, dbp: 98,
    ldl: 185, hdl: 32, tc: 280, tg: 290,
    hba1c: 8.2, fpg: 165,
    bmi: 33.5, egfr: 52,
    smoking: 1, exercise: 0, alcohol: 0.5, diet: 0.2,
    statin: 0, htn_med: 0, sglt2i: 0, metformin: 0, aspirin: 0, ace_arb: 0,
  },
]

export const biomarkerRanges: Record<string, { min: number; max: number; unit: string; label: string; step: number }> = {
  age: { min: 18, max: 90, unit: 'years', label: 'Age', step: 1 },
  sbp: { min: 80, max: 220, unit: 'mmHg', label: 'Systolic BP', step: 1 },
  dbp: { min: 40, max: 130, unit: 'mmHg', label: 'Diastolic BP', step: 1 },
  ldl: { min: 30, max: 300, unit: 'mg/dL', label: 'LDL Cholesterol', step: 1 },
  hdl: { min: 15, max: 100, unit: 'mg/dL', label: 'HDL Cholesterol', step: 1 },
  tc: { min: 80, max: 400, unit: 'mg/dL', label: 'Total Cholesterol', step: 1 },
  tg: { min: 30, max: 600, unit: 'mg/dL', label: 'Triglycerides', step: 1 },
  hba1c: { min: 3.5, max: 14, unit: '%', label: 'HbA1c', step: 0.1 },
  fpg: { min: 50, max: 300, unit: 'mg/dL', label: 'Fasting Glucose', step: 1 },
  bmi: { min: 14, max: 55, unit: 'kg/m²', label: 'BMI', step: 0.1 },
  egfr: { min: 10, max: 140, unit: 'mL/min', label: 'eGFR', step: 1 },
  exercise: { min: 0, max: 7, unit: 'days/wk', label: 'Exercise', step: 1 },
}
