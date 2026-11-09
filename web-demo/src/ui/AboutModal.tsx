import { AlgorithmGuide } from './Intro'
import { hideHowToday, useSimulationStore } from '../store/useSimulationStore'

export function AboutModal() {
  const open = useSimulationStore((s) => s.about)
  const toggle = useSimulationStore((s) => s.toggleAbout)
  if (!open) return null
  return (
    <div className="modal-back" onClick={toggle}>
      <AlgorithmGuide
        onClose={toggle}
        onDismissToday={() => {
          hideHowToday()
          toggle()
        }}
      />
    </div>
  )
}
