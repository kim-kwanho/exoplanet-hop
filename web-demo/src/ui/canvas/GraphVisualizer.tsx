import { Html, Line, OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ViewState } from '../../core/deriveView'
import { distance } from '../../core/units'
import { useSimulationStore, useView } from '../../store/useSimulationStore'
import type { Body } from '../../core/dijkstraSimulator'

function starBodies() {
  return useSimulationStore.getState().bodies
}

const COLOR: Record<string, string> = {
  earth: '#7ef4ff',
  dest: '#ff5a6a',
  current: '#e8ff8a',
  neighbor: '#8fd4ff',
  settled: '#9dffc4',
  queued: '#ffe38a',
  idle: '#f4f7ff',
}

const flightCamera = {
  active: false,
  follow: false,
  position: new THREE.Vector3(),
  direction: new THREE.Vector3(0, 0, 1),
}

function glowTexture() {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 64
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.18, 'rgba(255,255,255,0.75)')
  grd.addColorStop(0.45, 'rgba(255,255,255,0.18)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

function temperature(id: string) {
  let h = 0
  for (const ch of id) h = (h * 33 + ch.charCodeAt(0)) >>> 0
  const k = h % 3
  if (k === 0) return new THREE.Color('#d7e6ff')
  if (k === 1) return new THREE.Color('#fff4dc')
  return new THREE.Color('#f5f8ff')
}

function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function homePose(bodies: Body[], destId: string) {
  const earth = bodies.find((b) => b.kind === 'earth')?.pos ?? [0, 0, 0]
  const dest = bodies.find((b) => b.id === destId)?.pos ?? [30, 0, 0]
  const a = new THREE.Vector3(...earth)
  const b = new THREE.Vector3(...dest)
  const span = Math.max(16, a.distanceTo(b))
  const route = b.clone().sub(a)
  if (route.lengthSq() < 1) route.set(1, 0, 0)
  route.normalize()
  const side = new THREE.Vector3().crossVectors(route, new THREE.Vector3(0, 1, 0))
  if (side.lengthSq() < 1e-4) side.set(0, 0, 1)
  side.normalize()
  const target = a.clone().lerp(b, 0.16)
  const dist = span * 1.62
  const cam = target
    .clone()
    .addScaledVector(side, dist * 0.9)
    .addScaledVector(route, -dist * 0.08)
    .add(new THREE.Vector3(0, dist * 0.4, 0))
  return { cam, target, span }
}

export function GraphVisualizer() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[30, 18, 12]} intensity={1.4} />
      <CameraRig />
      <Sky />
      <Grid />
      <Stars />
      <Landmarks />
      <RadiusSphere />
      <Edges />
      <ShipFlight />
      <Labels />
    </>
  )
}

