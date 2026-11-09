import { useEffect } from 'react'
import { AboutModal } from './ui/AboutModal'
import { PlaybackControls } from './ui/PlaybackControls'
import { IconRail } from './ui/IconRail'
import { Intro } from './ui/Intro'
import { ScenarioPanel } from './ui/ScenarioPanel'
import { TopBar } from './ui/TopBar'
import { SpaceCanvas } from './ui/canvas/SpaceCanvas'
import { useSimulationStore } from './store/useSimulationStore'

export function App() {
  const intro = useSimulationStore((s) => s.intro)
  const step = useSimulationStore((s) => s.step)
  const togglePlay = useSimulationStore((s) => s.togglePlay)
  const requestReset = useSimulationStore((s) => s.requestReset)
  const meta = useSimulationStore((s) => s.meta)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.code === 'ArrowRight') step(1)
      else if (e.code === 'ArrowLeft') step(-1)
      else if (e.key === 'r' || e.key === 'R') requestReset()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, togglePlay, requestReset])

  if (intro) return <Intro />

  return (
    <div className="app">
      <SpaceCanvas />
      <TopBar />
      <ScenarioPanel />
      <IconRail />
      <PlaybackControls />
      <footer className="foot">
        데이터: {meta.isSynthetic ? `샌드박스(시드 ${meta.seed})` : `${meta.source} · ${meta.retrievedAt}`}
      </footer>
      <AboutModal />
    </div>
  )
}
