# NCD-Care+ — Hospital-Grade Clinical Decision Support Platform

🏥 **Production-quality clinical decision support** for NCD prevention, prediction, and monitoring.

Based on the **NCD-CIE v16** research paper — a causal knowledge graph with 107 edges, 51 nodes, and 8 clinical domains.

## 🌟 Features

### 📊 Dashboard
- Risk gauges for all 7 disease endpoints (CVD, T2DM, CKD, NAFLD)
- Traffic-light system (green/yellow/red)
- Key vitals summary with status indicators
- Alert panel for high-risk values

### 👤 Patient Profile & Lab Input
- Complete lab entry organized by 8 clinical domains
- Medication toggles
- 3 built-in demo patients (low/moderate/high risk)
- Save/load patient data (localStorage)

### ⚠️ Risk Assessment
- Detailed risk breakdown per disease with 95% CIs
- Risk factor contribution charts (which factors drive risk most)
- Risk category explanation (low/moderate/high/very high)

### 🔬 What-If Simulator
- Interactive sliders for every modifiable risk factor
- Real-time cascading risk recalculation (Pearl's do-calculus, γ=0.7)
- Side-by-side comparison (current vs simulated)
- Activated causal pathway visualization
- 6 preset intervention scenarios

### 🧠 Knowledge Graph Explorer
- Interactive force-directed graph (Canvas-based)
- Color-coded by clinical domain
- Filter by domain, evidence grade
- Click nodes/edges for detailed information
- Shows weight, CI, evidence grade, Bradford Hill score

### 📈 Progress Tracker
- Multi-visit timeline
- Biomarker goal tracking
- Risk trend monitoring
- Milestone achievements

### 📋 Clinical Report Generator
- Doctor and patient versions
- Print-friendly layout
- Lab values, risk summary, recommendations
- NCD-CIE model validation stats

### 📖 About & Evidence
- Full NCD-CIE methodology explanation
- Pearl's causation ladder visualization
- Evidence grade system (A-D)
- Validation results (AUC-ROC, calibration, NHANES concordance)
- Comparison table (vs Framingham, QRISK3, SCORE2)
- 6 landmark RCT alignments

## 🛠️ Tech Stack

- **Next.js 14** (App Router, Static Export)
- **TypeScript** (strict mode)
- **Tailwind CSS** (custom clinical theme)
- **Canvas API** for knowledge graph visualization
- **Client-side computation** (no backend required)
- **Dark mode** support
- **Mobile responsive** (tablet-optimized)
- **Print-friendly** pages

## 🏗️ Project Structure

```
ncd-care-plus/
├── src/
│   ├── app/
│   │   ├── page.tsx            # Dashboard
│   │   ├── profile/page.tsx    # Patient Profile
│   │   ├── risk/page.tsx       # Risk Assessment
│   │   ├── what-if/page.tsx    # What-If Simulator
│   │   ├── knowledge-graph/page.tsx  # KG Explorer
│   │   ├── progress/page.tsx   # Progress Tracker
│   │   ├── report/page.tsx     # Clinical Report
│   │   ├── about/page.tsx      # About & Evidence
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── Navigation.tsx      # Sidebar navigation
│   │   ├── RiskGauge.tsx       # Circular risk gauge
│   │   └── PatientSelector.tsx # Patient selection
│   └── lib/
│       ├── knowledge-graph.ts  # 107 edges, 51 nodes
│       ├── ncd-cie-engine.ts   # Risk engine + what-if
│       ├── store.ts            # localStorage persistence
│       └── utils.ts            # Utilities
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── build.py                    # Build script (sandbox)
└── README.md
```

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build for production
npm run build

# Or in sandboxed environment:
python3 build.py
```

## 📊 Core Algorithms

### Risk Scoring (Logistic-Link)
```
R_d = σ(β₀_d + Σ wᵢ·zᵢ)
```
Where σ is logistic sigmoid, z is z-score standardized.

### What-If Cascade (do-calculus approximation)
```
δ_k = Σ W_(v_p,v_k) · (x_p^INT − x_p) · γ^depth
```
Topological propagation with γ=0.7, d_max=3.

### Composite NCD Risk
```
R_NCD = 1 − (1−R_CVD)(1−R_T2DM)(1−R_CKD)
```

## 📑 Validation

| Metric | Value |
|--------|-------|
| AUC-ROC (SCORE2) | 0.704 |
| AUC-ROC (D'Agostino) | 0.721 |
| Calibration Slope | 0.91 |
| Brier Score | 0.118 |
| NHANES Concordance | r = 0.91 |
| RCT Alignments | 6/6 |

## 👥 Demo Patients

1. **Sarah Chen** (40F) — Low risk: Normal BMI, active, good lipids
2. **James Wilson** (55M) — Moderate risk: Overweight, borderline lipids, sedentary
3. **Robert Martinez** (65M) — High risk: Obese, diabetic, hypertensive

## 📄 License

Research software. See NCD-CIE paper for methodology details.

## ⚠️ Disclaimer

This is a clinical decision **support** tool. It does not replace clinical judgment. Risk predictions are population-level estimates. All clinical decisions should involve qualified healthcare professionals.
