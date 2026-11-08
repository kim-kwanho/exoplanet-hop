import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PC_TO_LY = 3.261563777
const X = 15
const TARGET_HOSTS = 300
const DEST = 'HD 199509'
const EXPECTED = [
  'Ross 128',
  'GJ 393',
  'GJ 357',
  'GJ 367',
  'L 98-59',
  'COCONUTS-2 A',
  'LHS 475',
  'HD 222237',
  'LHS 3844',
  'GJ 3021',
  'nu Oct A',
  'HD 199509',
]

export function buildHostDataset(csvText) {
  const rows = parseCsv(csvText)
  const grouped = new Map()
  for (const row of rows) {
    const host = row.hostname.trim()
    if (!host) continue
    const list = grouped.get(host)
    if (list) list.push(row)
    else grouped.set(host, [row])
  }

  const hosts = []
  for (const [hostname, records] of grouped) {
    const signatures = new Set(records.map((r) => `${r.ra}|${r.dec}|${r.sy_dist}`))
    if (signatures.size > 1) {
      throw new Error(`좌표가 충돌하는 호스트는 평균내지 않습니다: ${hostname}`)
    }
    const ra = num(records[0].ra)
    const dec = num(records[0].dec)
    const distPc = num(records[0].sy_dist)
    if (ra === null || dec === null || distPc === null || distPc < 0) continue
    const raRad = (ra * Math.PI) / 180
    const decRad = (dec * Math.PI) / 180
    const distLy = distPc * PC_TO_LY
    const cosDec = Math.cos(decRad)
    hosts.push({
      id: hostname,
      name: hostname,
      pos: [distLy * cosDec * Math.cos(raRad), distLy * cosDec * Math.sin(raRad), distLy * Math.sin(decRad)].map(round),
      ra,
      dec,
      syDistPc: distPc,
      planetCount: records.length,
      kind: 'host',
      datasetId: 'pscomppars-2026-11-05',
    })
  }
  hosts.sort((a, b) => (a.id < b.id ? -1 : 1))
  if (!hosts.some((h) => h.id === DEST)) throw new Error(`${DEST}가 유효 호스트에 없습니다.`)

  const adjacency = link(hosts, X)
  const component = reachable(hosts, adjacency, X)
  const route = routeTo(hosts, adjacency, component, DEST)
  if (route.map((i) => hosts[i].id).join('>') !== EXPECTED.join('>')) {
    throw new Error(`HD 199509 경로가 끊겼거나 달라졌습니다: ${route.map((i) => hosts[i].id).join(' → ')}`)
  }

  const selected = new Set(component)
  const ranked = hosts
    .map((host, index) => ({ index, gap: minGap(host, hosts, component) }))
    .filter((item) => !selected.has(item.index))
    .sort((a, b) => a.gap - b.gap || (hosts[a.index].id < hosts[b.index].id ? -1 : 1))
  for (const item of ranked) {
    if (selected.size >= TARGET_HOSTS) break
    selected.add(item.index)
  }
  if (selected.size < 200 || selected.size > 500) {
    throw new Error(`subset 크기가 200~500 밖입니다: ${selected.size}`)
  }
  if (!selected.has(hosts.findIndex((h) => h.id === DEST))) throw new Error('목적지가 subset에서 빠졌습니다.')

  const bodies = [...selected]
    .map((index) => hosts[index])
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .map(({ id, name, pos, ra, dec, syDistPc, planetCount, kind, datasetId }) => ({
      id,
      name,
      pos,
      ra,
      dec,
      syDistPc,
      planetCount,
      kind,
      datasetId,
    }))
  bodies.unshift({
    id: 'earth_sol',
    name: '지구',
    pos: [0, 0, 0],
    kind: 'earth',
    datasetId: 'pscomppars-2026-11-05',
  })

  let min = [Infinity, Infinity, Infinity]
  let max = [-Infinity, -Infinity, -Infinity]
  for (const body of bodies) {
    body.pos.forEach((n, axis) => {
      min[axis] = Math.min(min[axis], n)
      max[axis] = Math.max(max[axis], n)
    })
  }

  return {
    metadata: {
      name: '외계행성 호스트',
      source: 'NASA Exoplanet Archive pscomppars',
      sourceUrl:
        'https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=SELECT%20hostname%2C%20pl_name%2C%20ra%2C%20dec%2C%20sy_dist%2C%20sy_disterr1%2C%20sy_disterr2%20FROM%20pscomppars&format=csv',
      retrievedAt: '2026-11-05',
      citation: 'NASA Exoplanet Archive, Planetary Systems Composite Parameters',
      frame: 'icrs',
      unit: 'ly',
      isSynthetic: false,
      starCount: bodies.length - 1,
      bounds: { min, max },
      subsetRule: `X=${X} ly 지구 도달 성분 ${component.size}개 전체와, 성분에 가장 가까운 호스트를 이름 순으로 채워 ${bodies.length - 1}개.`,
    },
    scenario: {
      datasetId: 'pscomppars-2026-11-05',
      startId: 'earth_sol',
      destId: DEST,
      X,
      speedC: 0.1,
      stopYr: 1,
    },
    bodies,
  }
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/)
  const header = lines[0].split(',')
  const need = ['hostname', 'ra', 'dec', 'sy_dist']
  for (const key of need) if (!header.includes(key)) throw new Error(`CSV에 ${key} 열이 없습니다.`)
  return lines.slice(1).map((line) => {
    const cells = line.split(',')
    const row = {}
    header.forEach((key, i) => {
      row[key] = (cells[i] ?? '').replace(/^"|"$/g, '')
    })
    return row
  })
}

