'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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

export default function KnowledgeGraphPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [simNodes, setSimNodes] = useState<SimNode[]>([])
  const [selectedNode, setSelectedNode] = useState<KGNode | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<KGEdge | null>(null)
  const [domainFilter, setDomainFilter] = useState<ClinicalDomain | 'All'>('All')
  const [gradeFilter, setGradeFilter] = useState<EvidenceGrade | 'All'>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const animRef = useRef<number>(0)
  const dragRef = useRef<{ nodeId: string; startX: number; startY: number } | null>(null)
  const panRef = useRef({ x: 0, y: 0, scale: 1, dragging: false, startX: 0, startY: 0 })

  // Initialize simulation
  useEffect(() => {
    const width = 800
    const height = 600
    const initialNodes: SimNode[] = nodes.map((n, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI
      const domainIndex = Object.keys(domainColors).indexOf(n.domain)
      const radius = 150 + domainIndex * 40
      return {
        id: n.id,
        label: n.label,
        domain: n.domain,
        type: n.type,
        x: width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 50,
        y: height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
      }
    })
    setSimNodes(initialNodes)
  }, [])

  // Force simulation
  useEffect(() => {
    if (simNodes.length === 0) return

    const width = 800
    const height = 600
    const nodesCopy = simNodes.map(n => ({ ...n }))

    const simulate = () => {
      // Center gravity
      nodesCopy.forEach(n => {
        n.vx += (width / 2 - n.x) * 0.001
        n.vy += (height / 2 - n.y) * 0.001
      })

      // Repulsion
      for (let i = 0; i < nodesCopy.length; i++) {
        for (let j = i + 1; j < nodesCopy.length; j++) {
          const dx = nodesCopy[j].x - nodesCopy[i].x
          const dy = nodesCopy[j].y - nodesCopy[i].y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = 800 / (dist * dist)
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          nodesCopy[i].vx -= fx
          nodesCopy[i].vy -= fy
          nodesCopy[j].vx += fx
          nodesCopy[j].vy += fy
        }
      }

      // Edge attraction
      const filteredEdges = getFilteredEdges()
      filteredEdges.forEach(edge => {
        const source = nodesCopy.find(n => n.id === edge.source)
        const target = nodesCopy.find(n => n.id === edge.target)
        if (!source || !target) return
        const dx = target.x - source.x
        const dy = target.y - source.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (dist - 120) * 0.005
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        source.vx += fx
        source.vy += fy
        target.vx -= fx
        target.vy -= fy
      })

      // Update positions
      nodesCopy.forEach(n => {
        if (n.fx !== undefined) { n.x = n.fx; n.vx = 0 }
        else {
          n.vx *= 0.8
          n.x += n.vx
          n.x = Math.max(30, Math.min(width - 30, n.x))
        }
        if (n.fy !== undefined) { n.y = n.fy; n.vy = 0 }
        else {
          n.vy *= 0.8
          n.y += n.vy
          n.y = Math.max(30, Math.min(height - 30, n.y))
        }
      })

      setSimNodes([...nodesCopy])
      animRef.current = requestAnimationFrame(simulate)
    }

    animRef.current = requestAnimationFrame(simulate)
    return () => cancelAnimationFrame(animRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainFilter, gradeFilter])

  const getFilteredEdges = useCallback(() => {
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

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || simNodes.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = 800 * dpr
    canvas.height = 600 * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, 800, 600)

    const filteredEdges = getFilteredEdges()
    const connectedNodes = new Set<string>()
    filteredEdges.forEach(e => { connectedNodes.add(e.source); connectedNodes.add(e.target) })

    // Draw edges
    filteredEdges.forEach(edge => {
      const source = simNodes.find(n => n.id === edge.source)
      const target = simNodes.find(n => n.id === edge.target)
      if (!source || !target) return

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

      // Arrow
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
    })

    // Draw nodes
    simNodes.forEach(node => {
      if (domainFilter !== 'All' && !connectedNodes.has(node.id) && node.domain !== domainFilter) return

      const isHovered = hoveredNode === node.id
      const isSelected = selectedNode?.id === node.id
      const color = domainColors[node.domain] || '#94a3b8'
      const radius = node.type === 'disease' ? 14 : node.type === 'medication' ? 10 : 12

      // Glow
      if (isHovered || isSelected) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius + 6, 0, 2 * Math.PI)
        ctx.fillStyle = `${color}30`
        ctx.fill()
      }

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
    })
  }, [simNodes, hoveredNode, selectedNode, domainFilter, gradeFilter, searchTerm, getFilteredEdges])

  // Mouse handlers
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check node click
    for (const node of simNodes) {
      const dx = node.x - x
      const dy = node.y - y
      if (dx * dx + dy * dy < 225) {
        const kgNode = nodes.find(n => n.id === node.id)
        if (kgNode) {
          setSelectedNode(selectedNode?.id === kgNode.id ? null : kgNode)
          setSelectedEdge(null)
        }
        return
      }
    }

    // Check edge click
    const filteredEdges = getFilteredEdges()
    for (const edge of filteredEdges) {
      const src = simNodes.find(n => n.id === edge.source)
      const tgt = simNodes.find(n => n.id === edge.target)
      if (!src || !tgt) continue
      const dx = tgt.x - src.x
      const dy = tgt.y - src.y
      const len = Math.sqrt(dx * dx + dy * dy) || 1
      const t = Math.max(0, Math.min(1, ((x - src.x) * dx + (y - src.y) * dy) / (len * len)))
      const projX = src.x + t * dx
      const projY = src.y + t * dy
      const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2)
      if (dist < 8) {
        setSelectedEdge(selectedEdge?.id === edge.id ? null : edge)
        setSelectedNode(null)
        return
      }
    }

    setSelectedNode(null)
    setSelectedEdge(null)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    let found = false
    for (const node of simNodes) {
      const dx = node.x - x
      const dy = node.y - y
      if (dx * dx + dy * dy < 225) {
        setHoveredNode(node.id)
        found = true
        break
      }
    }
    if (!found) setHoveredNode(null)
  }

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
