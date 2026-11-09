import { useSimulationStore } from '../store/useSimulationStore'

export function IconRail() {
  const layersOpen = useSimulationStore((s) => s.layersOpen)
  const toggleLayers = useSimulationStore((s) => s.toggleLayers)
  const requestReset = useSimulationStore((s) => s.requestReset)
  const toggleAbout = useSimulationStore((s) => s.toggleAbout)
  const showRadius = useSimulationStore((s) => s.showRadius)
  const showPath = useSimulationStore((s) => s.showPath)
  const showGrid = useSimulationStore((s) => s.showGrid)
  const showLabels = useSimulationStore((s) => s.showLabels)
  const setLayer = useSimulationStore((s) => s.setLayer)

  return (
    <div className="rail">
      <button type="button" className="icon" onClick={toggleLayers} aria-label="레이어">
        ▤
      </button>
      {layersOpen && (
        <div className="layers">
          <Check label="반경 구" on={showRadius} set={(v) => setLayer('showRadius', v)} />
          <Check label="경로" on={showPath} set={(v) => setLayer('showPath', v)} />
          <Check label="모든 라벨" on={showLabels} set={(v) => setLayer('showLabels', v)} />
          <Check label="격자" on={showGrid} set={(v) => setLayer('showGrid', v)} />
        </div>
      )}
      <button type="button" className="icon" title="작동 원리" aria-label="작동 원리" onClick={toggleAbout}>
        ?
      </button>
      <button type="button" className="icon" title="시점 초기화 (R)" aria-label="시점 초기화" onClick={requestReset}>
        ⟲
      </button>
    </div>
  )
}

function Check({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <label className="check">
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} />
      {label}
    </label>
  )
}
