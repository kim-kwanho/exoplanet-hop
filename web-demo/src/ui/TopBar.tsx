import { useSimulationStore } from '../store/useSimulationStore'

export function TopBar() {
  const X = useSimulationStore((s) => s.X)
  const speedC = useSimulationStore((s) => s.speedC)
  const meta = useSimulationStore((s) => s.meta)
  const toggleAbout = useSimulationStore((s) => s.toggleAbout)
  return (
    <header className="top">
      <div className="brand">
        <span className="logo" />
        EXOPLANET HOP
        <span className="pill">
          {meta.isSynthetic ? '샌드박스' : '호스트'} {meta.starCount} · {speedC.toFixed(1)}c · X {trim(X)} ly
        </span>
      </div>
      <div className="top-actions">
        <button type="button" className="ghost" onClick={toggleAbout}>
          정보
        </button>
      </div>
    </header>
  )
}

function trim(n: number) {
  return Number(n.toFixed(1)).toString()
}
