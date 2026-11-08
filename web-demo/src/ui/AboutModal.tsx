import { useSimulationStore } from '../store/useSimulationStore'

export function AboutModal() {
  const open = useSimulationStore((s) => s.about)
  const toggle = useSimulationStore((s) => s.toggleAbout)
  const meta = useSimulationStore((s) => s.meta)
  if (!open) return null
  return (
    <div className="modal-back" onClick={toggle}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>EXOPLANET HOP</h2>
        <p>
          별 좌표는 고정되어 있고, 한 번에 X 광년 안의 별만 이동할 수 있습니다. 이동 시간은 거리 ÷ 속도이고, 지구가
          아닌 별을 떠날 때 기착 시간이 붙습니다. 목적지에 도착하면 탐색이 끝납니다.
        </p>
        <p>
          다음에 확정되는 별은 지금 별에서 가장 가까운 별이 아니라, 지금까지 누적 도착 시간이 가장 짧은 별입니다.
        </p>
        <p className="muted">
          {meta.name} · {meta.retrievedAt} · {meta.citation}. 프레임 {meta.frame}, 단위 {meta.unit}.
          {meta.seed !== undefined ? ` 시드 ${meta.seed}.` : ''} {meta.subsetRule ?? ''}
        </p>
        <button type="button" className="primary" onClick={toggle}>
          닫기
        </button>
      </div>
    </div>
  )
}
