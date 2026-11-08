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
        </div>
      </header>
      <div className="solar-system" aria-hidden>
        <div className="solar-glow" />
        <div className="solar-sun" />
        <div className="solar-orbit orbit-1"><i /></div>
        <div className="solar-orbit orbit-2"><i /></div>
        <div className="solar-orbit orbit-3"><i /></div>
        <div className="solar-orbit orbit-4"><i className="earth-dot" /></div>
        <div className="solar-orbit orbit-5"><i /></div>
        <div className="solar-orbit orbit-6"><i /></div>
      </div>
      <main className="landing-center">
        <p className="overline"><span>01</span> INTERSTELLAR ROUTE FINDER</p>
        <h1>
          <span className="title-solid">FASTEST ROUTE</span>
          <span className="title-outline">BETWEEN STARS</span>
        </h1>
        <p className="lead">
          지구에서 출발해 도약 거리와 기착 시간을 계산하고,
          <br />
          목적지까지의 최단 시간 경로를 3D로 탐색합니다.
        </p>
        <div className="hero-actions">
          <button type="button" className="primary landing-start" onClick={start}>
            START EXPLORING <span aria-hidden>↗</span>
          </button>
          <button type="button" className="landing-about" onClick={toggleAbout}>
            작동 원리 보기
          </button>
        </div>
      </main>
      <div className="landing-foot">
        <DataPill />
        <span>DRAG TO EXPLORE · STEP THROUGH THE ROUTE</span>
        <span>SEOUL · 2026</span>
      </div>
      {about && <AboutInline />}
    </div>
  )
}

function AboutInline() {
  const toggleAbout = useSimulationStore((s) => s.toggleAbout)
  return (
    <div className="modal-back" onClick={toggleAbout}>
      <AlgorithmGuide onClose={toggleAbout} />
    </div>
  )
}

export function AlgorithmGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="how" onClick={(e) => e.stopPropagation()}>
      <div className="how-head">
        <p>ALGORITHM</p>
        <h2>세 단계로 길을 고릅니다</h2>
      </div>
      <div className="how-steps">
        <article>
          <RadiusSketch />
          <span>01 · k-d 반경 질의</span>
          <h3>반경 안의 별</h3>
          <p>현재 별에서 X 광년 안의 별만 다음 후보로 꺼냅니다.</p>
        </article>
        <article>
          <TimeSketch />
          <span>02 · 이동 비용</span>
          <h3>도착 시간</h3>
          <p>거리 ÷ 속도에, 지구가 아닌 별을 떠날 때의 기착 시간을 더합니다.</p>
        </article>
        <article>
          <QueueSketch />
          <span>03 · 우선순위 큐</span>
          <h3>가장 빠른 별</h3>
          <p>가까운 별이 아니라, 누적 도착 시간이 가장 짧은 별을 먼저 확정합니다.</p>
        </article>
      </div>
      <button type="button" className="primary" onClick={onClose}>
        닫기
      </button>
    </div>
  )
}

function RadiusSketch() {
  return (
    <svg className="how-art" viewBox="0 0 160 92" aria-hidden>
      <circle cx="78" cy="46" r="28" fill="none" stroke="#3ec6e0" strokeDasharray="3 3" />
      <circle cx="78" cy="46" r="5" fill="#7ef4ff" />
      <circle cx="96" cy="34" r="3" fill="#d7ecff" />
      <circle cx="64" cy="58" r="3" fill="#d7ecff" />
      <circle cx="128" cy="24" r="2.5" fill="#44586a" />
    </svg>
  )
}

function TimeSketch() {
  return (
    <svg className="how-art" viewBox="0 0 160 92" aria-hidden>
      <path d="M28 58 C58 58 70 30 104 30" fill="none" stroke="#39e1aa" strokeWidth="2" />
      <circle cx="28" cy="58" r="6" fill="#2e8dd0" />
      <circle cx="104" cy="30" r="4" fill="#ffe38a" />
      <text x="34" y="78" fill="#8ea0b5" fontSize="9">비행</text>
      <text x="92" y="50" fill="#8ea0b5" fontSize="9">+ 기착</text>
    </svg>
  )
}

function QueueSketch() {
  return (
    <svg className="how-art" viewBox="0 0 160 92" aria-hidden>
      <rect x="46" y="18" width="68" height="16" rx="8" fill="#143246" stroke="#1ee0a0" />
      <rect x="52" y="40" width="56" height="14" rx="7" fill="#1a2430" stroke="#ffe38a" />
      <rect x="58" y="60" width="44" height="12" rx="6" fill="#121920" stroke="#314556" />
    </svg>
  )
}
