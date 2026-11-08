import { useMemo } from 'react'
import { suggestRadius } from '../core/dijkstraSimulator'
import { useSimulationStore, useView } from '../store/useSimulationStore'

export function InspectorPanel() {
  const view = useView()
  const X = useSimulationStore((s) => s.X)
  const speedC = useSimulationStore((s) => s.speedC)
  const stopYr = useSimulationStore((s) => s.stopYr)
  const destId = useSimulationStore((s) => s.destId)
  const bodies = useSimulationStore((s) => s.bodies)
  const setX = useSimulationStore((s) => s.setX)
  const replayFlight = useSimulationStore((s) => s.replayFlight)
  const hint = useMemo(() => {
    if (!view.unreachable) return null
    return suggestRadius(bodies, { X, speedC, stopYr, startId: 'earth_sol', destId })
  }, [view.unreachable, bodies, X, speedC, stopYr, destId])

  const e = view.event
  return (
    <aside className="panel right">
      <h3>{titleOf(e.type)}</h3>
      {e.type === 'pop' && (
        <div className="step">
          <strong>{nameOf(e.nodeId)}</strong>
          <b>도착 {fmt(e.distYr)}년</b>
        </div>
      )}
      {e.type === 'settle' && (
        <div className="step">
          <strong>{nameOf(e.nodeId)}</strong>
          <b>확정</b>
        </div>
      )}
      {e.type === 'query' && (
        <div className="step">
          <strong>{nameOf(e.nodeId)}</strong>
          <b>반경 {trim(e.radius)} ly</b>
        </div>
      )}
      {lineOf(e) && <p>{lineOf(e)}</p>}
      {e.type === 'relax' && (
        <p className="formula">
          {fmt(e.candidateYr - e.stopYr - e.travelYr)} + 기착 {fmt(e.stopYr)} + {fmt(e.travelYr)} = {fmt(e.candidateYr)}년
          {e.updated ? '' : ' · 갱신 없음'}
        </p>
      )}
      {e.type === 'query' && (
        <p className="muted">
          이웃 {e.hitIds.length} · k-d 방문 {e.visitedKdNodes}
        </p>
      )}
      {e.type === 'done' && (
        <>
          <p className="big">{fmt(e.path.totalYr)}년</p>
          <p className="muted">
            도약 {e.path.hops} · 기착 {e.path.legs.filter((l) => l.stopYr > 0).length}
          </p>
          <ul className="legs">
            <li>
              <span>{nameOf(e.path.nodeIds[0])}</span>
              <b>출발</b>
            </li>
            {e.path.legs.map((l) => (
              <li key={l.from + l.to}>
                <span>{nameOf(l.to)}</span>
                <b>{fmt(l.costYr)}년</b>
              </li>
            ))}
          </ul>
          <button type="button" className="primary wide" onClick={replayFlight}>
            경로 다시 재생
          </button>
        </>
      )}
      {view.unreachable && (
        <div className="alert">
          <p>목적지에 도달할 수 없어요. 반경 {trim(X)} ly 안에서 이어지는 별이 없습니다.</p>
          {hint !== null && (
            <button type="button" className="primary" onClick={() => setX(hint)}>
              X를 {trim(hint)} ly로 설정
            </button>
          )}
        </div>
      )}
      <h4>우선순위 큐</h4>
      <ul className="pq">
        {view.pq.slice(0, 5).map((row) => (
          <li key={row.id}>
            <span>{nameOf(row.id)}</span>
            <b>{fmt(row.distYr)}년</b>
          </li>
        ))}
        {view.pq.length === 0 && <li className="muted">비어 있음</li>}
      </ul>
      <p className="note">다음 확정 별은 가장 가까운 별이 아닐 수 있어요.</p>
    </aside>
  )
}

function titleOf(type: string) {
  switch (type) {
    case 'ready':
      return '대기'
    case 'pop':
      return '큐에서 선택'
    case 'settle':
      return '별 확정'
    case 'query':
      return '반경 이웃 탐색'
    case 'relax':
      return '도착 시각 갱신'
    case 'done':
      return '최단 시간 경로'
    default:
      return '도달 불가'
  }
}

function lineOf(e: ReturnType<typeof useView>['event']) {
  if (e.type === 'ready') return '재생을 누르면 지구에서 탐색을 시작합니다.'
  if (e.type === 'pop') return '우선순위 큐에서 꺼낸 별입니다.'
  if (e.type === 'settle') return '이 별의 도착 시각은 이후 바뀌지 않습니다.'
  if (e.type === 'query') return '이 거리 안의 별만 다음 후보가 됩니다.'
  if (e.type === 'relax') return `${nameOf(e.from)} → ${nameOf(e.to)}`
  if (e.type === 'done') return ''
  return `확정된 별 ${e.settledCount}개.`
}

function nameOf(id: string) {
  return useSimulationStore.getState().bodies.find((b) => b.id === id)?.name ?? id
}

function fmt(n: number) {
  return n.toFixed(1)
}

function trim(n: number) {
  return Number(n.toFixed(1)).toString()
}
