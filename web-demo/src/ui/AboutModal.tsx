import { AlgorithmGuide } from './Intro'
import { useSimulationStore } from '../store/useSimulationStore'

export function AboutModal() {
  const open = useSimulationStore((s) => s.about)
  const toggle = useSimulationStore((s) => s.toggleAbout)
  if (!open) return null
  return (
    <div className="modal-back" onClick={toggle}>
      <AlgorithmGuide onClose={toggle} />
    </div>
  )
}
