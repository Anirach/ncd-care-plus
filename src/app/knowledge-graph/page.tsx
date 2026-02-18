'use client'

import { useState, useEffect, useMemo } from 'react'
import { nodes, edges, domainColors, type ClinicalDomain, type KGNode, type KGEdge, type EvidenceGrade, type NodeType } from '@/lib/knowledge-graph'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Filter, ZoomIn, ZoomOut, RotateCcw, Info, Layers, Network, Search } from 'lucide-react'

// Canvas dimensions (increased for better spacing)
const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 800

// Force simulation configuration
const FORCE_CONFIG = {
  repulsion: 2500,
  minDistance: 60,
  springConstant: 0.003,
  targetLength: 180,
  centerGravity: 0.0002,
  damping: 0.85,
  iterations: 250,
  boundaryPadding: 80,
}

// Hierarchical layout layers (based on causal flow)
const HIERARCHY_LAYERS = [
  ['statin', 'htn_med', 'sglt2i', 'metformin', 'aspirin', 'ace_arb'],  // Interventions
  ['exercise', 'diet', 'smoking', 'alcohol'],                          // Lifestyle
  ['age', 'sex'],                                                       // Demographics
  ['bmi', 'ldl', 'hdl', 'tc', 'tg', 'sbp', 'dbp', 'hba1c', 'fpg', 'egfr'], // Biomarkers
  ['diabetes', 'hypertension'],                                        // Intermediate
  ['cad', 'stroke', 'hf', 'pad', 't2dm', 'ckd', 'nafld'],              // Disease endpoints
]

interface LayoutNode {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  node: KGNode
}

interface LabelPos {
  x: number
  y: number
  anchor: 'start' | 'middle' | 'end'
}

// Compute node degrees for sizing
function computeNodeDegrees(filteredEdges: KGEdge[]): Map<string, number> {
  const degrees = new Map<string, number>()
  for (const e of filteredEdges) {
    degrees.set(e.source, (degrees.get(e.source) || 0) + 1)
    degrees.set(e.target, (degrees.get(e.target) || 0) + 1)
  }
  return degrees
}