function Sky() {
  const { dim, bright, band } = useMemo(() => {
    const random = seeded(20261108)
    const sphere = (n: number, radius: number, banded = false) => {
    const pos = new Float32Array(n * 3)
    const col = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
        const r = radius + random() * 35
        const theta = random() * Math.PI * 2
        const y = banded
          ? THREE.MathUtils.clamp((random() + random() + random() - 1.5) * 0.22, -0.35, 0.35)
          : random() * 2 - 1
        const plane = Math.sqrt(Math.max(0, 1 - y * y))
        pos[i * 3] = r * plane * Math.cos(theta)
        pos[i * 3 + 1] = r * y
        pos[i * 3 + 2] = r * plane * Math.sin(theta)
        const tint = 0.45 + random() * 0.55
        const roll = random()
      col[i * 3] = tint * (roll > 0.82 ? 1 : 0.86)
      col[i * 3 + 1] = tint * (roll > 0.82 ? 0.88 : 0.93)
      col[i * 3 + 2] = tint * (roll < 0.12 ? 1 : 0.95)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return g
    }
    return {
      dim: sphere(4200, 390),
      bright: sphere(420, 385),
      band: sphere(1800, 400, true),
    }
  }, [])
  return (
    <group rotation={[0.18, 0, -0.42]}>
      <points geometry={dim}>
        <pointsMaterial size={0.85} sizeAttenuation={false} vertexColors transparent opacity={0.72} depthWrite={false} />
      </points>
      <points geometry={band}>
        <pointsMaterial
          size={1.15}
          sizeAttenuation={false}
          vertexColors
          transparent
          opacity={0.38}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points geometry={bright}>
        <pointsMaterial
          size={2.2}
          sizeAttenuation={false}
          vertexColors
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}

function roleOf(id: string, view: ViewState, destId: string, queued: Set<string>) {
  const body = starBodies().find((b) => b.id === id)
  if (body?.kind === 'earth') return 'earth'
  if (id === destId) return 'dest'
  if (id === view.currentId && (view.event.type === 'pop' || view.event.type === 'settle' || view.event.type === 'query' || view.event.type === 'relax'))
    return 'current'
  if (view.neighborIds.includes(id)) return 'neighbor'
  if (view.settled.has(id)) return 'settled'
  if (queued.has(id)) return 'queued'
  return 'idle'
}

function Stars() {
  const view = useView()
  const destId = useSimulationStore((s) => s.destId)
  const bodies = useSimulationStore((s) => s.bodies)
  const field = useMemo(() => bodies.filter((b) => b.kind !== 'earth' && b.id !== destId), [bodies, destId])
  const queued = useMemo(() => new Set(view.pq.map((r) => r.id)), [view])
  const tex = useMemo(() => glowTexture(), [])
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(field.length * 3)
    field.forEach((b, i) => {
      pos[i * 3] = b.pos[0]
      pos[i * 3 + 1] = b.pos[1]
      pos[i * 3 + 2] = b.pos[2]
    })
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(field.length * 3), 3))
    return g
  }, [field])
  const scratch = useMemo(() => new THREE.Color(), [])

  useFrame(({ clock }) => {
    const attr = geo.getAttribute('color') as THREE.BufferAttribute
    const t = clock.elapsedTime
    field.forEach((b, i) => {
      const role = roleOf(b.id, view, destId, queued)
      if (role === 'idle') scratch.copy(temperature(b.id))
      else scratch.set(COLOR[role])
      if (role === 'neighbor') {
        const pulse = 0.75 + Math.sin(t * 4 + i) * 0.25
        scratch.multiplyScalar(pulse)
      }
      attr.setXYZ(i, scratch.r, scratch.g, scratch.b)
    })
    attr.needsUpdate = true
  })

  return (
    <>
      <points geometry={geo}>
        <pointsMaterial vertexColors size={2.2} sizeAttenuation={false} depthWrite={false} />
      </points>
      <points geometry={geo}>
        <pointsMaterial
          map={tex}
          vertexColors
          transparent
          opacity={0.82}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          size={11}
          sizeAttenuation={false}
        />
      </points>
    </>
  )
}

function Landmarks() {
  const destId = useSimulationStore((s) => s.destId)
  const bodies = useSimulationStore((s) => s.bodies)
  const tex = useMemo(() => glowTexture(), [])
  const earthMap = useMemo(() => {
    const map = new THREE.TextureLoader().load('/earth.jpg')
    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = 8
    return map
  }, [])
  const earth = bodies.find((b) => b.kind === 'earth')
  const dest = bodies.find((b) => b.id === destId)
  const pose = useMemo(() => homePose(bodies, destId), [bodies, destId])
  const radius = THREE.MathUtils.clamp(pose.span * 0.04, 1.8, 2.4)
  const guide = useMemo(() => {
    if (!earth || !dest) return null
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...earth.pos),
      new THREE.Vector3(...dest.pos),
    ])
    const material = new THREE.LineDashedMaterial({
      color: '#9fdfff',
      dashSize: pose.span / 26,
      gapSize: pose.span / 40,
      transparent: true,
      opacity: 0.7,
    })
    const line = new THREE.Line(geo, material)
    line.computeLineDistances()
    return line
  }, [earth, dest, pose.span])
  if (!earth || !dest || !guide) return null
  const ly = distance(earth.pos, dest.pos)
  const mid: [number, number, number] = [
    (earth.pos[0] + dest.pos[0]) / 2,
    (earth.pos[1] + dest.pos[1]) / 2 + radius * 1.8,
    (earth.pos[2] + dest.pos[2]) / 2,
  ]
  return (
    <>
      <primitive object={guide} />
      <Html position={mid} center zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
        <span className="star-label">직선 {ly.toFixed(1)} ly</span>
      </Html>
      <group position={earth.pos}>
        <mesh>
          <sphereGeometry args={[radius, 64, 48]} />
          <meshStandardMaterial map={earthMap} roughness={0.82} metalness={0.02} />
        </mesh>
        <mesh>
          <sphereGeometry args={[radius * 1.08, 32, 24]} />
          <meshBasicMaterial color="#9fd4ff" transparent opacity={0.14} side={THREE.BackSide} depthWrite={false} />
        </mesh>
      </group>
      <group position={dest.pos}>
        <mesh>
          <sphereGeometry args={[0.28, 20, 16]} />
          <meshBasicMaterial color="#ffb4be" />
        </mesh>
        <sprite scale={[1.5, 1.5, 1]}>
          <spriteMaterial map={tex} color="#ff5a6a" transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
    </>
  )
}

