import { useState, type UIEvent } from 'react'
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

export function AlgorithmGuide({ onClose, onDismissToday }: { onClose: () => void; onDismissToday?: () => void }) {
  const [page, setPage] = useState(0)
  const last = page === 1

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const next = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1))
    setPage(next > 0 ? 1 : 0)
  }

  return (
    <div className="how" onClick={(e) => e.stopPropagation()}>
      <div className="how-viewport" onScroll={onScroll}>
        <section className="how-page">
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
        </section>
        <section className="how-page">
          <div className="how-head">
            <p>HOW TO USE</p>
              <h2>화면에서 이렇게 봅니다</h2>
          </div>
          <div className="how-steps">
            <article>
              <PickSketch />
              <span>01 · 목적지</span>
              <h3>별을 고릅니다</h3>
              <p>왼쪽에서 목적지를 고르고, 속도·도약 거리 X를 맞춥니다.</p>
            </article>
            <article>
              <PlaySketch />
              <span>02 · 탐색</span>
              <h3>단계로 재생</h3>
              <p>하단 재생으로 후보·확정·큐를 한 스텝씩 따라갑니다.</p>
            </article>
            <article>
              <FlySketch />
              <span>03 · 비행</span>
              <h3>경로를 봅니다</h3>
              <p>최단 경로가 잡히면 우주선이 경로를 따라 목적지로 날아갑니다.</p>
            </article>
          </div>
        </section>
      </div>
      {last && (
        <div className="how-actions last">
          <button type="button" className="how-x" aria-label="닫기" onClick={onClose}>
            ×
          </button>
          <div className="how-dots" aria-hidden>
            <i />
            <i className="on" />
          </div>
          {onDismissToday ? (
            <button type="button" className="ghost" onClick={onDismissToday}>
              오늘 하루 보지 않기
            </button>
          ) : (
            <span className="how-actions-spacer" />
          )}
        </div>
      )}
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

function PickSketch() {
  return (
    <svg className="how-art" viewBox="0 0 160 92" aria-hidden>
      <rect x="18" y="16" width="48" height="60" rx="8" fill="#121920" stroke="#314556" />
      <rect x="26" y="26" width="32" height="8" rx="3" fill="#1ee0a0" />
      <rect x="26" y="40" width="28" height="6" rx="2" fill="#314556" />
      <rect x="26" y="52" width="24" height="6" rx="2" fill="#314556" />
      <circle cx="112" cy="44" r="14" fill="#1a2430" stroke="#7ef4ff" />
      <circle cx="112" cy="44" r="4" fill="#ffe38a" />
      <path d="M96 30 L104 38" stroke="#45dbae" strokeWidth="2" />
    </svg>
  )
}

function PlaySketch() {
  return (
    <svg className="how-art" viewBox="0 0 160 92" aria-hidden>
      <rect x="36" y="58" width="88" height="18" rx="9" fill="#143246" stroke="#314556" />
      <polygon points="72,64 72,70 80,67" fill="#1ee0a0" />
      <circle cx="96" cy="67" r="3" fill="#ffe38a" />
      <circle cx="48" cy="30" r="4" fill="#2e8dd0" />
      <circle cx="78" cy="24" r="3.5" fill="#7ef4ff" />
      <circle cx="108" cy="34" r="3" fill="#d7ecff" />
      <path d="M48 30 L78 24 L108 34" fill="none" stroke="#39e1aa" strokeWidth="1.5" strokeDasharray="3 3" />
    </svg>
  )
}

function FlySketch() {
  return (
    <svg className="how-art" viewBox="0 0 160 92" aria-hidden>
      <path d="M28 64 L70 40 L112 28" fill="none" stroke="#39e1aa" strokeWidth="2" />
      <circle cx="28" cy="64" r="5" fill="#2e8dd0" />
      <circle cx="112" cy="28" r="6" fill="#ffe38a" />
      <circle cx="112" cy="28" r="12" fill="none" stroke="#ffe38a" opacity=".35" />
      <polygon points="68,44 78,36 74,48" fill="#f2f7ff" />
    </svg>
  )
}