// Force-directed layout hook
function useForceLayout(
  filteredNodes: KGNode[],
  filteredEdges: KGEdge[],
  width: number,
  height: number,
  layoutMode: 'force' | 'hierarchical'
) {
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([])

  useEffect(() => {
    if (layoutMode === 'hierarchical') {
      // Hierarchical layout
      const ln: LayoutNode[] = []
      const nodeSet = new Set(filteredNodes.map(n => n.id))
      const layerHeight = height / (HIERARCHY_LAYERS.length + 1)

      HIERARCHY_LAYERS.forEach((layer, layerIdx) => {
        const visibleInLayer = layer.filter(id => nodeSet.has(id))
        const nodeWidth = width / (visibleInLayer.length + 1)

        visibleInLayer.forEach((nodeId, nodeIdx) => {
          const node = filteredNodes.find(n => n.id === nodeId)
          if (node) {
            ln.push({
              id: nodeId,
              x: nodeWidth * (nodeIdx + 1),
              y: layerHeight * (layerIdx + 1),
              vx: 0,
              vy: 0,
              node,
            })
          }
        })
      })

      // Add any nodes not in predefined layers
      const placedIds = new Set(ln.map(n => n.id))
      filteredNodes.filter(n => !placedIds.has(n.id)).forEach((node, i) => {
        ln.push({
          id: node.id,
          x: 100 + i * 50,
          y: height - 50,
          vx: 0,
          vy: 0,
          node,
        })
      })

      setLayoutNodes([...ln])
      return
    }

    // Force-directed layout
    const nodeDegrees = computeNodeDegrees(filteredEdges)

    const ln: LayoutNode[] = filteredNodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / filteredNodes.length
      const r = Math.min(width, height) * 0.4
      return {
        id: n.id,
        x: width / 2 + r * Math.cos(angle) + (Math.random() - 0.5) * 80,
        y: height / 2 + r * Math.sin(angle) + (Math.random() - 0.5) * 80,
        vx: 0,
        vy: 0,
        node: n,
      }
    })

    const nodeMap = new Map(ln.map(n => [n.id, n]))
    const { repulsion, minDistance, springConstant, targetLength, centerGravity, damping, iterations, boundaryPadding } = FORCE_CONFIG

    for (let iter = 0; iter < iterations; iter++) {
      const alpha = 1 - iter / iterations
      const k = 0.1 * alpha

      // Repulsion with minimum distance
      for (let i = 0; i < ln.length; i++) {
        for (let j = i + 1; j < ln.length; j++) {
          let dx = ln[j].x - ln[i].x
          let dy = ln[j].y - ln[i].y
          let dist = Math.sqrt(dx * dx + dy * dy) || 1
          dist = Math.max(dist, minDistance)

          // Degree-based repulsion
          const degreeI = nodeDegrees.get(ln[i].id) || 1
          const degreeJ = nodeDegrees.get(ln[j].id) || 1
          const degreeFactor = Math.sqrt(degreeI * degreeJ) / 4

          const force = (repulsion * degreeFactor) / (dist * dist)
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          ln[i].vx -= fx * k
          ln[i].vy -= fy * k
          ln[j].vx += fx * k
          ln[j].vy += fy * k
        }
      }

      // Attraction (edges)
      for (const edge of filteredEdges) {
        const source = nodeMap.get(edge.source)
        const target = nodeMap.get(edge.target)
        if (!source || !target) continue

        let dx = target.x - source.x
        let dy = target.y - source.y
        let dist = Math.sqrt(dx * dx + dy * dy) || 1

        const sourceDeg = nodeDegrees.get(edge.source) || 1
        const targetDeg = nodeDegrees.get(edge.target) || 1
        const varLength = targetLength + Math.log(sourceDeg + targetDeg) * 15

        const force = (dist - varLength) * springConstant
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        source.vx += fx * k
        source.vy += fy * k
        target.vx -= fx * k
        target.vy -= fy * k
      }

      // Center gravity
      for (const n of ln) {
        n.vx += (width / 2 - n.x) * centerGravity * alpha
        n.vy += (height / 2 - n.y) * centerGravity * alpha
      }

      // Apply velocity
      for (const n of ln) {
        n.vx *= damping
        n.vy *= damping
        n.x += n.vx
        n.y += n.vy
        n.x = Math.max(boundaryPadding, Math.min(width - boundaryPadding, n.x))
        n.y = Math.max(boundaryPadding, Math.min(height - boundaryPadding, n.y))
      }
    }

    setLayoutNodes([...ln])
  }, [filteredNodes, filteredEdges, width, height, layoutMode])

  return layoutNodes
}

// Label collision avoidance
function computeLabelPositions(
  layoutNodes: LayoutNode[],
  nodePositions: Map<string, { x: number; y: number }>,
  nodeSizes: Map<string, number>
): Map<string, LabelPos> {
  const labelPositions = new Map<string, LabelPos>()

  const offsets: { dx: number; dy: number; anchor: 'start' | 'middle' | 'end' }[] = [
    { dx: 0, dy: 24, anchor: 'middle' },
    { dx: 0, dy: -20, anchor: 'middle' },
    { dx: 26, dy: 4, anchor: 'start' },
    { dx: -26, dy: 4, anchor: 'end' },
    { dx: 20, dy: 20, anchor: 'start' },
    { dx: -20, dy: 20, anchor: 'end' },
    { dx: 20, dy: -16, anchor: 'start' },
    { dx: -20, dy: -16, anchor: 'end' },
  ]

  const placedLabels: { x: number; y: number; width: number; height: number }[] = []

  for (const ln of layoutNodes) {
    const pos = nodePositions.get(ln.id)
    if (!pos) continue

    const labelWidth = ln.node.label.length * 6.5
    const labelHeight = 14
    const nodeSize = nodeSizes.get(ln.id) || 12

    let bestOffset = offsets[0]
    for (const offset of offsets) {
      const labelX = pos.x + offset.dx
      const labelY = pos.y + offset.dy + (offset.dy > 0 ? nodeSize - 12 : nodeSize > 12 ? -4 : 0)

      const overlaps = placedLabels.some(placed =>
        Math.abs(labelX - placed.x) < (labelWidth + placed.width) / 2 + 8 &&
        Math.abs(labelY - placed.y) < (labelHeight + placed.height) / 2 + 4
      )

      if (!overlaps) {
        bestOffset = offset
        break
      }
    }

    const finalX = pos.x + bestOffset.dx
    const finalY = pos.y + bestOffset.dy + (bestOffset.dy > 0 ? nodeSize - 12 : 0)

    labelPositions.set(ln.id, { x: finalX, y: finalY, anchor: bestOffset.anchor })
    placedLabels.push({ x: finalX, y: finalY, width: labelWidth, height: labelHeight })
  }

  return labelPositions
}