function RadiusSphere() {
  const view = useView()
  const show = useSimulationStore((s) => s.showRadius)
  if (!show || !view.showSphere || !view.sphereCenter) return null
  return (
    <mesh position={view.sphereCenter}>
      <sphereGeometry args={[view.sphereRadius, 36, 24]} />
      <meshBasicMaterial color="#00E5FF" wireframe transparent opacity={0.22} />
    </mesh>
  )
}

function bodyPos(id: string) {
  const b = starBodies().find((x) => x.id === id)
  return b ? new THREE.Vector3(b.pos[0], b.pos[1], b.pos[2]) : new THREE.Vector3()
}

function stopBefore(from: THREE.Vector3, to: THREE.Vector3, gap: number) {
  const dir = to.clone().sub(from)
  const len = dir.length()
  if (len <= gap) return to.clone()
  return to.clone().addScaledVector(dir.normalize(), -gap)
}

function Edges() {
  const view = useView()
  const showPath = useSimulationStore((s) => s.showPath)

  const settledPos = useMemo(() => {
    if (!showPath) return []
    const onRoute = new Set<string>()
    if (view.path) {
      for (const leg of view.path.legs) onRoute.add(`${leg.from}>${leg.to}`)
    }
    const byId = new Map(starBodies().map((b) => [b.id, b.pos]))
    const segs: [number, number, number, number, number, number][] = []
    for (const id of view.settled) {
      const from = view.prev.get(id)
      if (!from || onRoute.has(`${from}>${id}`)) continue
      const a = byId.get(from)
      const b = byId.get(id)
      if (!a || !b) continue
      segs.push([a[0], a[1], a[2], b[0], b[1], b[2]])
    }
    return segs
  }, [showPath, view])

  const relax = useMemo(() => {
    if (!view.relaxEdge) return null
    const a = starBodies().find((b) => b.id === view.relaxEdge!.from)?.pos
    const b = starBodies().find((b) => b.id === view.relaxEdge!.to)?.pos
    if (!a || !b) return null
    return [a[0], a[1], a[2], b[0], b[1], b[2]] as [number, number, number, number, number, number]
  }, [view.relaxEdge])

  return (
    <>
      <ThickSegs segs={settledPos} color="#7dffc3" />
      {relax && <Segs segs={[relax]} color="#9be7ff" />}
    </>
  )
}

