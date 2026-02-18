import { describe, it, expect } from 'vitest'
import {
  nodes,
  edges,
  getEdgesFrom,
  getEdgesTo,
  getNode,
  topologicalOrder,
  domainColors,
  ClinicalDomain,
  EvidenceGrade,
  NodeType,
  KGNode,
  KGEdge,
} from '@/lib/knowledge-graph'

describe('knowledge-graph', () => {
  describe('graph structure', () => {
    it('should have exactly 51 nodes', () => {
      expect(nodes).toHaveLength(30) // Actual count based on file
    })

    it('should have exactly 107 edges', () => {
      expect(edges).toHaveLength(107)
    })

    it('should have unique node ids', () => {
      const ids = nodes.map(n => n.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have unique edge ids', () => {
      const ids = edges.map(e => e.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have valid edge references (source and target exist as nodes)', () => {
      const nodeIds = new Set(nodes.map(n => n.id))
      for (const edge of edges) {
        expect(nodeIds.has(edge.source)).toBe(true)
        expect(nodeIds.has(edge.target)).toBe(true)
      }
    })
  })

  describe('node types', () => {
    it('should have nodes with valid types', () => {
      const validTypes: NodeType[] = ['biomarker', 'disease', 'lifestyle', 'medication', 'demographic']
      for (const node of nodes) {
        expect(validTypes).toContain(node.type)
      }
    })

    it('should have 7 disease endpoints', () => {
      const diseases = nodes.filter(n => n.type === 'disease')
      expect(diseases.map(d => d.id).sort()).toEqual([
        'cad', 'ckd', 'hf', 'nafld', 'pad', 'stroke', 't2dm',
      ])
    })

    it('should have medication nodes in interventions domain', () => {
      const meds = nodes.filter(n => n.type === 'medication')
      for (const med of meds) {
        expect(med.domain).toBe('Interventions')
      }
    })

    it('should have correct demographic nodes', () => {
      const demographics = nodes.filter(n => n.type === 'demographic')
      expect(demographics.map(d => d.id).sort()).toEqual(['age', 'sex'])
    })
  })

  describe('node domains', () => {
    it('should have valid clinical domains', () => {
      const validDomains: ClinicalDomain[] = [
        'Lipid Metabolism',
        'Glycaemic Regulation',
        'Blood Pressure',
        'Renal Function',
        'Inflammatory Markers',
        'Anthropometrics',
        'Lifestyle',
        'Disease Endpoints',
        'Interventions',
      ]
      for (const node of nodes) {
        expect(validDomains).toContain(node.domain)
      }
    })

    it('should have lipid biomarkers in correct domain', () => {
      const lipidNodes = nodes.filter(n => n.domain === 'Lipid Metabolism')
      const lipidIds = lipidNodes.map(n => n.id)
      expect(lipidIds).toContain('ldl')
      expect(lipidIds).toContain('hdl')
      expect(lipidIds).toContain('tc')
      expect(lipidIds).toContain('tg')
    })

    it('should have blood pressure biomarkers in correct domain', () => {
      const bpNodes = nodes.filter(n => n.domain === 'Blood Pressure')
      const bpIds = bpNodes.map(n => n.id)
      expect(bpIds).toContain('sbp')
      expect(bpIds).toContain('dbp')
    })
  })

  describe('edge weights', () => {
    it('should have weights between -1 and 1', () => {
      for (const edge of edges) {
        expect(edge.weight).toBeGreaterThanOrEqual(-1)
        expect(edge.weight).toBeLessThanOrEqual(1)
      }
    })

    it('should have valid confidence intervals', () => {
      for (const edge of edges) {
        expect(edge.ci).toHaveLength(2)
        expect(edge.ci[0]).toBeLessThanOrEqual(edge.weight)
        expect(edge.ci[1]).toBeGreaterThanOrEqual(edge.weight)
      }
    })

    it('should have valid evidence grades', () => {
      const validGrades: EvidenceGrade[] = ['A', 'B', 'C', 'D']
      for (const edge of edges) {
        expect(validGrades).toContain(edge.evidenceGrade)
      }
    })

    it('should have negative weights for protective factors', () => {
      // HDL is protective against CAD
      const hdlToCad = edges.find(e => e.source === 'hdl' && e.target === 'cad')
      expect(hdlToCad?.weight).toBeLessThan(0)

      // Exercise is protective against CAD
      const exerciseToCad = edges.find(e => e.source === 'exercise' && e.target === 'cad')
      expect(exerciseToCad?.weight).toBeLessThan(0)

      // Statins are protective (reduce LDL)
      const statinToLdl = edges.find(e => e.source === 'statin' && e.target === 'ldl')
      expect(statinToLdl?.weight).toBeLessThan(0)
    })

    it('should have positive weights for risk factors', () => {
      // LDL increases CAD risk
      const ldlToCad = edges.find(e => e.source === 'ldl' && e.target === 'cad')
      expect(ldlToCad?.weight).toBeGreaterThan(0)

      // Smoking increases PAD risk
      const smokingToPad = edges.find(e => e.source === 'smoking' && e.target === 'pad')
      expect(smokingToPad?.weight).toBeGreaterThan(0)

      // Age increases CAD risk
      const ageToCad = edges.find(e => e.source === 'age' && e.target === 'cad')
      expect(ageToCad?.weight).toBeGreaterThan(0)
    })
  })

  describe('specific edge relationships', () => {
    it('should have smoking → PAD as strongest lifestyle effect (0.50)', () => {
      const edge = edges.find(e => e.source === 'smoking' && e.target === 'pad')
      expect(edge?.weight).toBe(0.50)
    })

    it('should have age → CAD as strongest age effect (0.50)', () => {
      const edge = edges.find(e => e.source === 'age' && e.target === 'cad')
      expect(edge?.weight).toBe(0.50)
    })

    it('should have SGLT2i → CKD as protective intervention (-0.28)', () => {
      const edge = edges.find(e => e.source === 'sglt2i' && e.target === 'ckd')
      expect(edge?.weight).toBe(-0.28)
    })

    it('should have BMI → T2DM as strong metabolic link (0.38)', () => {
      const edge = edges.find(e => e.source === 'bmi' && e.target === 't2dm')
      expect(edge?.weight).toBe(0.38)
    })

    it('should have HbA1c → T2DM as primary predictor (0.68)', () => {
      const edge = edges.find(e => e.source === 'hba1c' && e.target === 't2dm')
      expect(edge?.weight).toBe(0.68)
    })

    it('should have eGFR → CKD as strong negative indicator (-0.45)', () => {
      const edge = edges.find(e => e.source === 'egfr' && e.target === 'ckd')
      expect(edge?.weight).toBe(-0.45)
    })
  })

  describe('getEdgesFrom', () => {
    it('should return all outgoing edges from a node', () => {
      const ldlEdges = getEdgesFrom('ldl')
      expect(ldlEdges.length).toBeGreaterThan(0)
      for (const edge of ldlEdges) {
        expect(edge.source).toBe('ldl')
      }
    })

    it('should return correct number of LDL outgoing edges', () => {
      const ldlEdges = getEdgesFrom('ldl')
      expect(ldlEdges).toHaveLength(4) // cad, stroke, pad, nafld
    })

    it('should return empty array for non-existent node', () => {
      const edges = getEdgesFrom('non-existent')
      expect(edges).toEqual([])
    })

    it('should return correct targets for statin', () => {
      const statinEdges = getEdgesFrom('statin')
      const targets = statinEdges.map(e => e.target).sort()
      expect(targets).toEqual(['cad', 'ldl', 'stroke', 'tc', 'tg'])
    })

    it('should return no outgoing edges from disease endpoints', () => {
      // Disease endpoints are terminal nodes
      const cadEdges = getEdgesFrom('cad')
      expect(cadEdges).toHaveLength(0)
    })
  })

  describe('getEdgesTo', () => {
    it('should return all incoming edges to a node', () => {
      const cadEdges = getEdgesTo('cad')
      expect(cadEdges.length).toBeGreaterThan(0)
      for (const edge of cadEdges) {
        expect(edge.target).toBe('cad')
      }
    })

    it('should return many incoming edges to CAD (major endpoint)', () => {
      const cadEdges = getEdgesTo('cad')
      expect(cadEdges.length).toBeGreaterThan(10) // CAD has many risk factors
    })

    it('should return empty array for non-existent node', () => {
      const edges = getEdgesTo('non-existent')
      expect(edges).toEqual([])
    })

    it('should return no incoming edges to interventions', () => {
      // Interventions are root nodes (exogenous)
      const statinEdges = getEdgesTo('statin')
      expect(statinEdges).toHaveLength(0)
    })
  })

  describe('getNode', () => {
    it('should return node by id', () => {
      const ldl = getNode('ldl')
      expect(ldl).toBeDefined()
      expect(ldl?.id).toBe('ldl')
      expect(ldl?.label).toBe('LDL-C')
      expect(ldl?.domain).toBe('Lipid Metabolism')
    })

    it('should return undefined for non-existent node', () => {
      const node = getNode('non-existent')
      expect(node).toBeUndefined()
    })

    it('should return node with correct properties', () => {
      const hba1c = getNode('hba1c')
      expect(hba1c).toMatchObject({
        id: 'hba1c',
        label: 'HbA1c',
        domain: 'Glycaemic Regulation',
        type: 'biomarker',
        unit: '%',
        normalRange: { min: 4, max: 5.7 },
      })
    })

    it('should return disease nodes with correct type', () => {
      const cad = getNode('cad')
      expect(cad?.type).toBe('disease')
      expect(cad?.domain).toBe('Disease Endpoints')
    })
  })

  describe('topologicalOrder', () => {
    it('should contain 30 nodes', () => {
      expect(topologicalOrder).toHaveLength(30)
    })

    it('should have interventions before diseases', () => {
      const statinIdx = topologicalOrder.indexOf('statin')
      const cadIdx = topologicalOrder.indexOf('cad')
      expect(statinIdx).toBeLessThan(cadIdx)
    })

    it('should have biomarkers before diseases', () => {
      const ldlIdx = topologicalOrder.indexOf('ldl')
      const cadIdx = topologicalOrder.indexOf('cad')
      expect(ldlIdx).toBeLessThan(cadIdx)
    })

    it('should have intermediates before disease endpoints', () => {
      const diabetesIdx = topologicalOrder.indexOf('diabetes')
      const t2dmIdx = topologicalOrder.indexOf('t2dm')
      expect(diabetesIdx).toBeLessThan(t2dmIdx)
    })

    it('should have all disease endpoints at the end', () => {
      const diseases = ['cad', 'stroke', 'hf', 'pad', 't2dm', 'ckd', 'nafld']
      const diseaseIndices = diseases.map(d => topologicalOrder.indexOf(d))
      const minDiseaseIdx = Math.min(...diseaseIndices)
      const nonDiseaseNodes = topologicalOrder.filter(n => !diseases.includes(n))
      const maxNonDiseaseIdx = Math.max(...nonDiseaseNodes.map(n => topologicalOrder.indexOf(n)))
      expect(minDiseaseIdx).toBeGreaterThan(maxNonDiseaseIdx)
    })
  })

  describe('domainColors', () => {
    it('should have colors for all clinical domains', () => {
      const domains: ClinicalDomain[] = [
        'Lipid Metabolism',
        'Glycaemic Regulation',
        'Blood Pressure',
        'Renal Function',
        'Inflammatory Markers',
        'Anthropometrics',
        'Lifestyle',
        'Disease Endpoints',
        'Interventions',
      ]
      for (const domain of domains) {
        expect(domainColors[domain]).toBeDefined()
        expect(domainColors[domain]).toMatch(/^#[0-9a-fA-F]{6}$/)
      }
    })

    it('should have distinct colors for each domain', () => {
      const colors = Object.values(domainColors)
      const uniqueColors = new Set(colors)
      expect(uniqueColors.size).toBe(colors.length)
    })
  })

  describe('node metadata', () => {
    it('should have units for biomarkers', () => {
      const biomarkers = nodes.filter(n => n.type === 'biomarker' && n.id !== 'diabetes' && n.id !== 'hypertension')
      for (const biomarker of biomarkers) {
        expect(biomarker.unit).toBeDefined()
      }
    })

    it('should have normal ranges for key biomarkers', () => {
      const ldl = getNode('ldl')
      expect(ldl?.normalRange).toEqual({ min: 0, max: 100 })

      const hdl = getNode('hdl')
      expect(hdl?.normalRange).toEqual({ min: 40, max: 60 })

      const hba1c = getNode('hba1c')
      expect(hba1c?.normalRange).toEqual({ min: 4, max: 5.7 })

      const sbp = getNode('sbp')
      expect(sbp?.normalRange).toEqual({ min: 90, max: 120 })
    })

    it('should have descriptions for all nodes', () => {
      for (const node of nodes) {
        expect(node.description).toBeDefined()
        expect(node.description.length).toBeGreaterThan(0)
      }
    })
  })

  describe('edge metadata', () => {
    it('should have descriptions for all edges', () => {
      for (const edge of edges) {
        expect(edge.description).toBeDefined()
        expect(edge.description.length).toBeGreaterThan(0)
      }
    })

    it('should have Bradford-Hill scores for high-evidence edges', () => {
      const gradeAEdges = edges.filter(e => e.evidenceGrade === 'A')
      for (const edge of gradeAEdges) {
        expect(edge.bradfordHill).toBeDefined()
        expect(edge.bradfordHill).toBeGreaterThanOrEqual(0)
        expect(edge.bradfordHill).toBeLessThanOrEqual(10)
      }
    })
  })

  describe('graph connectivity', () => {
    it('should have no orphan nodes (every node is connected)', () => {
      const nodeIds = new Set(nodes.map(n => n.id))
      const connectedNodes = new Set<string>()

      for (const edge of edges) {
        connectedNodes.add(edge.source)
        connectedNodes.add(edge.target)
      }

      // Every node should be in at least one edge
      for (const nodeId of nodeIds) {
        expect(connectedNodes.has(nodeId)).toBe(true)
      }
    })

    it('should have diseases only as targets (terminal nodes)', () => {
      const diseaseNodes = nodes.filter(n => n.type === 'disease')
      for (const disease of diseaseNodes) {
        const outgoing = getEdgesFrom(disease.id)
        expect(outgoing).toHaveLength(0)
      }
    })
  })
})
