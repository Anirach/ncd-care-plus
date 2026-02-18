'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { nodes, edges, domainColors, type ClinicalDomain, type KGNode, type KGEdge, type EvidenceGrade } from '@/lib/knowledge-graph'
import { cn } from '@/lib/utils'

interface SimNode {
  id: string
  label: string
  domain: ClinicalDomain
  type: string
  x: number
  y: number
  vx: number
  vy: number
  fx?: number
  fy?: number
}

// Performance constants
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const SIMULATION_ALPHA = 0.8
const REPULSION_STRENGTH = 800
const EDGE_TARGET_LENGTH = 120
const EDGE_STRENGTH = 0.005
const CENTER_GRAVITY = 0.001
const NODE_RADIUS_THRESHOLD = 225 // 15^2 for hit detection

export default function KnowledgeGraphPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const simNodesRef = useRef<SimNode[]>([])
  const [renderTrigger, setRenderTrigger] = useState(0)
  const [selectedNode, setSelectedNode] = useState<KGNode | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<KGEdge | null>(null)
  const [domainFilter, setDomainFilter] = useState<ClinicalDomain | 'All'>('All')
  const [gradeFilter, setGradeFilter] = useState<EvidenceGrade | 'All'>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const animRef = useRef<number>(0)
  const frameCountRef = useRef(0)
  const lastRenderRef = useRef(0)

  // Memoize filtered edges for performance
  const filteredEdges = useMemo(() => {
    return edges.filter(e => {
      if (domainFilter !== 'All' && e.domain !== domainFilter) return false
      if (gradeFilter !== 'All' && e.evidenceGrade !== gradeFilter) return false
      if (searchTerm) {
        const src = nodes.find(n => n.id === e.source)
        const tgt = nodes.find(n => n.id === e.target)
        const term = searchTerm.toLowerCase()
        return src?.label.toLowerCase().includes(term) || tgt?.label.toLowerCase().includes(term)
      }
      return true
    })
  }, [domainFilter, gradeFilter, searchTerm])

  // Create node lookup map for O(1) access
  const nodeMap = useMemo(() => {
    const map = new Map<string, SimNode>()
    simNodesRef.current.forEach(n => map.set(n.id, n))
    return map
  }, [renderTrigger])

  // Initialize simulation
  useEffect(() => {
    const domainKeys = Object.keys(domainColors)
    const initialNodes: SimNode[] = nodes.map((n, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI
      const domainIndex = domainKeys.indexOf(n.domain)
      const radius = 150 + domainIndex * 40
      return {
        id: n.id,
        label: n.label,
        domain: n.domain,
        type: n.type,
        x: CANVAS_WIDTH / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 50,
        y: CANVAS_HEIGHT / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
      }
    })
    simNodesRef.current = initialNodes
    setRenderTrigger(1)
  }, [])

  // Optimized force simulation with throttled state updates
  useEffect(() => {
    if (simNodesRef.current.length === 0) return

    const nodesCopy = simNodesRef.current

    // Build node index map for O(1) lookups
    const nodeIndex = new Map<string, number>()
    for (let i = 0; i < nodesCopy.length; i++) {
      nodeIndex.set(nodesCopy[i].id, i)
    }

    const simulate = () => {
      frameCountRef.current++

      // Center gravity - vectorized
      for (let i = 0; i < nodesCopy.length; i++) {
        const n = nodesCopy[i]
        n.vx += (CANVAS_WIDTH / 2 - n.x) * CENTER_GRAVITY
        n.vy += (CANVAS_HEIGHT / 2 - n.y) * CENTER_GRAVITY
      }

      // Repulsion - O(n²) but optimized with early exit
      for (let i = 0; i < nodesCopy.length; i++) {
        const ni = nodesCopy[i]
        for (let j = i + 1; j < nodesCopy.length; j++) {
          const nj = nodesCopy[j]
          const dx = nj.x - ni.x
          const dy = nj.y - ni.y
          const distSq = dx * dx + dy * dy
          if (distSq > 40000) continue // Skip if too far apart (200px)
          const dist = Math.sqrt(distSq) || 1
          const force = REPULSION_STRENGTH / distSq
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          ni.vx -= fx
          ni.vy -= fy
          nj.vx += fx
          nj.vy += fy
        }
      }

      // Edge attraction - use index for O(1) lookup
      for (let i = 0; i < filteredEdges.length; i++) {
        const edge = filteredEdges[i]
        const srcIdx = nodeIndex.get(edge.source)
        const tgtIdx = nodeIndex.get(edge.target)
        if (srcIdx === undefined || tgtIdx === undefined) continue
        const source = nodesCopy[srcIdx]
        const target = nodesCopy[tgtIdx]
        const dx = target.x - source.x
        const dy = target.y - source.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (dist - EDGE_TARGET_LENGTH) * EDGE_STRENGTH
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        source.vx += fx
        source.vy += fy
        target.vx -= fx
        target.vy -= fy
      }

      // Update positions with bounds checking
      for (let i = 0; i < nodesCopy.length; i++) {
        const n = nodesCopy[i]
        if (n.fx !== undefined) { n.x = n.fx; n.vx = 0 }
        else {
          n.vx *= SIMULATION_ALPHA
          n.x += n.vx
          n.x = Math.max(30, Math.min(CANVAS_WIDTH - 30, n.x))
        }
        if (n.fy !== undefined) { n.y = n.fy; n.vy = 0 }
        else {
          n.vy *= SIMULATION_ALPHA
          n.y += n.vy
          n.y = Math.max(30, Math.min(CANVAS_HEIGHT - 30, n.y))
        }
      }

      // Throttle React state updates to every 2 frames for smoother performance
      if (frameCountRef.current % 2 === 0) {
        setRenderTrigger(prev => prev + 1)
      }

      animRef.current = requestAnimationFrame(simulate)
    }

    animRef.current = requestAnimationFrame(simulate)
    return () => cancelAnimationFrame(animRef.current)
  }, [filteredEdges])

  // Connected nodes set for filtering display
  const connectedNodes = useMemo(() => {
    const set = new Set<string>()
    filteredEdges.forEach(e => { set.add(e.source); set.add(e.target) })
    return set
  }, [filteredEdges])

  // Canvas rendering - optimized with direct ref access
  useEffect(() => {
    const canvas = canvasRef.current
    const simNodes = simNodesRef.current
    if (!canvas || simNodes.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Only set canvas size once
    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== CANVAS_WIDTH * dpr) {
      canvas.width = CANVAS_WIDTH * dpr
      canvas.height = CANVAS_HEIGHT * dpr
      ctx.scale(dpr, dpr)
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Build node lookup for O(1) access
    const nodeLookup = new Map<string, SimNode>()
    for (let i = 0; i < simNodes.length; i++) {
      nodeLookup.set(simNodes[i].id, simNodes[i])
    }

    // Draw edges - batch similar operations
    for (let i = 0; i < filteredEdges.length; i++) {
      const edge = filteredEdges[i]
      const source = nodeLookup.get(edge.source)
      const target = nodeLookup.get(edge.target)
      if (!source || !target) continue

      const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target ||
        selectedNode?.id === edge.source || selectedNode?.id === edge.target

      ctx.beginPath()
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)
      ctx.strokeStyle = isHighlighted
        ? (edge.weight > 0 ? '#ef4444' : '#22c55e')
        : 'rgba(148, 163, 184, 0.3)'
      ctx.lineWidth = isHighlighted ? Math.abs(edge.weight) * 6 + 1 : Math.abs(edge.weight) * 3 + 0.5
      ctx.stroke()

      // Arrow for highlighted edges
      if (isHighlighted) {
        const angle = Math.atan2(target.y - source.y, target.x - source.x)
        const midX = (source.x + target.x) / 2
        const midY = (source.y + target.y) / 2
        ctx.beginPath()
        ctx.moveTo(midX + 6 * Math.cos(angle), midY + 6 * Math.sin(angle))
        ctx.lineTo(midX - 6 * Math.cos(angle - 0.5), midY - 6 * Math.sin(angle - 0.5))
        ctx.lineTo(midX - 6 * Math.cos(angle + 0.5), midY - 6 * Math.sin(angle + 0.5))
        ctx.fillStyle = edge.weight > 0 ? '#ef4444' : '#22c55e'
        ctx.fill()
      }
    }

    // Draw nodes
    for (let i = 0; i < simNodes.length; i++) {
      const node = simNodes[i]
      if (domainFilter !== 'All' && !connectedNodes.has(node.id) && node.domain !== domainFilter) continue

      const isHovered = hoveredNode === node.id
      const isSelected = selectedNode?.id === node.id
      const color = domainColors[node.domain] || '#94a3b8'
      const radius = node.type === 'disease' ? 14 : node.type === 'medication' ? 10 : 12

      // Glow effect for hover/selected
      if (isHovered || isSelected) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius + 6, 0, 2 * Math.PI)
        ctx.fillStyle = `${color}30`
        ctx.fill()
      }

      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = isHovered || isSelected ? color : `${color}cc`
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()

      // Label
      ctx.fillStyle = isHovered || isSelected ? '#0f172a' : '#475569'
      ctx.font = `${isHovered || isSelected ? 'bold ' : ''}${isHovered || isSelected ? 11 : 9}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(node.label, node.x, node.y + radius + 14)
    }
  }, [renderTrigger, hoveredNode, selectedNode, domainFilter, filteredEdges, connectedNodes])

  // Mouse handlers - use refs for better performance
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const simNodes = simNodesRef.current

    // Check node click
    for (let i = 0; i < simNodes.length; i++) {
      const node = simNodes[i]
      const dx = node.x - x
      const dy = node.y - y
      if (dx * dx + dy * dy < NODE_RADIUS_THRESHOLD) {
        const kgNode = nodes.find(n => n.id === node.id)
        if (kgNode) {
          setSelectedNode(prev => prev?.id === kgNode.id ? null : kgNode)
          setSelectedEdge(null)
        }
        return
      }
    }

    // Build quick lookup for edge hit testing
    const nodeLookup = new Map<string, SimNode>()
    for (let i = 0; i < simNodes.length; i++) {
      nodeLookup.set(simNodes[i].id, simNodes[i])
    }

    // Check edge click
    for (let i = 0; i < filteredEdges.length; i++) {
      const edge = filteredEdges[i]
      const src = nodeLookup.get(edge.source)
      const tgt = nodeLookup.get(edge.target)
      if (!src || !tgt) continue
      const dx = tgt.x - src.x
      const dy = tgt.y - src.y
      const lenSq = dx * dx + dy * dy
      if (lenSq === 0) continue
      const t = Math.max(0, Math.min(1, ((x - src.x) * dx + (y - src.y) * dy) / lenSq))
      const projX = src.x + t * dx
      const projY = src.y + t * dy
      const distSq = (x - projX) ** 2 + (y - projY) ** 2
      if (distSq < 64) { // 8^2
        setSelectedEdge(prev => prev?.id === edge.id ? null : edge)
        setSelectedNode(null)
        return
      }
    }

    setSelectedNode(null)
    setSelectedEdge(null)
  }, [filteredEdges])

  // Throttled mouse move handler
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const simNodes = simNodesRef.current

    let found: string | null = null
    for (let i = 0; i < simNodes.length; i++) {
      const node = simNodes[i]
      const dx = node.x - x
      const dy = node.y - y
      if (dx * dx + dy * dy < NODE_RADIUS_THRESHOLD) {
        found = node.id
        break
      }
    }
    setHoveredNode(found)
  }, [])

  const allDomains = Object.keys(domainColors) as ClinicalDomain[]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">🧠 Knowledge Graph Explorer</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Interactive causal knowledge graph — {nodes.length} nodes, {edges.length} edges, {allDomains.length} domains
        </p>
      </div>

      {/* Filters */}
      <div className="card-clinical">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search nodes..."
              className="input-clinical w-48"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Domain</label>
            <select
              value={domainFilter}
              onChange={e => setDomainFilter(e.target.value as ClinicalDomain | 'All')}
              className="input-clinical w-48"
            >
              <option value="All">All Domains</option>
              {allDomains.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Evidence Grade</label>
            <select
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value as EvidenceGrade | 'All')}
              className="input-clinical w-32"
            >
              <option value="All">All</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
              <option value="D">Grade D</option>
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            {allDomains.map(d => (
              <button
                key={d}
                onClick={() => setDomainFilter(domainFilter === d ? 'All' : d)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border transition-all',
                  domainFilter === d
                    ? 'border-transparent text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'
                )}
                style={domainFilter === d ? { backgroundColor: domainColors[d] } : {}}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: domainColors[d] }} />
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Graph canvas */}
        <div className="lg:col-span-2 card-clinical p-2">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full rounded-lg cursor-crosshair"
            style={{ aspectRatio: '4/3' }}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
          />
        </div>

        {/* Detail panel */}
        <div className="card-clinical">
          {selectedNode ? (
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">{selectedNode.label}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: domainColors[selectedNode.domain] }} />
                  <span className="text-slate-500">{selectedNode.domain}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">{selectedNode.description}</p>
                {selectedNode.unit && (
                  <p className="text-slate-500"><strong>Unit:</strong> {selectedNode.unit}</p>
                )}
                {selectedNode.normalRange && (
                  <p className="text-slate-500"><strong>Normal:</strong> {selectedNode.normalRange.min}–{selectedNode.normalRange.max}</p>
                )}
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mt-4">Connections</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).map(e => {
                    const isSource = e.source === selectedNode.id
                    const otherNode = nodes.find(n => n.id === (isSource ? e.target : e.source))
                    return (
                      <button
                        key={e.id}
                        onClick={() => { setSelectedEdge(e); setSelectedNode(null) }}
                        className="w-full text-left p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-xs"
                      >
                        <span className={cn('font-mono', e.weight > 0 ? 'text-red-500' : 'text-green-500')}>
                          {isSource ? '→' : '←'} {e.weight > 0 ? '+' : ''}{e.weight.toFixed(2)}
                        </span>
                        {' '}
                        <span className="font-medium">{otherNode?.label}</span>
                        {' '}
                        <span className={`badge-grade-${e.evidenceGrade.toLowerCase()}`}>{e.evidenceGrade}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : selectedEdge ? (
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Edge Detail</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-base">
                  <span className="font-semibold">{nodes.find(n => n.id === selectedEdge.source)?.label}</span>
                  <span className={cn('font-mono', selectedEdge.weight > 0 ? 'text-red-500' : 'text-green-500')}>
                    → {selectedEdge.weight > 0 ? '+' : ''}{selectedEdge.weight.toFixed(3)} →
                  </span>
                  <span className="font-semibold">{nodes.find(n => n.id === selectedEdge.target)?.label}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">{selectedEdge.description}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                    <div className="text-[10px] text-slate-400">Weight (log-odds)</div>
                    <div className="font-bold">{selectedEdge.weight.toFixed(3)}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                    <div className="text-[10px] text-slate-400">95% CI</div>
                    <div className="font-bold">[{selectedEdge.ci[0].toFixed(3)}, {selectedEdge.ci[1].toFixed(3)}]</div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                    <div className="text-[10px] text-slate-400">Evidence Grade</div>
                    <div><span className={`badge-grade-${selectedEdge.evidenceGrade.toLowerCase()}`}>{selectedEdge.evidenceGrade}</span></div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                    <div className="text-[10px] text-slate-400">Bradford Hill</div>
                    <div className="font-bold">{selectedEdge.bradfordHill?.toFixed(1) || 'N/A'}/9</div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 col-span-2">
                    <div className="text-[10px] text-slate-400">Domain</div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: domainColors[selectedEdge.domain] }} />
                      {selectedEdge.domain}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="text-4xl">🔍</span>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
                Click a node or edge to view details
              </p>
              <div className="mt-6 text-left space-y-2">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Legend</h4>
                {allDomains.map(d => (
                  <div key={d} className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: domainColors[d] }} />
                    <span className="text-slate-600 dark:text-slate-400">{d}</span>
                  </div>
                ))}
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-2"><span className="text-red-500">—</span> Increases risk</div>
                  <div className="flex items-center gap-2"><span className="text-green-500">—</span> Decreases risk</div>
                  <div>Line thickness = effect size</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