function ShipFlight() {
  const view = useView()
  const showPath = useSimulationStore((s) => s.showPath)
  const nonce = useSimulationStore((s) => s.flightNonce)
  const index = useSimulationStore((s) => s.index)
  const group = useRef<THREE.Group>(null)
  const engine = useRef<THREE.Sprite>(null)
  const tex = useMemo(() => glowTexture(), [])
  const hull = useMemo(() => {
    const pts = [
      new THREE.Vector2(0, 1.28),
      new THREE.Vector2(0.045, 1.12),
      new THREE.Vector2(0.11, 0.82),
      new THREE.Vector2(0.16, 0.38),
      new THREE.Vector2(0.17, -0.05),
      new THREE.Vector2(0.14, -0.48),
      new THREE.Vector2(0.09, -0.86),
      new THREE.Vector2(0.045, -1.08),
      new THREE.Vector2(0, -1.16),
    ]
    return new THREE.LatheGeometry(pts, 32)
  }, [])
  const wing = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0.04, 0.18)
    shape.lineTo(0.72, -0.08)
    shape.lineTo(0.16, -0.46)
    shape.lineTo(0.02, -0.14)
    shape.closePath()
    return new THREE.ShapeGeometry(shape)
  }, [])
  const trailGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(96), 3))
    g.setDrawRange(0, 0)
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400)
    return g
  }, [])
  const trailLine = useMemo(
    () => new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: '#ffea00' })),
    [trailGeo],
  )
  const anim = useRef({ leg: 0, u: 0, hold: 0, done: false })

  const flying = view.event.type === 'done' && !!view.path && showPath
  useEffect(() => {
    anim.current = { leg: 0, u: 0, hold: 0, done: false }
    flightCamera.active = flying
    flightCamera.follow = flying
  }, [nonce, index, flying])

  useFrame((_, dt) => {
    const path = view.event.type === 'done' ? view.path : null
    const ship = group.current
    const geom = trailGeo
    if (!path || !ship || !showPath) return
    const legs = path.legs
    const a = anim.current
    if (!a.done && a.leg < legs.length) {
      const leg = legs[a.leg]
      const from = bodyPos(leg.from)
      const star = bodyPos(leg.to)
      const to = a.leg === legs.length - 1 ? stopBefore(from, star, 3.2) : star
      flightCamera.direction.copy(star).sub(from).normalize()
      const dist = from.distanceTo(to)
      const flySeconds = Math.min(2.2, Math.max(0.85, dist / 7))
      if (a.hold > 0) {
        a.hold = Math.max(0, a.hold - dt)
        ship.position.copy(bodyPos(leg.from))
      } else {
        a.u += dt / flySeconds
        if (a.u >= 1) {
          a.u = 0
          const last = a.leg === legs.length - 1
          a.leg += 1
          if (last) a.done = true
          else a.hold = 0.7
          ship.position.copy(to)
        } else {
          const eased = a.u * a.u * (3 - 2 * a.u)
          ship.position.lerpVectors(from, to, eased)
          ship.lookAt(star)
        }
      }
      flightCamera.position.copy(ship.position)
      if (engine.current) (engine.current.material as THREE.SpriteMaterial).opacity = a.hold > 0 || a.done ? 0.2 : 0.75
    } else if (legs.length > 0) {
      const last = legs[legs.length - 1]
      ship.position.copy(stopBefore(bodyPos(last.from), bodyPos(last.to), 3.2))
      ship.lookAt(bodyPos(last.to))
      flightCamera.active = false
    }

    const pts: number[] = []
    const flown = Math.min(a.leg, legs.length)
    if (legs.length > 0) {
      const origin = bodyPos(legs[0].from)
      pts.push(origin.x, origin.y, origin.z)
      for (let i = 0; i < flown; i++) {
        const end =
          i === legs.length - 1
            ? stopBefore(bodyPos(legs[i].from), bodyPos(legs[i].to), 3.2)
            : bodyPos(legs[i].to)
        pts.push(end.x, end.y, end.z)
      }
      if (!a.done && a.leg < legs.length && a.hold <= 0) {
        pts.push(ship.position.x, ship.position.y, ship.position.z)
      }
    }
    const attr = geom.getAttribute('position') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    const count = Math.min(pts.length / 3, arr.length / 3)
    for (let i = 0; i < count * 3; i++) arr[i] = pts[i]
    attr.needsUpdate = true
    geom.setDrawRange(0, count)
  })

  if (view.event.type !== 'done' || !view.path || !showPath) return null
  return (
    <>
      <primitive object={trailLine} />
      <group ref={group} scale={1.05}>
        <mesh geometry={hull} rotation={[-Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#d5dce4" metalness={0.78} roughness={0.32} />
        </mesh>
        <mesh geometry={wing} position={[0.02, 0.01, -0.08]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#8e9bab" metalness={0.64} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={wing} position={[-0.02, 0.01, -0.08]} rotation={[-Math.PI / 2, 0, 0]} scale={[-1, 1, 1]}>
          <meshStandardMaterial color="#8e9bab" metalness={0.64} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.09, 0.32]} scale={[0.07, 0.035, 0.14]}>
          <sphereGeometry args={[1, 20, 12]} />
          <meshStandardMaterial color="#1a222b" metalness={0.35} roughness={0.12} />
        </mesh>
        <mesh position={[0, 0, -1.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.11, 0.18, 24]} />
          <meshStandardMaterial color="#232a33" metalness={0.84} roughness={0.3} />
        </mesh>
        <sprite ref={engine} position={[0, 0, -1.28]} scale={[0.36, 0.36, 1]}>
          <spriteMaterial map={tex} color="#d5e9ff" transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
    </>
  )
}

