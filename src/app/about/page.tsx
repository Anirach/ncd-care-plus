'use client'

import { cn } from '@/lib/utils'

export default function AboutPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">📖 About NCD-CIE & Evidence</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Methodology, validation, and scientific foundation
        </p>
      </div>

      {/* Overview */}
      <div className="card-clinical">
        <h2 className="text-lg font-semibold text-clinical-700 dark:text-clinical-400 mb-3">What is NCD-CIE?</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
          <strong>NCD-CIE (Non-Communicable Disease Causal Inference Engine)</strong> is a causal knowledge graph-based
          clinical decision support system for predicting and preventing non-communicable diseases. It combines
          evidence from epidemiological studies, randomized controlled trials, and observational data into a unified
          causal model with 107 weighted edges connecting 51 clinical variables across 8 domains.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Unlike traditional risk scores (Framingham, QRISK3, SCORE2), NCD-CIE models <strong>causal pathways</strong> between
          risk factors and disease endpoints, enabling what-if intervention simulation using Pearl&apos;s do-calculus framework.
        </p>
      </div>

      {/* Pearl's Causation Ladder */}
      <div className="card-clinical">
        <h2 className="text-lg font-semibold text-clinical-700 dark:text-clinical-400 mb-4">Pearl&apos;s Ladder of Causation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              level: 'Level 1: Association',
              icon: '👁️',
              query: 'P(disease | risk factor)',
              example: 'Patients with high LDL have more heart attacks',
              tools: 'Traditional risk scores',
              color: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
            },
            {
              level: 'Level 2: Intervention',
              icon: '🔬',
              query: 'P(disease | do(intervention))',
              example: 'If we prescribe statins, will heart attack risk decrease?',
              tools: 'NCD-CIE What-If Simulator',
              color: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800',
            },
            {
              level: 'Level 3: Counterfactual',
              icon: '🤔',
              query: 'P(disease_y₀ | do(x₁), observe(y₁))',
              example: 'Would the patient have had a heart attack if they had taken statins?',
              tools: 'Future research direction',
              color: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800',
            },
          ].map((rung) => (
            <div key={rung.level} className={cn('p-4 rounded-lg border', rung.color)}>
              <div className="text-2xl mb-2">{rung.icon}</div>
              <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-1">{rung.level}</h3>
              <div className="font-mono text-xs text-slate-500 mb-2">{rung.query}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{rung.example}</p>
              <div className="text-[10px] text-clinical-600 dark:text-clinical-400 font-medium">{rung.tools}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Methodology */}
      <div className="card-clinical">
        <h2 className="text-lg font-semibold text-clinical-700 dark:text-clinical-400 mb-3">Methodology</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">Risk Scoring (Logistic-Link)</h3>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg font-mono text-xs mt-1">
              R<sub>d</sub> = σ(β₀<sub>d</sub> + Σ w<sub>i</sub> · z<sub>i</sub>)
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Where σ is the logistic sigmoid, z<sub>i</sub> are z-score standardized biomarkers,
              and w<sub>i</sub> are causal edge weights (log-odds ratios).
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">What-If Cascade (do-calculus approximation)</h3>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg font-mono text-xs mt-1">
              δ<sub>k</sub> = Σ W<sub>(v<sub>p</sub>,v<sub>k</sub>)</sub> · (x<sub>p</sub><sup>INT</sup> − x<sub>p</sub>) · γ<sup>depth</sup>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Topological propagation with γ=0.7 attenuation factor, maximum depth d<sub>max</sub>=3.
              This ensures effects diminish along longer causal chains while maintaining biological plausibility.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">Composite NCD Risk</h3>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg font-mono text-xs mt-1">
              R<sub>NCD</sub> = 1 − (1−R<sub>CVD</sub>)(1−R<sub>T2DM</sub>)(1−R<sub>CKD</sub>)
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Grades */}
      <div className="card-clinical">
        <h2 className="text-lg font-semibold text-clinical-700 dark:text-clinical-400 mb-3">Evidence Grade System</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { grade: 'A', label: 'Strong', desc: 'Multiple RCTs, meta-analyses, or Mendelian randomization studies', count: 58, color: 'badge-grade-a' },
            { grade: 'B', label: 'Moderate', desc: 'At least one RCT, large prospective cohorts', count: 42, color: 'badge-grade-b' },
            { grade: 'C', label: 'Limited', desc: 'Observational studies, cross-sectional, biological plausibility', count: 5, color: 'badge-grade-c' },
            { grade: 'D', label: 'Emerging', desc: 'Expert consensus, preliminary findings', count: 2, color: 'badge-grade-d' },
          ].map(g => (
            <div key={g.grade} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <span className={g.color}>Grade {g.grade}</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{g.label}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{g.desc}</p>
              <div className="text-xs text-slate-400">{g.count} edges</div>
            </div>
          ))}
        </div>
      </div>

      {/* Validation */}
      <div className="card-clinical">
        <h2 className="text-lg font-semibold text-clinical-700 dark:text-clinical-400 mb-3">Validation Results</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { metric: 'AUC-ROC (SCORE2)', value: '0.704', good: true },
            { metric: 'AUC-ROC (D\'Agostino)', value: '0.721', good: true },
            { metric: 'Calibration Slope', value: '0.91', good: true },
            { metric: 'Brier Score', value: '0.118', good: true },
            { metric: 'NHANES Concordance', value: 'r = 0.91', good: true },
            { metric: 'RCT Alignments', value: '6/6', good: true },
            { metric: 'Nodes', value: '51', good: true },
            { metric: 'Causal Edges', value: '107', good: true },
          ].map(v => (
            <div key={v.metric} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
              <div className="text-xs text-slate-500 mb-1">{v.metric}</div>
              <div className="text-xl font-bold text-clinical-700 dark:text-clinical-400">{v.value}</div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Comparison with Existing Risk Scores</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left py-2 px-3 border border-slate-200 dark:border-slate-700">Feature</th>
                <th className="text-center py-2 px-3 border border-slate-200 dark:border-slate-700">NCD-CIE</th>
                <th className="text-center py-2 px-3 border border-slate-200 dark:border-slate-700">Framingham</th>
                <th className="text-center py-2 px-3 border border-slate-200 dark:border-slate-700">QRISK3</th>
                <th className="text-center py-2 px-3 border border-slate-200 dark:border-slate-700">SCORE2</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Disease Coverage', ncd: 'CVD+T2DM+CKD+NAFLD', fram: 'CVD only', qrisk: 'CVD only', score: 'CVD only' },
                { feature: 'Causal Modeling', ncd: '✅ Full DAG', fram: '❌ Regression', qrisk: '❌ Regression', score: '❌ Regression' },
                { feature: 'What-If Simulation', ncd: '✅ do-calculus', fram: '❌', qrisk: '❌', score: '❌' },
                { feature: 'Medication Effects', ncd: '✅ 6 drug classes', fram: '❌', qrisk: 'Partial', score: '❌' },
                { feature: 'Variables', ncd: '51', fram: '8', qrisk: '21', score: '6' },
                { feature: 'Evidence Grading', ncd: '✅ A-D grades', fram: '❌', qrisk: '❌', score: '❌' },
                { feature: 'Uncertainty', ncd: '✅ 95% CI', fram: '❌', qrisk: 'Partial', score: '❌' },
              ].map(row => (
                <tr key={row.feature}>
                  <td className="py-2 px-3 border border-slate-200 dark:border-slate-700 font-medium">{row.feature}</td>
                  <td className="py-2 px-3 border border-slate-200 dark:border-slate-700 text-center text-clinical-700 dark:text-clinical-400 font-semibold">{row.ncd}</td>
                  <td className="py-2 px-3 border border-slate-200 dark:border-slate-700 text-center text-slate-500">{row.fram}</td>
                  <td className="py-2 px-3 border border-slate-200 dark:border-slate-700 text-center text-slate-500">{row.qrisk}</td>
                  <td className="py-2 px-3 border border-slate-200 dark:border-slate-700 text-center text-slate-500">{row.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RCT Alignments */}
      <div className="card-clinical">
        <h2 className="text-lg font-semibold text-clinical-700 dark:text-clinical-400 mb-3">Landmark RCT Validation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { trial: '4S Trial', intervention: 'Statin → LDL↓ → CVD↓', result: 'Aligned ✅' },
            { trial: 'UKPDS', intervention: 'HbA1c control → T2DM complications↓', result: 'Aligned ✅' },
            { trial: 'SPRINT', intervention: 'Intensive BP → CVD↓', result: 'Aligned ✅' },
            { trial: 'EMPA-REG', intervention: 'SGLT2i → HF↓, CKD↓', result: 'Aligned ✅' },
            { trial: 'DPP', intervention: 'Lifestyle → T2DM↓', result: 'Aligned ✅' },
            { trial: 'HOPE', intervention: 'ACEi → CVD↓, CKD↓', result: 'Aligned ✅' },
          ].map(t => (
            <div key={t.trial} className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <div className="font-semibold text-sm text-green-800 dark:text-green-200">{t.trial}</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">{t.intervention}</div>
              <div className="text-xs font-semibold text-green-700 dark:text-green-300 mt-1">{t.result}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="card-clinical bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">⚠️ Clinical Disclaimer</h2>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          NCD-Care+ is a clinical decision <strong>support</strong> tool and does not replace clinical judgment.
          Risk predictions are based on population-level data and may not accurately reflect individual risk.
          All clinical decisions should be made in consultation with a qualified healthcare professional.
          The NCD-CIE model is validated for research purposes; clinical deployment requires institutional review.
        </p>
      </div>
    </div>
  )
}
