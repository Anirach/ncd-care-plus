'use client'

import { useState, useEffect } from 'react'
import { type PatientProfile, computeAllRisksWithCI, type FullRiskResult, getRiskColor, getRiskLevel } from '@/lib/ncd-cie-engine'
import { loadPatients, getActivePatientId } from '@/lib/store'
import { formatPercent, cn } from '@/lib/utils'

export default function ReportPage() {
  const [patient, setPatient] = useState<PatientProfile | null>(null)
  const [risks, setRisks] = useState<FullRiskResult | null>(null)
  const [reportType, setReportType] = useState<'doctor' | 'patient'>('doctor')

  useEffect(() => {
    const pts = loadPatients()
    const id = getActivePatientId()
    const active = pts.find(p => p.id === id) || pts[1]
    setPatient(active)
    setRisks(computeAllRisksWithCI(active))
  }, [])

  if (!patient || !risks) {
    return <div className="animate-pulse h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
  }

  const handlePrint = () => {
    window.print()
  }

  const allRisks = [
    { key: 'cad', label: 'Coronary Artery Disease' },
    { key: 'stroke', label: 'Stroke' },
    { key: 'hf', label: 'Heart Failure' },
    { key: 'pad', label: 'Peripheral Artery Disease' },
    { key: 't2dm', label: 'Type 2 Diabetes' },
    { key: 'ckd', label: 'Chronic Kidney Disease' },
    { key: 'nafld', label: 'Non-Alcoholic Fatty Liver Disease' },
  ] as const

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">📋 Clinical Report</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Generate printable clinical summary</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setReportType('doctor')}
            className={cn('px-3 py-1.5 rounded-lg text-sm', reportType === 'doctor' ? 'btn-primary' : 'btn-secondary')}
          >
            Doctor Version
          </button>
          <button
            onClick={() => setReportType('patient')}
            className={cn('px-3 py-1.5 rounded-lg text-sm', reportType === 'patient' ? 'btn-primary' : 'btn-secondary')}
          >
            Patient Version
          </button>
          <button onClick={handlePrint} className="btn-primary text-sm">
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Printable report */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8 max-w-4xl mx-auto" id="report">
        {/* Header */}
        <div className="border-b-2 border-clinical-600 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-clinical-800 dark:text-clinical-400">NCD-Care+</h1>
              <p className="text-sm text-slate-500">Clinical Decision Support Report</p>
            </div>
            <div className="text-right text-sm text-slate-500">
              <div>Report Date: {new Date().toLocaleDateString()}</div>
              <div>Report Type: {reportType === 'doctor' ? 'Clinician Summary' : 'Patient Summary'}</div>
            </div>
          </div>
        </div>

        {/* Patient info */}
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Patient Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-slate-500">Name:</span> <strong>{patient.name}</strong></div>
            <div><span className="text-slate-500">Age:</span> <strong>{patient.age}</strong></div>
            <div><span className="text-slate-500">Sex:</span> <strong>{patient.sex === 0 ? 'Female' : 'Male'}</strong></div>
            <div><span className="text-slate-500">BMI:</span> <strong>{patient.bmi} kg/m²</strong></div>
          </div>
        </div>

        {/* Risk summary */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Risk Assessment Summary</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-4 rounded-lg border-2" style={{ borderColor: getRiskColor(risks.ncd_composite.value) }}>
              <div className="text-sm text-slate-500">NCD Composite Risk</div>
              <div className="text-3xl font-bold" style={{ color: getRiskColor(risks.ncd_composite.value) }}>
                {formatPercent(risks.ncd_composite.value)}
              </div>
              <div className="text-sm font-medium" style={{ color: getRiskColor(risks.ncd_composite.value) }}>
                {getRiskLevel(risks.ncd_composite.value)}
              </div>
              {reportType === 'doctor' && (
                <div className="text-xs text-slate-400 mt-1">
                  95% CI: {formatPercent(risks.ncd_composite.ci_low)} – {formatPercent(risks.ncd_composite.ci_high)}
                </div>
              )}
            </div>
            <div className="p-4 rounded-lg border-2" style={{ borderColor: getRiskColor(risks.cvd_composite.value) }}>
              <div className="text-sm text-slate-500">CVD Composite Risk</div>
              <div className="text-3xl font-bold" style={{ color: getRiskColor(risks.cvd_composite.value) }}>
                {formatPercent(risks.cvd_composite.value)}
              </div>
              <div className="text-sm font-medium" style={{ color: getRiskColor(risks.cvd_composite.value) }}>
                {getRiskLevel(risks.cvd_composite.value)}
              </div>
            </div>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left py-2 px-3 border border-slate-200 dark:border-slate-700">Disease</th>
                <th className="text-center py-2 px-3 border border-slate-200 dark:border-slate-700">Risk</th>
                <th className="text-center py-2 px-3 border border-slate-200 dark:border-slate-700">Level</th>
                {reportType === 'doctor' && (
                  <th className="text-center py-2 px-3 border border-slate-200 dark:border-slate-700">95% CI</th>
                )}
              </tr>
            </thead>
            <tbody>
              {allRisks.map(d => {
                const risk = risks[d.key]
                return (
                  <tr key={d.key}>
                    <td className="py-2 px-3 border border-slate-200 dark:border-slate-700 font-medium">{d.label}</td>
                    <td className="py-2 px-3 border border-slate-200 dark:border-slate-700 text-center font-bold" style={{ color: getRiskColor(risk.value) }}>
                      {formatPercent(risk.value)}
                    </td>
                    <td className="py-2 px-3 border border-slate-200 dark:border-slate-700 text-center">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-semibold',
                        risk.value < 0.1 ? 'bg-green-100 text-green-800' :
                        risk.value < 0.2 ? 'bg-yellow-100 text-yellow-800' :
                        risk.value < 0.3 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      )}>
                        {getRiskLevel(risk.value)}
                      </span>
                    </td>
                    {reportType === 'doctor' && (
                      <td className="py-2 px-3 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
                        {formatPercent(risk.ci_low)} – {formatPercent(risk.ci_high)}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Lab values */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
            {reportType === 'doctor' ? 'Laboratory Values' : 'Your Health Numbers'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {[
              { label: 'Blood Pressure', value: `${patient.sbp}/${patient.dbp} mmHg`, normal: 'Target < 130/80' },
              { label: 'LDL Cholesterol', value: `${patient.ldl} mg/dL`, normal: 'Target < 100' },
              { label: 'HDL Cholesterol', value: `${patient.hdl} mg/dL`, normal: 'Target > 40' },
              { label: 'Total Cholesterol', value: `${patient.tc} mg/dL`, normal: 'Target < 200' },
              { label: 'Triglycerides', value: `${patient.tg} mg/dL`, normal: 'Target < 150' },
              { label: 'HbA1c', value: `${patient.hba1c}%`, normal: 'Target < 5.7%' },
              { label: 'Fasting Glucose', value: `${patient.fpg} mg/dL`, normal: 'Target < 100' },
              { label: 'eGFR', value: `${patient.egfr} mL/min`, normal: 'Target > 90' },
              { label: 'BMI', value: `${patient.bmi} kg/m²`, normal: 'Target 18.5-25' },
            ].map(lab => (
              <div key={lab.label} className="p-3 rounded border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500">{lab.label}</div>
                <div className="font-bold text-slate-800 dark:text-slate-200">{lab.value}</div>
                <div className="text-[10px] text-slate-400">{lab.normal}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
            {reportType === 'doctor' ? 'Clinical Recommendations' : 'Your Action Plan'}
          </h2>
          <div className="space-y-2 text-sm">
            {patient.sbp >= 140 && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border-l-4 border-red-500">
                <strong>Blood Pressure Control:</strong> {reportType === 'doctor'
                  ? 'Consider initiating/optimizing antihypertensive therapy. Target SBP < 130 mmHg per AHA/ACC guidelines.'
                  : 'Your blood pressure is high. Talk to your doctor about medication and try to reduce salt intake.'}
              </div>
            )}
            {patient.ldl >= 130 && (
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border-l-4 border-yellow-500">
                <strong>Lipid Management:</strong> {reportType === 'doctor'
                  ? 'LDL-C above optimal range. Consider statin therapy based on ASCVD risk calculation.'
                  : 'Your cholesterol could be lower. A healthy diet and possibly medication can help.'}
              </div>
            )}
            {patient.hba1c >= 5.7 && (
              <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border-l-4 border-orange-500">
                <strong>Glycemic Control:</strong> {reportType === 'doctor'
                  ? `HbA1c ${patient.hba1c}% indicates ${patient.hba1c >= 6.5 ? 'diabetes' : 'prediabetes'}. Consider lifestyle intervention ± metformin.`
                  : `Your blood sugar is ${patient.hba1c >= 6.5 ? 'high' : 'borderline'}. Exercise and diet changes can make a big difference.`}
              </div>
            )}
            {patient.exercise < 3 && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500">
                <strong>Physical Activity:</strong> {reportType === 'doctor'
                  ? 'Recommend ≥150 min/week moderate aerobic activity per WHO guidelines.'
                  : 'Try to exercise at least 5 days a week. Even a 30-minute walk helps!'}
              </div>
            )}
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border-l-4 border-green-500">
              <strong>Follow-up:</strong> {reportType === 'doctor'
                ? 'Schedule follow-up in 3-6 months for repeat labs and risk reassessment.'
                : 'Come back for a check-up in 3-6 months to see how you\'re doing.'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 text-xs text-slate-400">
          <p>Generated by NCD-Care+ Clinical Decision Support System based on NCD-CIE causal knowledge graph.</p>
          <p className="mt-1">⚠️ This report is for informational purposes and should be interpreted by a qualified healthcare professional.</p>
          <p className="mt-1">Model: NCD-CIE v16 | 107 causal edges | Validated AUC-ROC: 0.721 (D&apos;Agostino) | NHANES concordance: r=0.91</p>
        </div>
      </div>
    </div>
  )
}
