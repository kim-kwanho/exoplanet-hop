import { useSimulationStore, type DatasetId } from '../store/useSimulationStore'

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
  const toStart = useSimulationStore((s) => s.toStart)

  if (!open) {
    return (
      <button type="button" className="tab" onClick={toggle}>
        경로 설정 ›
      </button>
    )
  }

  const stars = bodies.filter((b) => b.kind !== 'earth')
  return (
    <aside className="panel left">
      <div className="panel-h">
        <strong>경로 설정</strong>
        <button type="button" className="icon" onClick={toggle} aria-label="접기">
          ‹
        </button>
      </div>
      <div>
        데이터셋
        <div className="seg">
          <button type="button" className={datasetId === 'hosts' ? 'on' : 'off'} onClick={() => setDataset('hosts' satisfies DatasetId)}>
            호스트
          </button>
          <button type="button" className={datasetId === 'sandbox' ? 'on' : 'off'} onClick={() => setDataset('sandbox')}>
            샌드박스
          </button>
        </div>
      </div>
      <label>
        출발
        <input value="지구" readOnly />
      </label>
      <label>
        목적지
        <select value={destId} onChange={(e) => setDest(e.target.value)}>
          {stars.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <Slider label="도약 반경 X" min={1} max={20} step={0.1} value={X} unit="ly" onChange={setX} />
      <Slider label="속도" min={0.05} max={0.5} step={0.05} value={speedC} unit="c" onChange={setSpeed} />
      <Slider label="기착" min={0} max={5} step={0.5} value={stopYr} unit="년" onChange={setStop} />
      <button type="button" className="ghost wide" onClick={toStart}>
        처음으로
      </button>
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
