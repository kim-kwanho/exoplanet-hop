import { buildKdTree, radiusQuery, type KdPoint } from './kdtree'
import { distance, type Vec3 } from './units'

export type Body = {
  id: string
  name: string
  pos: Vec3
  kind: 'earth' | 'host' | 'synthetic'
  datasetId: string
}

export type PqRow = { id: string; distYr: number }

export type Leg = {
  from: string
  to: string
  distLy: number
  travelYr: number
  stopYr: number
  costYr: number
}

export type PathResult = {
  nodeIds: string[]
  legs: Leg[]
  totalYr: number
  hops: number
}

export type SimEvent =
  | { type: 'ready'; pq: PqRow[] }
  | { type: 'pop'; nodeId: string; distYr: number; pq: PqRow[] }
  | { type: 'settle'; nodeId: string; pq: PqRow[] }
  | {
      type: 'query'
      nodeId: string
      center: Vec3
      radius: number
      hitIds: string[]
      visitedKdNodes: number
      pq: PqRow[]
    }
  | {
      type: 'relax'
      from: string
      to: string
      travelYr: number
      stopYr: number
      candidateYr: number
      oldDist: number | null
      updated: boolean
      pq: PqRow[]
    }
  | { type: 'done'; path: PathResult; pq: PqRow[] }
  | { type: 'unreachable'; settledCount: number; pq: PqRow[] }

export type SimParams = {
  X: number
  speedC: number
  stopYr: number
  startId: string
  destId: string
}

class MinHeap {
  private a: { dist: number; id: string }[] = []

  push(dist: number, id: string) {
    this.a.push({ dist, id })
    this.bubble(this.a.length - 1)
  }

  pop() {
    if (this.a.length === 0) return undefined
    const top = this.a[0]
    const last = this.a.pop()
    if (this.a.length > 0 && last) {
      this.a[0] = last
      this.sink(0)
    }
    return top
  }

  private less(i: number, j: number) {
    const a = this.a[i]
    const b = this.a[j]
    if (a.dist !== b.dist) return a.dist < b.dist
    return a.id < b.id
  }

  private bubble(i: number) {
    while (i > 0) {
      const p = (i - 1) >> 1
      if (!this.less(i, p)) break
      ;[this.a[i], this.a[p]] = [this.a[p], this.a[i]]
      i = p
    }
  }

  private sink(i: number) {
    const n = this.a.length
    for (;;) {
      let s = i
      const l = i * 2 + 1
      const r = l + 1
      if (l < n && this.less(l, s)) s = l
      if (r < n && this.less(r, s)) s = r
      if (s === i) break
      ;[this.a[i], this.a[s]] = [this.a[s], this.a[i]]
      i = s
    }
  }
}