function num(value) {
  if (!value || !value.trim()) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function link(hosts, radius) {
  const width = radius
  const buckets = new Map()
  const adjacency = hosts.map(() => [])
  hosts.forEach((host, i) => {
    const cell = host.pos.map((n) => Math.floor(n / width))
    const key = cell.join(':')
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const near = buckets.get(`${cell[0] + dx}:${cell[1] + dy}:${cell[2] + dz}`) ?? []
          for (const j of near) {
            const d = gap(host.pos, hosts[j].pos)
            if (d <= radius + 1e-8) {
              adjacency[i].push(j)
              adjacency[j].push(i)
            }
          }
        }
      }
    }
    const list = buckets.get(key)
    if (list) list.push(i)
    else buckets.set(key, [i])
  })
  return adjacency
}

function reachable(hosts, adjacency, radius) {
  const seen = new Set(hosts.flatMap((host, i) => (Math.hypot(...host.pos) <= radius + 1e-8 ? [i] : [])))
  const queue = [...seen]
  while (queue.length) {
    const u = queue.shift()
    for (const v of adjacency[u]) {
      if (!seen.has(v)) {
        seen.add(v)
        queue.push(v)
      }
    }
  }
  return seen
}

function routeTo(hosts, adjacency, component, destId) {
  const dest = hosts.findIndex((h) => h.id === destId)
  const best = new Map()
  const prev = new Map()
  const heap = []
  hosts.forEach((host, i) => {
    const d = Math.hypot(...host.pos)
    if (d <= X + 1e-8) {
      best.set(i, d / 0.1)
      heap.push([d / 0.1, host.id, i])
    }
  })
  heap.sort(order)
  const settled = new Set()
  while (heap.length) {
    const [cost, , u] = heap.shift()
    if (settled.has(u) || cost > best.get(u) + 1e-6) continue
    settled.add(u)
    if (u === dest) break
    for (const v of adjacency[u]) {
      const proposal = cost + 1 + gap(hosts[u].pos, hosts[v].pos) / 0.1
      if (!best.has(v) || proposal + 1e-9 < best.get(v)) {
        best.set(v, proposal)
        prev.set(v, u)
        heap.push([proposal, hosts[v].id, v])
        heap.sort(order)
      }
    }
  }
  if (!component.has(dest) || !best.has(dest)) throw new Error(`${destId}에 도달할 수 없습니다.`)
  const route = []
  for (let cursor = dest; cursor !== undefined; cursor = prev.get(cursor)) route.push(cursor)
  route.reverse()
  return route
}

function order(a, b) {
  return a[0] - b[0] || (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0)
}

function minGap(host, hosts, component) {
  let best = Infinity
  for (const index of component) best = Math.min(best, gap(host.pos, hosts[index].pos))
  return best
}

function gap(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

function round(n) {
  return Number(n.toFixed(6))
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const dir = path.dirname(fileURLToPath(import.meta.url))
  const csv = readFileSync(path.resolve(dir, '../../data/raw/pscomppars_2026-11-05.csv'), 'utf8')
  const first = buildHostDataset(csv)
  const second = buildHostDataset(csv)
  const text = `${JSON.stringify(first, null, 2)}\n`
  if (text !== `${JSON.stringify(second, null, 2)}\n`) throw new Error('같은 CSV에서 JSON이 달라졌습니다.')
  writeFileSync(path.resolve(dir, '../src/data/exoplanet-hosts.json'), text)
  console.log(`${first.metadata.starCount} hosts, dest ${first.scenario.destId}`)
}
