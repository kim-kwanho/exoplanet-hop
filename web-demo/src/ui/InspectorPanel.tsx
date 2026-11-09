import { useLayoutEffect, useMemo, useRef } from 'react'
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
  const hint = useMemo(() => {
    if (!view.unreachable) return null
    return suggestRadius(bodies, { X, speedC, stopYr, startId: 'earth_sol', destId })
  }, [view.unreachable, bodies, X, speedC, stopYr, destId])

  const e = view.event
  if (e.type === 'done') {
    return (
      <div className="inspect">
        <div className="panel-h">
          <strong>진행 상황</strong>
          <span className="muted">완료</span>
        </div>
        <PriorityQueue rows={view.pq} leavingId={null} />
      </div>
    )
  }
  return (
    <div className="inspect">
      <div className="panel-h">
        <strong>진행 상황</strong>
        <span className="muted">{titleOf(e.type)}</span>
      </div>
      {e.type === 'pop' && (
        <div className="step">
          <strong>{nameOf(e.nodeId)}</strong>
          <b>{fmt(e.distYr)}년</b>
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
          <b>{trim(e.radius)} ly · {e.hitIds.length}</b>
        </div>
      )}
      {e.type === 'relax' && (
        <p className="formula">
          {nameOf(e.from)}→{nameOf(e.to)} · {fmt(e.candidateYr)}년{e.updated ? '' : ' · 없음'}
        </p>
      )}
      {e.type === 'ready' && <p className="muted">재생을 누르면 탐색을 시작합니다.</p>}
      {view.unreachable && (
        <div className="alert">
          <p>반경 {trim(X)} ly로는 도달 불가</p>
          {hint !== null && (
            <button type="button" className="primary" onClick={() => setX(hint)}>
              X {trim(hint)} ly
            </button>
          )}
        </div>
      )}
      <PriorityQueue rows={view.pq} leavingId={e.type === 'pop' ? e.nodeId : null} />
    </div>
  )
}

function PriorityQueue({ rows, leavingId }: { rows: { id: string; distYr: number }[]; leavingId: string | null }) {
  const lane = useRef<HTMLDivElement>(null)
  const prev = useRef(new Map<string, number>())
  const shown = rows.slice(0, 3)
  const sig = shown.map((row) => `${row.id}:${row.distYr}`).join('|')

  useLayoutEffect(() => {
    const root = lane.current
    if (!root) return
    const next = new Map<string, number>()
    for (const el of root.querySelectorAll<HTMLElement>('[data-qid]')) {
      const id = el.dataset.qid!
      const top = el.getBoundingClientRect().top
      next.set(id, top)
      const old = prev.current.get(id)
      if (old !== undefined && Math.abs(old - top) > 1 && id !== leavingId) {
        el.animate([{ transform: `translateY(${old - top}px)` }, { transform: 'translateY(0)' }], {
          duration: 420,
          easing: 'cubic-bezier(.2,.7,.2,1)',
        })
      }
    }
    prev.current = next
  }, [sig, leavingId])

  return (
    <div className="queue" ref={lane}>
      <div className="queue-mouth" aria-hidden="true" />
      {shown.map((row, i) => (
        <div key={row.id} data-qid={row.id} className={`q-card${i === 0 ? ' front' : ''}${leavingId === row.id ? ' leaving' : ''}`}>
          <span>{nameOf(row.id)}</span>
          <b>{fmt(row.distYr)}년</b>
        </div>
      ))}
      {shown.length === 0 && <div className="q-empty">비어 있음</div>}
      {rows.length > shown.length && <div className="q-more">외 {rows.length - shown.length}</div>}
    </div>
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

function nameOf(id: string) {
  return useSimulationStore.getState().bodies.find((b) => b.id === id)?.name ?? id
}

function fmt(n: number) {
  return n.toFixed(1)
}

function trim(n: number) {
  return Number(n.toFixed(1)).toString()
}