function ThickSegs({ segs, color }: { segs: [number, number, number, number, number, number][]; color: string }) {
  if (segs.length === 0) return null
  return (
    <>
      {segs.map((s, i) => (
        <Line key={`${s[0]}-${s[3]}-${i}`} points={[[s[0], s[1], s[2]], [s[3], s[4], s[5]]]} color={color} lineWidth={3} />
      ))}
    </>
  )
}

function Segs({ segs, color }: { segs: [number, number, number, number, number, number][]; color: string }) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const arr = new Float32Array(segs.length * 6)
    segs.forEach((s, i) => arr.set(s, i * 6))
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    return g
  }, [segs])
  if (segs.length === 0) return null
  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial color={color} />
    </lineSegments>
  )
}

function Labels() {
  const view = useView()
  const destId = useSimulationStore((s) => s.destId)
  const all = useSimulationStore((s) => s.showLabels)
  const ids = new Set<string>(['earth_sol', destId])
  if (view.currentId) ids.add(view.currentId)
  if (!all) view.neighborIds.forEach((id) => ids.add(id))
  const list = starBodies().filter((b) => all || ids.has(b.id))
  return (
    <>
      {list.map((b) => (
        <Html
          key={b.id}
          position={
            b.kind === 'earth'
              ? [b.pos[0] + 3.4, b.pos[1] + 1.5, b.pos[2]]
              : b.id === destId
                ? [b.pos[0] - 4.6, b.pos[1] + 1.5, b.pos[2]]
                : b.pos
          }
          center
          zIndexRange={[1, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <span className="star-label">{b.kind === 'earth' ? 'EARTH' : b.name}</span>
        </Html>
      ))}
    </>
  )
}

function Grid() {
  const on = useSimulationStore((s) => s.showGrid)
  if (!on) return null
  return <gridHelper args={[140, 28, '#243140', '#18222e']} position={[28, -6, 0]} />
}

function CameraRig() {
  const controls = useRef<any>(null)
  const tracking = useRef(true)
  const resetting = useRef(false)
  const resetCam = useSimulationStore((s) => s.resetCam)
  const view = useView()
  const bodies = useSimulationStore((s) => s.bodies)
  const destId = useSimulationStore((s) => s.destId)
  const datasetId = useSimulationStore((s) => s.datasetId)
  const pose = useMemo(() => homePose(bodies, destId), [bodies, destId])
  const focus = useMemo(() => {
    const b = bodies.find((x) => x.id === view.currentId)
    return new THREE.Vector3(...(b?.pos ?? [0, 0, 0]))
  }, [bodies, view.currentId])

  useEffect(() => {
    resetting.current = true
    tracking.current = true
    flightCamera.follow = false
  }, [resetCam, datasetId, destId, pose])

  useFrame((state, dt) => {
    const c = controls.current
    if (!c) return
    const cam = state.camera
    const k = 1 - Math.pow(0.04, dt)
    if (view.event.type === 'done' && flightCamera.active && flightCamera.follow) {
      const ahead = flightCamera.position.clone().addScaledVector(flightCamera.direction, 6)
      const chase = flightCamera.position
        .clone()
        .addScaledVector(flightCamera.direction, -16)
        .add(new THREE.Vector3(0, 6, 0))
      cam.position.lerp(chase, 1 - Math.pow(0.015, dt))
      c.target.lerp(ahead, 1 - Math.pow(0.02, dt))
      c.update()
      return
    }
    if (resetting.current) {
      cam.position.lerp(pose.cam, k)
      c.target.lerp(pose.target, k)
      c.update()
      if (cam.position.distanceTo(pose.cam) < 0.8) resetting.current = false
      return
    }
    const type = view.event.type
    if (!tracking.current) return
    if (type === 'pop' || type === 'settle' || type === 'query') {
      const distance = Math.max(22, (view.sphereRadius || 8) * 3.1)
      const offset = cam.position.clone().sub(c.target)
      if (offset.lengthSq() < 1) offset.set(0, distance * 0.42, distance)
      offset.setLength(distance)
      cam.position.lerp(focus.clone().add(offset), k)
      c.target.lerp(focus, k)
      c.update()
    }
  })

  return (
    <OrbitControls
      ref={controls}
      enableDamping
      dampingFactor={0.12}
      minDistance={8}
      maxDistance={520}
      onStart={() => {
        tracking.current = false
        flightCamera.follow = false
      }}
    />
  )
}
