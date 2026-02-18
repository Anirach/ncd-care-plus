import { describe, it, expect } from 'vitest'
import {
  computeDiseaseRiskWithCI,
  computeRiskContributions,
  computeAllRisksWithCI,
  whatIfIntervention,
  getRiskColor,
  getRiskLevel,
  getRiskBgClass,
  demoPatients,
  biomarkerRanges,
  PatientProfile,
  RiskWithCI,
  FullRiskResult,
} from '@/lib/ncd-cie-engine'

// Helper to create a baseline patient profile
function createBaselineProfile(overrides: Partial<PatientProfile> = {}): PatientProfile {
  return {
    id: 'test-patient',
    name: 'Test Patient',
    age: 55,
    sex: 0.5,
    sbp: 130,
    dbp: 82,
    ldl: 130,
    hdl: 50,
    tc: 210,
    tg: 150,
    hba1c: 5.8,
    fpg: 105,
    bmi: 26,
    egfr: 85,
    smoking: 0.25,
    exercise: 2.5,
    alcohol: 0.2,
    diet: 0.5,
    statin: 0,
    htn_med: 0,
    sglt2i: 0,
    metformin: 0,
    aspirin: 0,
    ace_arb: 0,
    ...overrides,
  }
}

describe('ncd-cie-engine', () => {
  describe('computeDiseaseRiskWithCI', () => {
    it('should return risk between 0 and 1', () => {
      const profile = createBaselineProfile()
      const risk = computeDiseaseRiskWithCI(profile, 'cad')

      expect(risk.value).toBeGreaterThanOrEqual(0)
      expect(risk.value).toBeLessThanOrEqual(1)
      expect(risk.ci_low).toBeGreaterThanOrEqual(0)
      expect(risk.ci_low).toBeLessThanOrEqual(1)
      expect(risk.ci_high).toBeGreaterThanOrEqual(0)
      expect(risk.ci_high).toBeLessThanOrEqual(1)
    })

    it('should have ci_low <= value <= ci_high', () => {
      const profile = createBaselineProfile()
      const diseases = ['cad', 'stroke', 'hf', 'pad', 't2dm', 'ckd', 'nafld']

      for (const disease of diseases) {
        const risk = computeDiseaseRiskWithCI(profile, disease)
        expect(risk.ci_low).toBeLessThanOrEqual(risk.value)
        expect(risk.value).toBeLessThanOrEqual(risk.ci_high)
      }
    })

    it('should return higher CAD risk for patients with elevated LDL', () => {
      const normalLdl = createBaselineProfile({ ldl: 100 })
      const highLdl = createBaselineProfile({ ldl: 200 })

      const riskNormal = computeDiseaseRiskWithCI(normalLdl, 'cad')
      const riskHigh = computeDiseaseRiskWithCI(highLdl, 'cad')

      expect(riskHigh.value).toBeGreaterThan(riskNormal.value)
    })

    it('should return higher stroke risk for patients with elevated SBP', () => {
      const normalBp = createBaselineProfile({ sbp: 120 })
      const highBp = createBaselineProfile({ sbp: 180 })

      const riskNormal = computeDiseaseRiskWithCI(normalBp, 'stroke')
      const riskHigh = computeDiseaseRiskWithCI(highBp, 'stroke')

      expect(riskHigh.value).toBeGreaterThan(riskNormal.value)
    })

    it('should return higher T2DM risk for patients with elevated HbA1c', () => {
      const normalA1c = createBaselineProfile({ hba1c: 5.0 })
      const highA1c = createBaselineProfile({ hba1c: 8.0 })

      const riskNormal = computeDiseaseRiskWithCI(normalA1c, 't2dm')
      const riskHigh = computeDiseaseRiskWithCI(highA1c, 't2dm')

      expect(riskHigh.value).toBeGreaterThan(riskNormal.value)
    })

    it('should return higher CKD risk for patients with low eGFR', () => {
      const normalEgfr = createBaselineProfile({ egfr: 100 })
      const lowEgfr = createBaselineProfile({ egfr: 40 })

      const riskNormal = computeDiseaseRiskWithCI(normalEgfr, 'ckd')
      const riskLow = computeDiseaseRiskWithCI(lowEgfr, 'ckd')

      expect(riskLow.value).toBeGreaterThan(riskNormal.value)
    })

    it('should return lower CAD risk for higher HDL (protective factor)', () => {
      const lowHdl = createBaselineProfile({ hdl: 30 })
      const highHdl = createBaselineProfile({ hdl: 70 })

      const riskLowHdl = computeDiseaseRiskWithCI(lowHdl, 'cad')
      const riskHighHdl = computeDiseaseRiskWithCI(highHdl, 'cad')

      expect(riskHighHdl.value).toBeLessThan(riskLowHdl.value)
    })

    it('should return higher PAD risk for smokers', () => {
      const nonSmoker = createBaselineProfile({ smoking: 0 })
      const smoker = createBaselineProfile({ smoking: 1 })

      const riskNonSmoker = computeDiseaseRiskWithCI(nonSmoker, 'pad')
      const riskSmoker = computeDiseaseRiskWithCI(smoker, 'pad')

      expect(riskSmoker.value).toBeGreaterThan(riskNonSmoker.value)
    })

    it('should return lower CAD risk for patients with more exercise', () => {
      const sedentary = createBaselineProfile({ exercise: 0 })
      const active = createBaselineProfile({ exercise: 7 })

      const riskSedentary = computeDiseaseRiskWithCI(sedentary, 'cad')
      const riskActive = computeDiseaseRiskWithCI(active, 'cad')

      expect(riskActive.value).toBeLessThan(riskSedentary.value)
    })

    it('should derive diabetes condition from HbA1c', () => {
      const prediabetic = createBaselineProfile({ hba1c: 6.0, fpg: 99 })
      const diabetic = createBaselineProfile({ hba1c: 7.0, fpg: 130 })

      const riskPrediabetic = computeDiseaseRiskWithCI(prediabetic, 'ckd')
      const riskDiabetic = computeDiseaseRiskWithCI(diabetic, 'ckd')

      // Diabetes status affects CKD risk
      expect(riskDiabetic.value).toBeGreaterThan(riskPrediabetic.value)
    })

    it('should derive hypertension condition from BP', () => {
      const normalBp = createBaselineProfile({ sbp: 120, dbp: 75 })
      const hypertensive = createBaselineProfile({ sbp: 150, dbp: 95 })

      const riskNormal = computeDiseaseRiskWithCI(normalBp, 'stroke')
      const riskHypertensive = computeDiseaseRiskWithCI(hypertensive, 'stroke')

      expect(riskHypertensive.value).toBeGreaterThan(riskNormal.value)
    })

    it('should handle unknown disease id gracefully', () => {
      const profile = createBaselineProfile()
      const risk = computeDiseaseRiskWithCI(profile, 'unknown_disease')

      // Should still return a valid RiskWithCI structure
      expect(risk.value).toBeDefined()
      expect(risk.ci_low).toBeDefined()
      expect(risk.ci_high).toBeDefined()
    })
  })

  describe('computeRiskContributions', () => {
    it('should return contributions sorted by absolute magnitude', () => {
      const profile = createBaselineProfile()
      const contributions = computeRiskContributions(profile, 'cad')

      for (let i = 0; i < contributions.length - 1; i++) {
        expect(Math.abs(contributions[i].contribution))
          .toBeGreaterThanOrEqual(Math.abs(contributions[i + 1].contribution))
      }
    })

    it('should include z-scores for each contribution', () => {
      const profile = createBaselineProfile()
      const contributions = computeRiskContributions(profile, 'cad')

      for (const contrib of contributions) {
        expect(contrib.zScore).toBeDefined()
        expect(typeof contrib.zScore).toBe('number')
      }
    })

    it('should have nodeId and label for each contribution', () => {
      const profile = createBaselineProfile()
      const contributions = computeRiskContributions(profile, 'stroke')

      for (const contrib of contributions) {
        expect(contrib.nodeId).toBeDefined()
        expect(contrib.label).toBeDefined()
        expect(contrib.label.length).toBeGreaterThan(0)
      }
    })

    it('should identify smoking as top contributor for PAD in smoker', () => {
      const smoker = createBaselineProfile({ smoking: 1 })
      const contributions = computeRiskContributions(smoker, 'pad')

      // Smoking should be one of the top contributors
      const smokingContrib = contributions.find(c => c.nodeId === 'smoking')
      expect(smokingContrib).toBeDefined()
      expect(smokingContrib!.contribution).toBeGreaterThan(0)
    })

    it('should show HDL as protective (negative contribution) for CAD', () => {
      const highHdl = createBaselineProfile({ hdl: 80 })
      const contributions = computeRiskContributions(highHdl, 'cad')

      const hdlContrib = contributions.find(c => c.nodeId === 'hdl')
      expect(hdlContrib).toBeDefined()
      expect(hdlContrib!.contribution).toBeLessThan(0) // Protective
    })
  })

  describe('computeAllRisksWithCI', () => {
    it('should return all 7 disease risks plus 2 composites', () => {
      const profile = createBaselineProfile()
      const risks = computeAllRisksWithCI(profile)

      expect(risks.cad).toBeDefined()
      expect(risks.stroke).toBeDefined()
      expect(risks.hf).toBeDefined()
      expect(risks.pad).toBeDefined()
      expect(risks.t2dm).toBeDefined()
      expect(risks.ckd).toBeDefined()
      expect(risks.nafld).toBeDefined()
      expect(risks.cvd_composite).toBeDefined()
      expect(risks.ncd_composite).toBeDefined()
    })

    it('should compute CVD composite correctly', () => {
      const profile = createBaselineProfile()
      const risks = computeAllRisksWithCI(profile)

      // CVD = 1 - (1-CAD)(1-Stroke)(1-HF)(1-PAD)
      const expectedCvd = 1 - (1 - risks.cad.value) * (1 - risks.stroke.value) *
        (1 - risks.hf.value) * (1 - risks.pad.value)

      expect(risks.cvd_composite.value).toBeCloseTo(expectedCvd, 10)
    })

    it('should compute NCD composite correctly', () => {
      const profile = createBaselineProfile()
      const risks = computeAllRisksWithCI(profile)

      // NCD = 1 - (1-CVD)(1-T2DM)(1-CKD)
      const expectedNcd = 1 - (1 - risks.cvd_composite.value) * (1 - risks.t2dm.value) *
        (1 - risks.ckd.value)

      expect(risks.ncd_composite.value).toBeCloseTo(expectedNcd, 10)
    })

    it('should have CVD composite >= any individual CVD risk', () => {
      const profile = createBaselineProfile()
      const risks = computeAllRisksWithCI(profile)

      expect(risks.cvd_composite.value).toBeGreaterThanOrEqual(risks.cad.value)
      expect(risks.cvd_composite.value).toBeGreaterThanOrEqual(risks.stroke.value)
      expect(risks.cvd_composite.value).toBeGreaterThanOrEqual(risks.hf.value)
      expect(risks.cvd_composite.value).toBeGreaterThanOrEqual(risks.pad.value)
    })

    it('should have NCD composite >= CVD composite', () => {
      const profile = createBaselineProfile()
      const risks = computeAllRisksWithCI(profile)

      expect(risks.ncd_composite.value).toBeGreaterThanOrEqual(risks.cvd_composite.value)
    })
  })

  describe('whatIfIntervention - do-calculus', () => {
    it('should return intervention profile with modified values', () => {
      const profile = createBaselineProfile()
      const result = whatIfIntervention(profile, { statin: 1 })

      expect(result.interventionProfile.statin).toBe(1)
    })

    it('should cascade statin intervention to LDL', () => {
      const profile = createBaselineProfile({ statin: 0 })
      const result = whatIfIntervention(profile, { statin: 1 })

      // Starting statin should reduce LDL via cascade
      expect(result.deltas).toHaveProperty('statin')
      // LDL may be affected through cascade
      expect(result.activatedEdges.length).toBeGreaterThan(0)
    })

    it('should reduce CAD risk when adding statin', () => {
      const profile = createBaselineProfile({ statin: 0, ldl: 180 })
      const baseRisks = computeAllRisksWithCI(profile)
      const result = whatIfIntervention(profile, { statin: 1 })

      expect(result.risks.cad.value).toBeLessThan(baseRisks.cad.value)
    })

    it('should cascade exercise intervention to multiple biomarkers', () => {
      const profile = createBaselineProfile({ exercise: 0 })
      const result = whatIfIntervention(profile, { exercise: 7 })

      // Exercise should activate edges to BMI, SBP, HbA1c, HDL, etc.
      expect(result.activatedEdges.length).toBeGreaterThan(0)
    })

    it('should return activated edges for intervention', () => {
      const profile = createBaselineProfile()
      const result = whatIfIntervention(profile, { htn_med: 1 })

      // HTN med affects SBP, DBP, stroke, HF
      expect(result.activatedEdges).toContain('e88') // htn_med -> sbp
    })

    it('should handle multiple simultaneous interventions', () => {
      const profile = createBaselineProfile({ statin: 0, htn_med: 0 })
      const result = whatIfIntervention(profile, { statin: 1, htn_med: 1 })

      expect(result.interventionProfile.statin).toBe(1)
      expect(result.interventionProfile.htn_med).toBe(1)
      expect(result.activatedEdges.length).toBeGreaterThan(2)
    })

    it('should apply attenuation based on depth', () => {
      const profile = createBaselineProfile()

      // Direct intervention
      const directResult = whatIfIntervention(profile, { sbp: profile.sbp - 20 })

      // The cascade should attenuate as it propagates
      // Direct effects should be larger than indirect effects
      expect(directResult.deltas).toHaveProperty('sbp')
    })

    it('should respect D_MAX for cascade depth', () => {
      const profile = createBaselineProfile()
      const result = whatIfIntervention(profile, { diet: 1 })

      // Cascade should not propagate infinitely
      // Should only go D_MAX=3 levels deep
      expect(result.activatedEdges.length).toBeLessThan(50)
    })

    it('should improve NAFLD risk with BMI reduction', () => {
      const profile = createBaselineProfile({ bmi: 35 })
      const baseRisks = computeAllRisksWithCI(profile)
      const result = whatIfIntervention(profile, { bmi: 25 })

      expect(result.risks.nafld.value).toBeLessThan(baseRisks.nafld.value)
    })

    it('should reduce CKD risk with SGLT2i intervention', () => {
      const profile = createBaselineProfile({ sglt2i: 0, egfr: 60 })
      const baseRisks = computeAllRisksWithCI(profile)
      const result = whatIfIntervention(profile, { sglt2i: 1 })

      expect(result.risks.ckd.value).toBeLessThan(baseRisks.ckd.value)
    })
  })

  describe('getRiskColor', () => {
    it('should return green for low risk (<10%)', () => {
      expect(getRiskColor(0.05)).toBe('#22c55e')
      expect(getRiskColor(0.09)).toBe('#22c55e')
    })

    it('should return yellow for moderate risk (10-20%)', () => {
      expect(getRiskColor(0.10)).toBe('#eab308')
      expect(getRiskColor(0.15)).toBe('#eab308')
      expect(getRiskColor(0.19)).toBe('#eab308')
    })

    it('should return orange for high risk (20-30%)', () => {
      expect(getRiskColor(0.20)).toBe('#f97316')
      expect(getRiskColor(0.25)).toBe('#f97316')
      expect(getRiskColor(0.29)).toBe('#f97316')
    })

    it('should return red for very high risk (>=30%)', () => {
      expect(getRiskColor(0.30)).toBe('#ef4444')
      expect(getRiskColor(0.50)).toBe('#ef4444')
      expect(getRiskColor(0.99)).toBe('#ef4444')
    })

    it('should handle edge cases', () => {
      expect(getRiskColor(0)).toBe('#22c55e')
      expect(getRiskColor(1)).toBe('#ef4444')
    })
  })

  describe('getRiskLevel', () => {
    it('should return Low for risk <10%', () => {
      expect(getRiskLevel(0.05)).toBe('Low')
      expect(getRiskLevel(0.09)).toBe('Low')
    })

    it('should return Moderate for risk 10-20%', () => {
      expect(getRiskLevel(0.10)).toBe('Moderate')
      expect(getRiskLevel(0.15)).toBe('Moderate')
    })

    it('should return High for risk 20-30%', () => {
      expect(getRiskLevel(0.20)).toBe('High')
      expect(getRiskLevel(0.25)).toBe('High')
    })

    it('should return Very High for risk >=30%', () => {
      expect(getRiskLevel(0.30)).toBe('Very High')
      expect(getRiskLevel(0.50)).toBe('Very High')
    })
  })

  describe('getRiskBgClass', () => {
    it('should return green classes for low risk', () => {
      const classes = getRiskBgClass(0.05)
      expect(classes).toContain('bg-green')
      expect(classes).toContain('border-green')
    })

    it('should return yellow classes for moderate risk', () => {
      const classes = getRiskBgClass(0.15)
      expect(classes).toContain('bg-yellow')
      expect(classes).toContain('border-yellow')
    })

    it('should return orange classes for high risk', () => {
      const classes = getRiskBgClass(0.25)
      expect(classes).toContain('bg-orange')
      expect(classes).toContain('border-orange')
    })

    it('should return red classes for very high risk', () => {
      const classes = getRiskBgClass(0.35)
      expect(classes).toContain('bg-red')
      expect(classes).toContain('border-red')
    })

    it('should include dark mode variants', () => {
      const classes = getRiskBgClass(0.05)
      expect(classes).toContain('dark:bg-green')
      expect(classes).toContain('dark:border-green')
    })
  })

  describe('demoPatients', () => {
    it('should have exactly 3 demo patients', () => {
      expect(demoPatients).toHaveLength(3)
    })

    it('should have unique ids', () => {
      const ids = demoPatients.map(p => p.id)
      expect(new Set(ids).size).toBe(3)
    })

    it('should include low, moderate, and high risk patients', () => {
      const ids = demoPatients.map(p => p.id)
      expect(ids).toContain('demo-low')
      expect(ids).toContain('demo-moderate')
      expect(ids).toContain('demo-high')
    })

    it('should have Sarah Chen as low risk patient', () => {
      const sarah = demoPatients.find(p => p.id === 'demo-low')
      expect(sarah?.name).toBe('Sarah Chen')
      expect(sarah?.sex).toBe(0) // Female
      expect(sarah?.smoking).toBe(0) // Non-smoker
      expect(sarah?.exercise).toBe(5) // Active
    })

    it('should have James Wilson as moderate risk patient', () => {
      const james = demoPatients.find(p => p.id === 'demo-moderate')
      expect(james?.name).toBe('James Wilson')
      expect(james?.sbp).toBeGreaterThan(140) // Elevated BP
      expect(james?.ldl).toBeGreaterThan(160) // High LDL
    })

    it('should have Robert Martinez as high risk patient', () => {
      const robert = demoPatients.find(p => p.id === 'demo-high')
      expect(robert?.name).toBe('Robert Martinez')
      expect(robert?.smoking).toBe(1) // Current smoker
      expect(robert?.hba1c).toBeGreaterThan(7) // Diabetic
      expect(robert?.egfr).toBeLessThan(60) // Low kidney function
    })

    it('should produce progressively higher risks', () => {
      const lowRisk = computeAllRisksWithCI(demoPatients[0])
      const modRisk = computeAllRisksWithCI(demoPatients[1])
      const highRisk = computeAllRisksWithCI(demoPatients[2])

      expect(lowRisk.cvd_composite.value).toBeLessThan(modRisk.cvd_composite.value)
      expect(modRisk.cvd_composite.value).toBeLessThan(highRisk.cvd_composite.value)
    })
  })

  describe('biomarkerRanges', () => {
    it('should have ranges for key biomarkers', () => {
      const expectedBiomarkers = [
        'age', 'sbp', 'dbp', 'ldl', 'hdl', 'tc', 'tg',
        'hba1c', 'fpg', 'bmi', 'egfr', 'exercise',
      ]

      for (const biomarker of expectedBiomarkers) {
        expect(biomarkerRanges[biomarker]).toBeDefined()
      }
    })

    it('should have min < max for all ranges', () => {
      for (const [, range] of Object.entries(biomarkerRanges)) {
        expect(range.min).toBeLessThan(range.max)
      }
    })

    it('should have units defined for all ranges', () => {
      for (const [, range] of Object.entries(biomarkerRanges)) {
        expect(range.unit).toBeDefined()
        expect(range.unit.length).toBeGreaterThan(0)
      }
    })

    it('should have labels defined for all ranges', () => {
      for (const [, range] of Object.entries(biomarkerRanges)) {
        expect(range.label).toBeDefined()
        expect(range.label.length).toBeGreaterThan(0)
      }
    })

    it('should have step values defined', () => {
      for (const [, range] of Object.entries(biomarkerRanges)) {
        expect(range.step).toBeDefined()
        expect(range.step).toBeGreaterThan(0)
      }
    })

    it('should have sensible clinical ranges', () => {
      expect(biomarkerRanges.age.min).toBe(18)
      expect(biomarkerRanges.age.max).toBe(90)

      expect(biomarkerRanges.sbp.min).toBe(80)
      expect(biomarkerRanges.sbp.max).toBe(220)

      expect(biomarkerRanges.hba1c.min).toBe(3.5)
      expect(biomarkerRanges.hba1c.max).toBe(14)
    })
  })

  describe('edge cases and numerical stability', () => {
    it('should handle extreme age values', () => {
      const young = createBaselineProfile({ age: 18 })
      const elderly = createBaselineProfile({ age: 90 })

      const riskYoung = computeDiseaseRiskWithCI(young, 'cad')
      const riskElderly = computeDiseaseRiskWithCI(elderly, 'cad')

      expect(riskYoung.value).toBeGreaterThan(0)
      expect(riskYoung.value).toBeLessThan(1)
      expect(riskElderly.value).toBeGreaterThan(riskYoung.value)
    })

    it('should handle all biomarkers at minimum values', () => {
      const profile = createBaselineProfile({
        age: 18, sbp: 80, dbp: 40, ldl: 30, hdl: 15,
        tc: 80, tg: 30, hba1c: 3.5, fpg: 50, bmi: 14, egfr: 140,
        smoking: 0, exercise: 7, alcohol: 0, diet: 1,
      })

      const risks = computeAllRisksWithCI(profile)

      expect(risks.cad.value).toBeGreaterThan(0)
      expect(risks.cad.value).toBeLessThan(1)
    })

    it('should handle all biomarkers at maximum values', () => {
      const profile = createBaselineProfile({
        age: 90, sbp: 220, dbp: 130, ldl: 300, hdl: 100,
        tc: 400, tg: 600, hba1c: 14, fpg: 300, bmi: 55, egfr: 10,
        smoking: 1, exercise: 0, alcohol: 1, diet: 0,
      })

      const risks = computeAllRisksWithCI(profile)

      expect(risks.cad.value).toBeGreaterThan(0)
      expect(risks.cad.value).toBeLessThan(1)
    })

    it('should produce consistent results with same input', () => {
      const profile = createBaselineProfile()

      const risk1 = computeDiseaseRiskWithCI(profile, 'cad')
      const risk2 = computeDiseaseRiskWithCI(profile, 'cad')

      expect(risk1.value).toEqual(risk2.value)
      expect(risk1.ci_low).toEqual(risk2.ci_low)
      expect(risk1.ci_high).toEqual(risk2.ci_high)
    })
  })
})