// Node shape renderer
function renderNodeShape(
  type: NodeType,
  cx: number,
  cy: number,
  size: number,
  fill: string,
  isSelected: boolean
): JSX.Element {
  const stroke = isSelected ? '#3b82f6' : 'white'
  const strokeWidth = isSelected ? 3 : 1.5

  switch (type) {
    case 'disease':
      return (
        <g>
          <circle cx={cx} cy={cy} r={size + 6} fill="none" stroke={fill} strokeWidth={2} opacity={0.3} />
          <circle cx={cx} cy={cy} r={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </g>
      )

    case 'biomarker':
      const diamondPoints = [
        [cx, cy - size],
        [cx + size, cy],
        [cx, cy + size],
        [cx - size, cy]
      ].map(p => p.join(',')).join(' ')
      return <polygon points={diamondPoints} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />

    case 'lifestyle':
      return (
        <rect
          x={cx - size} y={cy - size * 0.6}
          width={size * 2} height={size * 1.2}
          rx={size * 0.6} ry={size * 0.6}
          fill={fill} stroke={stroke} strokeWidth={strokeWidth}
        />
      )

    case 'medication':
      return (
        <rect
          x={cx - size * 0.85} y={cy - size * 0.85}
          width={size * 1.7} height={size * 1.7}
          rx={4} ry={4}
          fill={fill} stroke={stroke} strokeWidth={strokeWidth}
        />
      )

    case 'demographic':
      const hexPoints = Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 6
        return [cx + size * Math.cos(angle), cy + size * Math.sin(angle)]
      }).map(p => p.join(',')).join(' ')
      return <polygon points={hexPoints} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />

    default:
      return <circle cx={cx} cy={cy} r={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
  }
}

