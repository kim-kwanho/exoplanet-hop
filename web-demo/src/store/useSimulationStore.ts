import { create } from 'zustand'
import { deriveView, type ViewState } from '../core/deriveView'
import { simulate, type Body, type SimEvent } from '../core/dijkstraSimulator'
import hosts from '../data/exoplanet-hosts.json'
import synthetic from '../data/synthetic-stars.json'

export type DatasetId = 'hosts' | 'sandbox'
export type ShipSkin = 'classic' | 'snoopy' | 'pat'

type DatasetFile = {
  metadata: {
    name: string
    source: string
    sourceUrl?: string
    retrievedAt: string
    citation: string
    frame: string
    unit: string
    isSynthetic: boolean
    seed?: number
    starCount: number
    bounds: { min: number[]; max: number[] }
    subsetRule?: string
  }
  scenario: { datasetId: string; startId: string; destId: string; X: number; speedC: number; stopYr: number }
  bodies: Body[]
}

const DATASETS: Record<DatasetId, DatasetFile> = {
  hosts: hosts as DatasetFile,
  sandbox: synthetic as DatasetFile,
}

type Store = {
  datasetId: DatasetId
  bodies: Body[]
  meta: DatasetFile['metadata']
  X: number
  speedC: number
  stopYr: number
  destId: string
  events: SimEvent[]
  index: number
  playing: boolean
  rate: number
  about: boolean
  intro: boolean
  showRadius: boolean
  showPath: boolean
  showGrid: boolean
  showLabels: boolean
  layersOpen: boolean
  scenarioOpen: boolean
  resetCam: number
  focusCam: number
  camZoomed: boolean
  flightNonce: number
  shipSkin: ShipSkin
  setDataset: (id: DatasetId) => void
  setX: (n: number) => void
  setSpeed: (n: number) => void
  setStop: (n: number) => void
  setDest: (id: string) => void
  setShipSkin: (skin: ShipSkin) => void
  step: (d: number) => void
  toStart: () => void
  toEnd: () => void
  togglePlay: () => void
  cycleRate: () => void
  toggleAbout: () => void
  start: () => void
  requestReset: () => void
  requestFocus: () => void
  markCamZoomed: () => void
  replayFlight: () => void
  toggleScenario: () => void
  toggleLayers: () => void
  setLayer: (key: 'showRadius' | 'showPath' | 'showGrid' | 'showLabels', value: boolean) => void
}

const initial = load('sandbox')

function load(id: DatasetId) {
  const data = DATASETS[id]
  const bodies = data.bodies
  return {
    datasetId: id,
    bodies,
    meta: data.metadata,
    X: data.scenario.X,
    speedC: data.scenario.speedC,
    stopYr: data.scenario.stopYr,
    destId: data.scenario.destId,
    events: simulate(bodies, {
      X: data.scenario.X,
      speedC: data.scenario.speedC,
      stopYr: data.scenario.stopYr,
      startId: 'earth_sol',
      destId: data.scenario.destId,
    }),
    index: 0,
    playing: false,
  }
}

function run(bodies: Body[], X: number, speedC: number, stopYr: number, destId: string): SimEvent[] {
  return simulate(bodies, { X, speedC, stopYr, startId: 'earth_sol', destId })
}

const HIDE_HOW_KEY = 'exo-hop-hide-how'

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export function hideHowToday() {
  localStorage.setItem(HIDE_HOW_KEY, todayKey())
}

function howHiddenToday() {
  return localStorage.getItem(HIDE_HOW_KEY) === todayKey()
}

export const useSimulationStore = create<Store>((set, get) => ({
  ...initial,
  index: 0,
  playing: false,
  rate: 1,
  about: false,
  intro: true,
  showRadius: true,
  showPath: true,
  showGrid: false,
  showLabels: false,
  layersOpen: false,
  scenarioOpen: true,
  resetCam: 0,
  focusCam: 0,
  camZoomed: false,
  flightNonce: 0,
  shipSkin: 'classic',
  setDataset: (id) => set({ ...load(id), flightNonce: get().flightNonce + 1, camZoomed: false }),
  setShipSkin: (shipSkin) => set({ shipSkin }),
  setX: (X) => {
    const s = get()
    set({ X, events: run(s.bodies, X, s.speedC, s.stopYr, s.destId), index: 0, playing: false })
  },
  setSpeed: (speedC) => {
    const s = get()
    set({ speedC, events: run(s.bodies, s.X, speedC, s.stopYr, s.destId), index: 0, playing: false })
  },
  setStop: (stopYr) => {
    const s = get()
    set({ stopYr, events: run(s.bodies, s.X, s.speedC, stopYr, s.destId), index: 0, playing: false })
  },
  setDest: (destId) => {
    const s = get()
    set({ destId, events: run(s.bodies, s.X, s.speedC, s.stopYr, destId), index: 0, playing: false })
  },
  step: (d) => {
    const s = get()
    const index = Math.max(0, Math.min(s.events.length - 1, s.index + d))
    set({ index, playing: index >= s.events.length - 1 ? false : s.playing })
  },
  toStart: () => set({ index: 0, playing: false, resetCam: get().resetCam + 1 }),
  toEnd: () => set({ index: get().events.length - 1, playing: false }),
  togglePlay: () => {
    const s = get()
    if (s.index >= s.events.length - 1) set({ index: 0, playing: true })
    else set({ playing: !s.playing })
  },
  cycleRate: () => set({ rate: get().rate === 1 ? 2 : get().rate === 2 ? 4 : 1 }),
  toggleAbout: () => set({ about: !get().about }),
  start: () => set({ intro: false, about: !howHiddenToday() }),
  requestReset: () => set({ resetCam: get().resetCam + 1, camZoomed: false }),
  requestFocus: () => set({ focusCam: get().focusCam + 1, camZoomed: false }),
  markCamZoomed: () => {
    if (!get().camZoomed) set({ camZoomed: true })
  },
  replayFlight: () => set({ flightNonce: get().flightNonce + 1 }),
  toggleScenario: () => set({ scenarioOpen: !get().scenarioOpen }),
  toggleLayers: () => set({ layersOpen: !get().layersOpen }),
  setLayer: (key, value) => set({ [key]: value }),
}))

export function useView(): ViewState {
  const events = useSimulationStore((s) => s.events)
  const index = useSimulationStore((s) => s.index)
  return deriveView(events, index)
}
