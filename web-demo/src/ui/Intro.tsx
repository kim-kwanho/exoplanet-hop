import { useSimulationStore } from '../store/useSimulationStore'

function DataPill() {
  const meta = useSimulationStore((s) => s.meta)
  const X = useSimulationStore((s) => s.X)
  const speedC = useSimulationStore((s) => s.speedC)
  return (
    <span className="pill">
      {meta.isSynthetic ? '샌드박스' : '호스트'} {meta.starCount} · {speedC.toFixed(1)}c · X {Number(X.toFixed(1))} ly
    </span>
  )
}

export function Intro() {
  const start = useSimulationStore((s) => s.start)
  const toggleAbout = useSimulationStore((s) => s.toggleAbout)
  const about = useSimulationStore((s) => s.about)
  return (
    <div className="intro">
      <header className="top">
        <div className="brand">
          <span className="logo" />
          EXOPLANET HOP
          <DataPill />
        </div>
        <button type="button" className="ghost" onClick={toggleAbout}>
          정보
        </button>
      </header>
      <div className="hero">
        <div>
          <p className="overline">INTERSTELLAR ROUTE FINDER</p>
          <h1>별에서 별로, 가장 빠른 길</h1>
          <p className="lead">
            한 번에 갈 수 있는 거리 X와 기착 시간을 고려해 지구에서 목적지까지 최단 시간 경로를 3D로 찾습니다.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary" onClick={start}>
              탐색 시작 →
            </button>
            <button type="button" className="ghost" onClick={toggleAbout}>
              작동 원리
            </button>
          </div>
        </div>
        <div className="scale" aria-hidden>
          <div className="sun" />
          <div className="orbit o1" />
          <div className="orbit o2" />
          <div className="orbit o3" />
          <span className="tag a">태양계 ≈ 0.001 ly</span>
          <span className="dash" />
          <span className="tag b">가장 가까운 별 ≈ 4.2 ly</span>
        </div>
      </div>
      <div className="cards">
        <article>
          <h3>반경 질의 · k-d 트리</h3>
          <p>반경 X 안의 별만 빠르게 찾습니다.</p>
        </article>
        <article>
          <h3>최단 시간 · Dijkstra</h3>
          <p>비행 시간과 기착 시간을 더해 최소가 되는 경로를 고릅니다.</p>
        </article>
        <article>
          <h3>단계 재생</h3>
          <p>앞뒤로 넘기며 확정·탐색·갱신 과정을 봅니다.</p>
        </article>
      </div>
      {about && <AboutInline />}
    </div>
  )
}

function AboutInline() {
  const toggleAbout = useSimulationStore((s) => s.toggleAbout)
  return (
    <div className="modal-back" onClick={toggleAbout}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>작동 원리</h2>
        <p>좌표는 정적입니다. 지구는 출발점이고 k-d 트리에는 넣지 않습니다. 첫 이웃 탐색은 원점입니다.</p>
        <p>별을 떠날 때, 지구가 아니면 기착 시간이 붙습니다. 목적지에 도착하면 거기서의 기착은 계산하지 않습니다.</p>
        <button type="button" className="primary" onClick={toggleAbout}>
          닫기
        </button>
      </div>
    </div>
  )
}
