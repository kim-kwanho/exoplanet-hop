import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildHostDataset } from '../../scripts/build-hosts.mjs'
import { bruteDestYears, simulate, type Body, type SimParams } from './dijkstraSimulator'
import { buildKdTree, radiusQuery } from './kdtree'
import { distance, pcToLy } from './units'
import data from '../data/synthetic-stars.json'
import hosts from '../data/exoplanet-hosts.json'

const bodies = data.bodies as Body[]

describe('units', () => {
  it('pc to ly', () => {
    expect(pcToLy(1)).toBeCloseTo(3.261563777, 6)
  })
})

describe('k-d', () => {
  const points = bodies.filter((b) => b.kind !== 'earth').map((b) => ({ id: b.id, pos: b.pos }))
  const tree = buildKdTree(points)

  it('matches brute radius queries and excludes earth', () => {
    expect(points.some((p) => p.id === 'earth_sol')).toBe(false)
    const centers = [
      [0, 0, 0],
      [10, -4, 3],
      [30, 8, -6],
      [48, 0, 0],
    ] as const
    for (const c of centers) {
      for (const r of [3, 8, 12]) {
        const q = radiusQuery(tree, [...c], r)
        const brute = points
          .filter((p) => distance(p.pos, [...c]) <= r + 1e-8)
          .map((p) => p.id)
          .sort()
        expect(q.hitIds).toEqual(brute)
        expect(q.visitedKdNodes).toBeGreaterThan(0)
      }
    }
  })
})

describe('dijkstra', () => {
  const base: SimParams = {
    X: 8,
    speedC: 0.1,
    stopYr: 1,
    startId: 'earth_sol',
    destId: 'dest_a',
  }

  it('event log matches brute on synthetic X=8', () => {
    const events = simulate(bodies, base)
    const last = events[events.length - 1]
    expect(last.type).toBe('done')
    if (last.type !== 'done') return
    expect(last.path.totalYr).toBeCloseTo(bruteDestYears(bodies, base)!, 6)
    expect(last.path.nodeIds[0]).toBe('earth_sol')
    expect(last.path.nodeIds[last.path.nodeIds.length - 1]).toBe('dest_a')
    expect(last.path.legs[0].stopYr).toBe(0)
  })

  it('hand path S0-S1-S2 is 30 then 61 when direct hop is outside X', () => {
    const hand: Body[] = [
      { id: 'earth_sol', name: 'S0', pos: [0, 0, 0], kind: 'earth', datasetId: 'hand' },
      { id: 's1', name: 'S1', pos: [3, 0, 0], kind: 'synthetic', datasetId: 'hand' },
      { id: 's2', name: 'S2', pos: [6, 0, 0], kind: 'synthetic', datasetId: 'hand' },
    ]
    const params: SimParams = { X: 4, speedC: 0.1, stopYr: 1, startId: 'earth_sol', destId: 's2' }
    const events = simulate(hand, params)
    const settles = events.filter((e) => e.type === 'settle')
    expect(settles.map((e) => (e.type === 'settle' ? e.nodeId : ''))).toEqual(['earth_sol', 's1', 's2'])
    const pops = events.filter((e) => e.type === 'pop')
    const d1 = pops.find((e) => e.type === 'pop' && e.nodeId === 's1')
    const d2 = pops.find((e) => e.type === 'pop' && e.nodeId === 's2')
    expect(d1 && d1.type === 'pop' && d1.distYr).toBeCloseTo(30, 6)
    expect(d2 && d2.type === 'pop' && d2.distYr).toBeCloseTo(61, 6)
    const done = events[events.length - 1]
    expect(done.type).toBe('done')
    if (done.type === 'done') {
      expect(done.path.totalYr).toBeCloseTo(61, 6)
      expect(done.path.legs[done.path.legs.length - 1].stopYr).toBe(1)
    }
  })

  it('X=3 cannot reach dest', () => {
    const events = simulate(bodies, { ...base, X: 3 })
    expect(events[events.length - 1].type).toBe('unreachable')
    expect(bruteDestYears(bodies, { ...base, X: 3 })).toBeNull()
  })
})

describe('exoplanet hosts', () => {
  const route = [
    'earth_sol',
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

  it('converts the same snapshot twice into the same subset', () => {
    const csvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../data/raw/pscomppars_2026-11-05.csv')
    const csv = readFileSync(csvPath, 'utf8')
    expect(buildHostDataset(csv)).toEqual(buildHostDataset(csv))
  })

  it('reaches HD 199509 on the published route', () => {
    const catalog = hosts.bodies as Body[]
    expect(hosts.metadata.isSynthetic).toBe(false)
    expect(hosts.metadata.starCount).toBeGreaterThanOrEqual(200)
    expect(hosts.metadata.starCount).toBeLessThanOrEqual(500)
    const dest = catalog.find((b) => b.id === 'HD 199509') as Body & { syDistPc: number; ra: number; dec: number }
    const ly = pcToLy(dest.syDistPc)
    const dec = (dest.dec * Math.PI) / 180
    const ra = (dest.ra * Math.PI) / 180
    expect(dest.pos[2]).toBeCloseTo(Number((ly * Math.sin(dec)).toFixed(6)), 6)
    expect(dest.pos[0]).toBeCloseTo(Number((ly * Math.cos(dec) * Math.cos(ra)).toFixed(6)), 6)
    const events = simulate(catalog, { X: 15, speedC: 0.1, stopYr: 1, startId: 'earth_sol', destId: 'HD 199509' })
    const last = events[events.length - 1]
    expect(last.type).toBe('done')
    if (last.type !== 'done') return
    expect(last.path.nodeIds).toEqual(route)
    expect(last.path.totalYr).toBeCloseTo(1509.5325, 1)
    expect(last.path.legs[0].stopYr).toBe(0)
    expect(last.path.legs.at(-1)?.stopYr).toBe(1)
  })
})
