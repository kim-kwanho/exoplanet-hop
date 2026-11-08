import type { PathResult, PqRow, SimEvent } from './dijkstraSimulator'
import type { Vec3 } from './units'

export type ViewState = {
  event: SimEvent
  currentId: string | null
  settled: Set<string>
  prev: Map<string, string>
  neighborIds: string[]
  showSphere: boolean
  sphereCenter: Vec3 | null
  sphereRadius: number
  relaxEdge: { from: string; to: string } | null
  path: PathResult | null
  unreachable: boolean
  pq: PqRow[]
}

export function deriveView(events: SimEvent[], index: number): ViewState {
  const i = Math.max(0, Math.min(index, events.length - 1))
  const settled = new Set<string>()
  const prev = new Map<string, string>()
  let currentId: string | null = null
  let neighborIds: string[] = []
  let sphereCenter: Vec3 | null = null
  let sphereRadius = 0
  let path: PathResult | null = null

  for (let k = 0; k <= i; k++) {
    const e = events[k]
    if (e.type === 'pop' || e.type === 'settle' || e.type === 'query') currentId = e.nodeId
    if (e.type === 'settle') settled.add(e.nodeId)
    if (e.type === 'query') {
      neighborIds = e.hitIds
      sphereCenter = e.center
      sphereRadius = e.radius
    }
    if (e.type === 'relax' && e.updated) prev.set(e.to, e.from)
    if (e.type === 'done') path = e.path
  }

  const event = events[i]
  const showSphere = event.type === 'query' || event.type === 'relax'
  return {
    event,
    currentId,
    settled,
    prev,
    neighborIds: showSphere ? neighborIds : [],
    showSphere,
    sphereCenter: showSphere ? sphereCenter : null,
    sphereRadius,
    relaxEdge: event.type === 'relax' ? { from: event.from, to: event.to } : null,
    path,
    unreachable: event.type === 'unreachable',
    pq: event.pq,
  }
}
