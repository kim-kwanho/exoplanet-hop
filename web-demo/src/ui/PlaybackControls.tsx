import { useEffect } from 'react'
import { useSimulationStore } from '../store/useSimulationStore'

export function PlaybackControls() {
  const index = useSimulationStore((s) => s.index)
  const events = useSimulationStore((s) => s.events)
  const playing = useSimulationStore((s) => s.playing)
  const rate = useSimulationStore((s) => s.rate)
  const step = useSimulationStore((s) => s.step)
  const toStart = useSimulationStore((s) => s.toStart)
  const toEnd = useSimulationStore((s) => s.toEnd)
  const togglePlay = useSimulationStore((s) => s.togglePlay)
  const cycleRate = useSimulationStore((s) => s.cycleRate)
  const requestFocus = useSimulationStore((s) => s.requestFocus)
  const camZoomed = useSimulationStore((s) => s.camZoomed)
  const event = events[index]

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => step(1), 1200 / rate)
    return () => window.clearInterval(id)
  }, [playing, rate, step])

  const label =
    event?.type === 'done' ? '완료' : event?.type === 'unreachable' ? '도달 불가' : event?.type === 'ready' ? '대기' : '재생'
  return (
    <div className="play-stack">
      {camZoomed && (
        <button type="button" className="focus-btn" onClick={requestFocus} aria-label="현재 위치로">
          현재 위치로
        </button>
      )}
      <div className="play">
        <span className={`dot ${event?.type ?? ''}`} />
        <span>
          {label} · {index} / {events.length - 1}
        </span>
        <button type="button" className="icon" onClick={cycleRate}>
          {rate}×
        </button>
        <button type="button" className="icon" onClick={toStart} aria-label="처음으로">
          ⏮
        </button>
        <button type="button" className="icon" onClick={() => step(-1)} aria-label="이전">
          ◀
        </button>
        <button type="button" className="play-main" onClick={togglePlay} aria-label={playing ? '일시정지' : '재생'}>
          {playing ? '❚❚' : '▶'}
        </button>
        <button type="button" className="icon" onClick={() => step(1)} aria-label="다음">
          ▶
        </button>
        <button type="button" className="icon" onClick={toEnd} aria-label="끝으로">
          ⏭
        </button>
        <input
          className="scrub"
          type="range"
          min={0}
          max={Math.max(0, events.length - 1)}
          value={index}
          onChange={(e) => {
            const n = Number(e.target.value)
            step(n - index)
          }}
        />
      </div>
    </div>
  )
}