function snapshot(best: Map<string, number>, settled: Set<string>): PqRow[] {
  const rows: PqRow[] = []
  for (const [id, distYr] of best) {
    if (!settled.has(id) && Number.isFinite(distYr)) rows.push({ id, distYr })
  }
  rows.sort((a, b) => a.distYr - b.distYr || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  return rows.slice(0, 12)
}

function rebuildPath(
  bodies: Map<string, Body>,
  prev: Map<string, string>,
  destId: string,
  totalYr: number,
  speedC: number,
  stopYr: number,
): PathResult {
  const nodeIds: string[] = [destId]
  let cur = destId
  while (prev.has(cur)) {
    cur = prev.get(cur)!
    nodeIds.push(cur)
  }
  nodeIds.reverse()
  const legs: Leg[] = []
  for (let i = 0; i < nodeIds.length - 1; i++) {
    const u = bodies.get(nodeIds[i])!
    const v = bodies.get(nodeIds[i + 1])!
    const distLy = distance(u.pos, v.pos)
    const travelYr = distLy / speedC
    const stop = u.kind === 'earth' ? 0 : stopYr
    legs.push({ from: u.id, to: v.id, distLy, travelYr, stopYr: stop, costYr: travelYr + stop })
  }
  return { nodeIds, legs, totalYr, hops: legs.length }
}

export function simulate(bodies: Body[], params: SimParams): SimEvent[] {
  const byId = new Map(bodies.map((b) => [b.id, b]))
  const points: KdPoint[] = bodies.filter((b) => b.kind !== 'earth').map((b) => ({ id: b.id, pos: b.pos }))
  const tree = buildKdTree(points)
  const best = new Map<string, number>()
  const prev = new Map<string, string>()
  best.set(params.startId, 0)
  const heap = new MinHeap()
  heap.push(0, params.startId)
  const settled = new Set<string>()
  const events: SimEvent[] = [{ type: 'ready', pq: snapshot(best, settled) }]

  for (let guard = 0; guard < 50000; guard++) {
    const item = heap.pop()
    if (!item) {
      events.push({ type: 'unreachable', settledCount: settled.size, pq: snapshot(best, settled) })
      return events
    }
    if (settled.has(item.id)) continue
    const known = best.get(item.id)
    if (known === undefined || item.dist > known + 1e-6) continue

    events.push({ type: 'pop', nodeId: item.id, distYr: known, pq: snapshot(best, settled) })
    settled.add(item.id)
    events.push({ type: 'settle', nodeId: item.id, pq: snapshot(best, settled) })

    if (item.id === params.destId) {
      events.push({
        type: 'done',
        path: rebuildPath(byId, prev, params.destId, known, params.speedC, params.stopYr),
        pq: snapshot(best, settled),
      })
      return events
    }

    const u = byId.get(item.id)
    if (!u) continue
    const queried = radiusQuery(tree, u.pos, params.X)
    const hitIds = queried.hitIds.filter((id) => id !== item.id)
    events.push({
      type: 'query',
      nodeId: item.id,
      center: u.pos,
      radius: params.X,
      hitIds,
      visitedKdNodes: queried.visitedKdNodes,
      pq: snapshot(best, settled),
    })

    const stop = u.kind === 'earth' ? 0 : params.stopYr
    for (const vid of hitIds) {
      if (settled.has(vid)) continue
      const v = byId.get(vid)
      if (!v) continue
      const distLy = distance(u.pos, v.pos)
      if (distLy > params.X + 1e-8) continue
      const travelYr = distLy / params.speedC
      const candidateYr = known + stop + travelYr
      const old = best.get(vid)
      const updated = old === undefined || candidateYr + 1e-9 < old
      if (updated) {
        best.set(vid, candidateYr)
        prev.set(vid, item.id)
        heap.push(candidateYr, vid)
      }
      events.push({
        type: 'relax',
        from: item.id,
        to: vid,
        travelYr,
        stopYr: stop,
        candidateYr,
        oldDist: old ?? null,
        updated,
        pq: snapshot(best, settled),
      })
    }
  }

  events.push({ type: 'unreachable', settledCount: settled.size, pq: snapshot(best, settled) })
  return events
}

/** 이벤트 로그 없이 같은 비용 규칙으로 목적지 도착 시각만 구한다. */
export function bruteDestYears(bodies: Body[], params: SimParams): number | null {
  const ids = bodies.map((b) => b.id)
  const byId = new Map(bodies.map((b) => [b.id, b]))
  const best = new Map<string, number>(ids.map((id) => [id, Number.POSITIVE_INFINITY]))
  best.set(params.startId, 0)
  const settled = new Set<string>()

  while (settled.size < ids.length) {
    let pick: string | null = null
    for (const id of ids) {
      if (settled.has(id) || !Number.isFinite(best.get(id)!)) continue
      if (
        pick === null ||
        best.get(id)! < best.get(pick)! - 1e-9 ||
        (Math.abs(best.get(id)! - best.get(pick)!) <= 1e-9 && id < pick)
      ) {
        pick = id
      }
    }
    if (pick === null) break
    settled.add(pick)
    if (pick === params.destId) return best.get(pick)!
    const u = byId.get(pick)!
    const stop = u.kind === 'earth' ? 0 : params.stopYr
    for (const v of bodies) {
      if (v.kind === 'earth' || v.id === u.id) continue
      const distLy = distance(u.pos, v.pos)
      if (distLy > params.X + 1e-8) continue
      const cand = best.get(u.id)! + stop + distLy / params.speedC
      if (cand + 1e-9 < best.get(v.id)!) best.set(v.id, cand)
    }
  }
  return null
}

export function suggestRadius(bodies: Body[], params: SimParams, max = 40): number | null {
  let lo = 0
  let hi = max
  let found = false
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2
    const last = simulate(bodies, { ...params, X: mid }).at(-1)
    if (last?.type === 'done') {
      found = true
      hi = mid
    } else lo = mid
  }
  return found ? Math.ceil(hi * 10) / 10 : null
}
