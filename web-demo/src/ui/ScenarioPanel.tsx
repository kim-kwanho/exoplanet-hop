import { InspectorPanel } from './InspectorPanel'
import { useSimulationStore, useView, type DatasetId, type ShipSkin } from '../store/useSimulationStore'

export function ScenarioPanel() {
  const open = useSimulationStore((s) => s.scenarioOpen)
  const toggle = useSimulationStore((s) => s.toggleScenario)
  const X = useSimulationStore((s) => s.X)
  const speedC = useSimulationStore((s) => s.speedC)
  const stopYr = useSimulationStore((s) => s.stopYr)
  const destId = useSimulationStore((s) => s.destId)
  const setX = useSimulationStore((s) => s.setX)
  const setSpeed = useSimulationStore((s) => s.setSpeed)
  const setStop = useSimulationStore((s) => s.setStop)
  const setDest = useSimulationStore((s) => s.setDest)
  const datasetId = useSimulationStore((s) => s.datasetId)
  const bodies = useSimulationStore((s) => s.bodies)
  const setDataset = useSimulationStore((s) => s.setDataset)
  const shipSkin = useSimulationStore((s) => s.shipSkin)
  const setShipSkin = useSimulationStore((s) => s.setShipSkin)
  const toStart = useSimulationStore((s) => s.toStart)
  const replayFlight = useSimulationStore((s) => s.replayFlight)
  const view = useView()
  const done = view.event.type === 'done' ? view.event : null

  if (!open) {
    return (
      <button type="button" className="tab" onClick={toggle}>
        경로 설정 ›
      </button>
    )
  }

  const stars = bodies.filter((b) => b.kind !== 'earth')
  const stops = done ? done.path.legs.filter((l) => l.stopYr > 0).length : 0
  return (
    <aside className="panel left">
      <div className="panel-h">
        <strong>경로 설정</strong>
        <div className="panel-h-actions">
          <button type="button" className="ghost compact" onClick={toStart}>
            처음
          </button>
          <button type="button" className="icon" onClick={toggle} aria-label="접기">
            ‹
          </button>
        </div>
      </div>
      {done && (
        <div className="path-line">
          <span>
            최단 <b>{done.path.totalYr.toFixed(1)}년</b>
            <i>·</i>
            도약 {done.path.hops}
            <i>·</i>
            기착 {stops}
          </span>
          <button type="button" className="ghost" onClick={replayFlight}>
            재생
          </button>
        </div>
      )}
      <div className="field">
        <span>데이터</span>
        <div className="seg">
          <button type="button" className={datasetId === 'hosts' ? 'on' : 'off'} onClick={() => setDataset('hosts' satisfies DatasetId)}>
            호스트
          </button>
          <button type="button" className={datasetId === 'sandbox' ? 'on' : 'off'} onClick={() => setDataset('sandbox')}>
            샌드박스
          </button>
        </div>
      </div>
      <label className="dest">
        <span>지구 →</span>
        <select value={destId} onChange={(e) => setDest(e.target.value)}>
          {stars.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <Slider label="도약 X" min={1} max={20} step={0.1} value={X} unit="ly" onChange={setX} />
      <Slider label="속도" min={0.05} max={0.5} step={0.05} value={speedC} unit="c" onChange={setSpeed} />
      <Slider label="기착" min={0} max={5} step={0.5} value={stopYr} unit="년" onChange={setStop} />
      <div className="field">
        <span>우주선</span>
        <div className="seg">
          {([
            ['classic', '기본'],
            ['snoopy', '스누피'],
            ['pat', '페트'],
          ] as [ShipSkin, string][]).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={shipSkin === id ? 'on' : 'off'}
              onClick={() => setShipSkin(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <InspectorPanel />
    </aside>
  )
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  unit,
  onChange,
}: {
  label: string
  min: number
  max: number
  step: number
  value: number
  unit: string
  onChange: (n: number) => void
}) {
  return (
    <label>
      <span className="row">
        {label}
        <b>
          {trim(value)} {unit}
        </b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}

function trim(n: number) {
  return Number(n.toFixed(2)).toString()
}
