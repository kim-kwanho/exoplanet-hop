import { distance, type Vec3 } from './units'

export type KdPoint = { id: string; pos: Vec3 }

type Node = {
  id: string
  pos: Vec3
  axis: number
  left: Node | null
  right: Node | null
}

function build(points: KdPoint[], depth: number): Node | null {
  if (points.length === 0) return null
  const axis = depth % 3
  const sorted = points.slice().sort((a, b) => a.pos[axis] - b.pos[axis] || (a.id < b.id ? -1 : 1))
  const mid = Math.floor(sorted.length / 2)
  const p = sorted[mid]
  return {
    id: p.id,
    pos: p.pos,
    axis,
    left: build(sorted.slice(0, mid), depth + 1),
    right: build(sorted.slice(mid + 1), depth + 1),
  }
}

export function buildKdTree(points: KdPoint[]): Node | null {
  return build(points, 0)
}

export function radiusQuery(
  root: Node | null,
  center: Vec3,
  radius: number,
): { hitIds: string[]; visitedKdNodes: number } {
  const hitIds: string[] = []
  let visitedKdNodes = 0
  const r2 = radius * radius

  const walk = (node: Node | null) => {
    if (!node) return
    visitedKdNodes += 1
    const d = distance(node.pos, center)
    if (d * d <= r2 + 1e-8) hitIds.push(node.id)
    const diff = center[node.axis] - node.pos[node.axis]
    const near = diff < 0 ? node.left : node.right
    const far = diff < 0 ? node.right : node.left
    walk(near)
    if (diff * diff <= r2 + 1e-8) walk(far)
  }

  walk(root)
  hitIds.sort()
  return { hitIds, visitedKdNodes }
}