export default function KnowledgeGraphPage() {
  const [mounted, setMounted] = useState(false)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<KGEdge | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<KGEdge | null>(null)
  const [domainFilter, setDomainFilter] = useState<ClinicalDomain | 'All'>('All')
  const [gradeFilter, setGradeFilter] = useState<EvidenceGrade | 'All'>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [zoom, setZoom] = useState(1)
  const [layoutMode, setLayoutMode] = useState<'force' | 'hierarchical'>('force')

  useEffect(() => { setMounted(true) }, [])

  const allDomains = Object.keys(domainColors) as ClinicalDomain[]

  // Filter edges
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

  // Get connected node IDs
  const filteredNodeIds = useMemo(() => {
    const ids = new Set<string>()
    for (const e of filteredEdges) {
      ids.add(e.source)
      ids.add(e.target)
    }
    return ids
  }, [filteredEdges])

  // Filter nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => filteredNodeIds.has(n.id))
  }, [filteredNodeIds])

  const nodeDegrees = useMemo(() => computeNodeDegrees(filteredEdges), [filteredEdges])

  const layoutNodes = useForceLayout(filteredNodes, filteredEdges, CANVAS_WIDTH, CANVAS_HEIGHT, layoutMode)

  const nodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>()
    for (const n of layoutNodes) map.set(n.id, { x: n.x, y: n.y })
    return map
  }, [layoutNodes])

  const nodeSizes = useMemo(() => {
    const sizes = new Map<string, number>()
    for (const ln of layoutNodes) {
      const baseSize = ln.node.type === 'disease' ? 16 : 11
      const degree = nodeDegrees.get(ln.id) || 1
      sizes.set(ln.id, baseSize + Math.min(degree / 3, 5))
    }
    return sizes
  }, [layoutNodes, nodeDegrees])

  const labelPositions = useMemo(() =>
    computeLabelPositions(layoutNodes, nodePositions, nodeSizes),
    [layoutNodes, nodePositions, nodeSizes]
  )

  const highlightedEdges = useMemo(() => {
    if (!selectedNode) return new Set<string>()
    const set = new Set<string>()
    for (const e of filteredEdges) {
      if (e.source === selectedNode || e.target === selectedNode) set.add(e.id)
    }
    return set
  }, [selectedNode, filteredEdges])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-clinical-500">Loading graph...</div>
      </div>
    )
  }

  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : null
  const selectedNodeEdges = selectedNode ? edges.filter(e => e.source === selectedNode || e.target === selectedNode) : []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Knowledge Graph Explorer</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Interactive causal knowledge graph — {nodes.length} nodes, {edges.length} edges
        </p>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          {allDomains.map(d => (
            <Button
              key={d}
              variant={domainFilter === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDomainFilter(domainFilter === d ? 'All' : d)}
              style={domainFilter === d ? { backgroundColor: domainColors[d] } : undefined}
              className="text-xs"
            >
              {d.split(' ')[0]}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={gradeFilter}
            onChange={e => setGradeFilter(e.target.value as EvidenceGrade | 'All')}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
          >
            <option value="All">All Grades</option>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="D">Grade D</option>
          </select>
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="h-9 w-36 rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
        </div>

        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLayoutMode(m => m === 'force' ? 'hierarchical' : 'force')}
            className="flex items-center gap-1"
          >
            {layoutMode === 'force' ? <Layers className="h-4 w-4" /> : <Network className="h-4 w-4" />}
            {layoutMode === 'force' ? 'Hierarchical' : 'Force'}
          </Button>
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(z + 0.2, 2))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => { setZoom(1); setSelectedNode(null); setSelectedEdge(null) }}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Graph */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative" style={{ height: '650px' }}>
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
                  preserveAspectRatio="xMidYMid meet"
                  className="bg-slate-50/50 dark:bg-slate-900/50"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                  onClick={() => { setSelectedNode(null); setSelectedEdge(null) }}
                >
                  {/* Edges - Curved Bezier */}
                  {filteredEdges.map(edge => {
                    const sourcePos = nodePositions.get(edge.source)
                    const targetPos = nodePositions.get(edge.target)
                    if (!sourcePos || !targetPos) return null

                    const isHighlighted = highlightedEdges.has(edge.id)

                    // Curved edge with Bezier
                    const dx = targetPos.x - sourcePos.x
                    const dy = targetPos.y - sourcePos.y
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1

                    // Control point perpendicular to line
                    const mx = (sourcePos.x + targetPos.x) / 2
                    const my = (sourcePos.y + targetPos.y) / 2
                    const perpX = -dy / dist
                    const perpY = dx / dist

                    // Curvature based on weight
                    const curvature = 15 + Math.abs(edge.weight) * 25
                    const direction = parseInt(edge.id.slice(1)) % 2 === 0 ? 1 : -1
                    const ctrlX = mx + perpX * curvature * direction
                    const ctrlY = my + perpY * curvature * direction

                    const pathD = `M ${sourcePos.x} ${sourcePos.y} Q ${ctrlX} ${ctrlY} ${targetPos.x} ${targetPos.y}`

                    const baseOpacity = selectedNode
                      ? (isHighlighted ? 0.9 : 0.06)
                      : 0.25 + Math.abs(edge.weight) * 0.45

                    const strokeWidth = 1 + Math.abs(edge.weight) * 4
                    const edgeColor = edge.weight > 0 ? '#EF4444' : '#22C55E'

                    return (
                      <g key={edge.id}>
                        {/* Invisible wider hit area */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke="transparent"
                          strokeWidth={strokeWidth + 10}
                          onMouseEnter={() => setHoveredEdge(edge)}
                          onMouseLeave={() => setHoveredEdge(null)}
                          onClick={(e) => { e.stopPropagation(); setSelectedEdge(edge); setSelectedNode(null) }}
                          className="cursor-pointer"
                        />
                        {/* Visible edge */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke={edgeColor}
                          strokeWidth={strokeWidth}
                          opacity={baseOpacity}
                          strokeLinecap="round"
                        />
                        {/* Arrowhead for highlighted edges */}
                        {isHighlighted && (() => {
                          const tangentX = targetPos.x - ctrlX
                          const tangentY = targetPos.y - ctrlY
                          const tLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY) || 1
                          const nx = tangentX / tLen
                          const ny = tangentY / tLen

                          const targetSize = nodeSizes.get(edge.target) || 12
                          const arrowSize = 8
                          const tipX = targetPos.x - nx * (targetSize + 4)
                          const tipY = targetPos.y - ny * (targetSize + 4)

                          const points = [
                            [tipX, tipY],
                            [tipX - nx * arrowSize + ny * arrowSize/2, tipY - ny * arrowSize - nx * arrowSize/2],
                            [tipX - nx * arrowSize - ny * arrowSize/2, tipY - ny * arrowSize + nx * arrowSize/2]
                          ].map(p => p.join(',')).join(' ')

                          return <polygon points={points} fill={edgeColor} opacity={0.9} />
                        })()}
                      </g>
                    )
                  })}

                  {/* Nodes */}
                  {layoutNodes.map(ln => {
                    const pos = nodePositions.get(ln.id)
                    if (!pos) return null

                    const isSelected = selectedNode === ln.id
                    const isConnected = selectedNode
                      ? highlightedEdges.size > 0 && edges.some(e =>
                          (e.source === selectedNode && e.target === ln.id) ||
                          (e.target === selectedNode && e.source === ln.id)
                        )
                      : true
                    const opacity = selectedNode ? (isSelected || isConnected ? 1 : 0.15) : 1
                    const size = nodeSizes.get(ln.id) || 12
                    const color = domainColors[ln.node.domain] || '#6B7280'

                    return (
                      <g
                        key={ln.id}
                        onClick={(e) => { e.stopPropagation(); setSelectedNode(isSelected ? null : ln.id); setSelectedEdge(null) }}
                        className="cursor-pointer"
                        opacity={opacity}
                      >
                        {renderNodeShape(ln.node.type, pos.x, pos.y, size, color, isSelected)}
                      </g>
                    )
                  })}

                  {/* Labels */}
                  {layoutNodes.map(ln => {
                    const labelPos = labelPositions.get(ln.id)
                    if (!labelPos) return null

                    const isSelected = selectedNode === ln.id
                    const isConnected = selectedNode
                      ? highlightedEdges.size > 0 && edges.some(e =>
                          (e.source === selectedNode && e.target === ln.id) ||
                          (e.target === selectedNode && e.source === ln.id)
                        )
                      : true
                    const opacity = selectedNode ? (isSelected || isConnected ? 1 : 0.15) : 1
                    const labelWidth = ln.node.label.length * 6.5 + 8

                    return (
                      <g key={`label-${ln.id}`} className="pointer-events-none" opacity={opacity}>
                        <rect
                          x={labelPos.x - (labelPos.anchor === 'middle' ? labelWidth / 2 :
                              labelPos.anchor === 'end' ? labelWidth - 4 : -4)}
                          y={labelPos.y - 10}
                          width={labelWidth}
                          height={16}
                          rx={4}
                          fill="white"
                          fillOpacity={0.88}
                          className="dark:fill-slate-800"
                        />
                        <text
                          x={labelPos.x}
                          y={labelPos.y}
                          textAnchor={labelPos.anchor}
                          dominantBaseline="middle"
                          fontSize={10}
                          fill="#374151"
                          className="dark:fill-slate-200 select-none"
                          fontWeight={isSelected ? 700 : 500}
                        >
                          {ln.node.label}
                        </text>
                      </g>
                    )
                  })}
                </svg>

                {/* Edge tooltip */}
                {hoveredEdge && (
                  <div className="absolute top-4 left-4 bg-slate-800 text-white p-3 rounded-lg shadow-xl text-xs max-w-xs z-10">
                    <div className="font-semibold">
                      {nodes.find(n => n.id === hoveredEdge.source)?.label} → {nodes.find(n => n.id === hoveredEdge.target)?.label}
                    </div>
                    <div>
                      Weight: <span className={hoveredEdge.weight > 0 ? 'text-red-400' : 'text-green-400'}>
                        {hoveredEdge.weight > 0 ? '+' : ''}{hoveredEdge.weight.toFixed(2)}
                      </span>
                    </div>
                    <div>95% CI: [{hoveredEdge.ci[0].toFixed(2)}, {hoveredEdge.ci[1].toFixed(2)}]</div>
                    <div>Evidence: Grade {hoveredEdge.evidenceGrade}</div>
                    <div className="mt-1 text-slate-300">{hoveredEdge.description}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Legend */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <div className="font-medium mb-1">Domains</div>
                {allDomains.slice(0, 5).map(d => (
                  <div key={d} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: domainColors[d] }} />
                    <span className="truncate">{d}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="font-medium mb-1">Node Shapes</div>
                <div className="flex items-center gap-2"><span className="text-lg">●</span><span>Disease</span></div>
                <div className="flex items-center gap-2"><span className="text-lg">◆</span><span>Biomarker</span></div>
                <div className="flex items-center gap-2"><span className="text-sm">▬</span><span>Lifestyle</span></div>
                <div className="flex items-center gap-2"><span className="text-lg">■</span><span>Medication</span></div>
                <div className="flex items-center gap-2"><span className="text-lg">⬡</span><span>Demographic</span></div>
              </div>
              <div>
                <div className="font-medium mb-1">Edge Colors</div>
                <div className="flex items-center gap-2"><div className="w-6 h-0.5 bg-red-500" /><span>Risk (+)</span></div>
                <div className="flex items-center gap-2"><div className="w-6 h-0.5 bg-green-500" /><span>Protective (−)</span></div>
              </div>
              <div className="text-slate-400">
                Edge thickness = weight strength
              </div>
            </CardContent>
          </Card>

          {/* Selected Node */}
          {selectedNodeData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4" /> {selectedNodeData.label}
                </CardTitle>
                <CardDescription className="text-xs">{selectedNodeData.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div><span className="font-medium">Type:</span> {selectedNodeData.type}</div>
                <div><span className="font-medium">Domain:</span> {selectedNodeData.domain}</div>
                {selectedNodeData.unit && <div><span className="font-medium">Unit:</span> {selectedNodeData.unit}</div>}
                {selectedNodeData.normalRange && (
                  <div><span className="font-medium">Normal:</span> {selectedNodeData.normalRange.min}–{selectedNodeData.normalRange.max}</div>
                )}
                <div className="font-medium mt-2">Connected Edges ({selectedNodeEdges.length}):</div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {selectedNodeEdges.map(e => (
                    <button
                      key={e.id}
                      onClick={() => { setSelectedEdge(e); setSelectedNode(null) }}
                      className="w-full text-left p-2 rounded bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <div className="flex items-center gap-1">
                        <span>{e.source === selectedNode ? '→' : '←'}</span>
                        <span className="font-medium">{e.source === selectedNode ? nodes.find(n => n.id === e.target)?.label : nodes.find(n => n.id === e.source)?.label}</span>
                        <span className={cn('ml-auto font-mono', e.weight > 0 ? 'text-red-500' : 'text-green-600')}>
                          {e.weight > 0 ? '+' : ''}{e.weight.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-slate-400 mt-0.5">Grade {e.evidenceGrade}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected Edge */}
          {selectedEdge && !selectedNodeData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Edge Detail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{nodes.find(n => n.id === selectedEdge.source)?.label}</span>
                  <span className={cn('font-mono', selectedEdge.weight > 0 ? 'text-red-500' : 'text-green-500')}>
                    → {selectedEdge.weight > 0 ? '+' : ''}{selectedEdge.weight.toFixed(3)} →
                  </span>
                  <span className="font-semibold">{nodes.find(n => n.id === selectedEdge.target)?.label}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">{selectedEdge.description}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-700/50">
                    <div className="text-[10px] text-slate-400">Weight</div>
                    <div className="font-bold">{selectedEdge.weight.toFixed(3)}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-700/50">
                    <div className="text-[10px] text-slate-400">95% CI</div>
                    <div className="font-bold">[{selectedEdge.ci[0].toFixed(2)}, {selectedEdge.ci[1].toFixed(2)}]</div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-700/50">
                    <div className="text-[10px] text-slate-400">Evidence</div>
                    <div className="font-bold">Grade {selectedEdge.evidenceGrade}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-700/50">
                    <div className="text-[10px] text-slate-400">Bradford Hill</div>
                    <div className="font-bold">{selectedEdge.bradfordHill?.toFixed(1) || 'N/A'}/9</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card>
            <CardContent className="pt-6 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">Total Nodes</span><span className="font-medium">{nodes.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Total Edges</span><span className="font-medium">{edges.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Visible Nodes</span><span className="font-medium">{filteredNodes.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Visible Edges</span><span className="font-medium">{filteredEdges.length}</span></div>
              <div className="flex justify-between pt-2 border-t"><span className="text-slate-500">Layout Mode</span><span className="font-medium capitalize">{layoutMode}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
