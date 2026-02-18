# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NCD-Care+ is a hospital-grade clinical decision support platform for non-communicable disease (NCD) prevention and monitoring. It implements the **NCD-CIE v16** causal knowledge graph (107 edges, 51 nodes, 8 clinical domains) for risk prediction.

The application is a **client-side only** Next.js app with static export — no backend required. All risk calculations run in the browser using localStorage for persistence.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Development server (http://localhost:3000)
npm run build        # Production build (outputs to ./out/)
npm run lint         # ESLint check
python3 build.py     # Build in sandboxed environment (Linux, handles noexec /tmp)
```

## Architecture

### Core Engine (`src/lib/`)

- **knowledge-graph.ts**: NCD-CIE v16 knowledge graph data — 51 nodes (biomarkers, diseases, medications, lifestyle factors) and 107 weighted causal edges with confidence intervals and evidence grades (A-D)
- **ncd-cie-engine.ts**: Risk prediction engine implementing:
  - Logistic-link risk scoring: `R_d = σ(β₀_d + Σ wᵢ·zᵢ)` with z-score standardization
  - What-If intervention cascade using Pearl's do-calculus approximation with topological propagation (γ=0.7, d_max=3)
  - Composite risk: `R_NCD = 1 − (1−R_CVD)(1−R_T2DM)(1−R_CKD)`
- **store.ts**: localStorage persistence for patient profiles and visit history
- **utils.ts**: Tailwind merge helpers (`cn()`)

### Pages (`src/app/`)

Next.js 14 App Router with 8 pages: Dashboard, Profile, Risk Assessment, What-If Simulator, Knowledge Graph Explorer, Progress Tracker, Clinical Report, About.

### Key Types

```typescript
PatientProfile     // 30+ fields: demographics, biomarkers, medications
RiskWithCI         // { value, ci_low, ci_high }
FullRiskResult     // All 7 disease endpoints + composites
CascadeResult      // What-If output with activated edges
KGNode/KGEdge      // Knowledge graph structure with Bradford Hill scores
```

### Clinical Domains

Lipid Metabolism, Glycaemic Regulation, Blood Pressure, Renal Function, Inflammatory Markers, Anthropometrics, Lifestyle, Disease Endpoints, Interventions.

### Disease Endpoints

CAD, Stroke, Heart Failure, PAD, T2DM, CKD, NAFLD — plus CVD and NCD composites.

## Key Patterns

- All pages use `'use client'` directive — client-side rendering only
- Import alias: `@/*` maps to `./src/*`
- Tailwind custom colors: `clinical-*` (blue theme), `risk-*` (low/moderate/high/very-high)
- Dark mode: class-based (`darkMode: 'class'`)
- Static export configured: `output: 'export'` in next.config.js

## Demo Patients

Three built-in test profiles for development:
- `demo-low`: Sarah Chen (40F) — healthy baseline
- `demo-moderate`: James Wilson (55M) — borderline values
- `demo-high`: Robert Martinez (65M) — multiple risk factors
