import { Canvas } from '@react-three/fiber'
import { GraphVisualizer } from './GraphVisualizer'

export function SpaceCanvas() {
  return (
    <Canvas
      className="canvas"
      camera={{ position: [30, 32, 70], fov: 42, near: 0.1, far: 4000 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 1.75]}
    >
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000006', 280, 1600]} />
      <GraphVisualizer />
    </Canvas>
  )
}
