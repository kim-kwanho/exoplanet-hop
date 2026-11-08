import { useSimulationStore } from '../store/useSimulationStore'

export function TopBar() {
  const X = useSimulationStore((s) => s.X)
  const speedC = useSimulationStore((s) => s.speedC)
  const meta = useSimulationStore((s) => s.meta)
  return (
    <header className="top">
      <div className="brand">
        <span className="logo" />
        EXOPLANET HOP
        <span className="pill">
          {meta.isSynthetic ? '샌드박스' : '호스트'} {meta.starCount} · {speedC.toFixed(1)}c · X {trim(X)} ly
        </span>
      </div>
    </header>
  )
}

function trim(n: number) {
  return Number(n.toFixed(1)).toString()
}
