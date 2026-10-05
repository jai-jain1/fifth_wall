import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PointerLockControls, Environment, Lightformer, MeshReflectorMaterial, Instances, Instance, Line, Grid, PerformanceMonitor, Edges } from '@react-three/drei'
import { EffectComposer, Bloom, SMAA, Vignette, ToneMapping, N8AO } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { SHORT, Zone, BX0, BX1, BZ0, BZ1, BW, BD, CX, CZ, CEIL, DIET_COLOR, FIRE_EXITS, FLOW, TOUR } from '../data/layout'
import { wallSegs, Seg } from '../geom'
import { mats, tileMat } from '../materials'
import { Equipment, Flat } from './Equipment'
import { Label } from './Label'
import { glRef } from '../glRef'

const isLow = () => typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768)

/* ---------- walls ---------- */
function Wall({ s, h, t = 0.12 }: { s: Seg; h: number; t?: number }) {
  const alongX = s.z1 === s.z2
  const len = Math.hypot(s.x2 - s.x1, s.z2 - s.z1)
  const th = Math.min(h, 2.13) // 7 ft tiled dado
  const tm = useMemo(() => tileMat(Math.max(len, 0.3), th), [len, th])
  if (len < 0.05) return null
  const size = (hh: number): [number, number, number] => (alongX ? [len, hh, t] : [t, hh, len])
  return (
    <group position={[(s.x1 + s.x2) / 2, 0, (s.z1 + s.z2) / 2]}>
      <mesh position={[0, th / 2, 0]} castShadow receiveShadow material={tm}><boxGeometry args={size(th)} /></mesh>
      {h > th + 0.01 && (
        <mesh position={[0, th + (h - th) / 2, 0]} castShadow receiveShadow material={mats().paint}><boxGeometry args={size(h - th)} /></mesh>
      )}
    </group>
  )
}

function Door({ x, z, alongX, gap, h }: { x: number; z: number; alongX: boolean; gap: number; h: number }) {
  const dh = Math.min(2.1, h)
  const m = mats().door
  const jamb = (o: number) => <mesh key={o} position={alongX ? [x + o, dh / 2, z] : [x, dh / 2, z + o]} material={m} castShadow><boxGeometry args={alongX ? [0.07, dh, 0.16] : [0.16, dh, 0.07]} /></mesh>
  return (
    <group>
      {jamb(-gap / 2)}{jamb(gap / 2)}
      <mesh position={[x, dh, z]} material={m}><boxGeometry args={alongX ? [gap + 0.07, 0.07, 0.16] : [0.16, 0.07, gap + 0.07]} /></mesh>
      <mesh position={alongX ? [x + gap / 2 - 0.15, 1.0, z + 0.1] : [x + 0.1, 1.0, z + gap / 2 - 0.15]} material={mats().steel}><cylinderGeometry args={[0.015, 0.015, 0.25, 8]} /></mesh>
    </group>
  )
}

function Shell({ h }: { h: number }) {
  const segs: Seg[] = [
    { x1: BX0, z1: BZ0, x2: BX1, z2: BZ0 }, { x1: BX0, z1: BZ1, x2: BX1, z2: BZ1 },
    { x1: BX0, z1: BZ0, x2: BX0, z2: BZ1 }, { x1: BX1, z1: BZ0, x2: BX1, z2: BZ1 },
  ]
  const full = h >= CEIL - 0.01
  const winX = useMemo(() => { const a: number[] = []; for (let x = BX0 + 2; x < BX1 - 1.5; x += 3.4) a.push(x); return a }, [])
  const vents = [{ x: BX0 + 0.02, z: 265 * 0.0316 + 2, side: 'w' }, { x: 160 * 0.0316, z: BZ1 - 0.02, side: 's' }, { x: 320 * 0.0316, z: BZ1 - 0.02, side: 's' }]
  return (
    <group>
      {segs.map((s, i) => <Wall key={i} s={s} h={h} t={0.25} />)}
      {full && winX.map((x) => (
        <group key={x} position={[x, 1.7, BZ0 + 0.14]}>
          <mesh material={mats().frame}><boxGeometry args={[1.9, 1.3, 0.04]} /></mesh>
          <mesh position={[0, 0, 0.03]} material={mats().glass}><boxGeometry args={[1.8, 1.2, 0.02]} /></mesh>
          <mesh position={[0, 0, 0.045]} material={mats().frame}><boxGeometry args={[0.04, 1.2, 0.02]} /></mesh>
        </group>
      ))}
      {full && vents.map((v, i) => (
        <group key={i} position={[v.x + (v.side === 'w' ? 0.15 : 0), 2.9, v.z - (v.side === 's' ? 0.15 : 0)]} rotation-y={v.side === 'w' ? Math.PI / 2 : 0}>
          <mesh material={mats().grey}><boxGeometry args={[1.2, 0.6, 0.06]} /></mesh>
          {[-0.18, 0, 0.18].map((y) => <mesh key={y} position={[0, y, 0.04]} material={mats().black}><boxGeometry args={[1.05, 0.04, 0.02]} /></mesh>)}
        </group>
      ))}
      {FIRE_EXITS.map((f) => {
        const inward = f.side === 'w' ? [0.2, 0] : f.side === 'e' ? [-0.2, 0] : [0, -0.2]
        const rot = f.side === 's' ? 0 : Math.PI / 2
        return (
          <group key={f.id} position={[f.x + inward[0], 0, f.z + inward[1]]} rotation-y={rot}>
            <mesh position={[0, 1.05, 0]} material={mats().steelDark}><boxGeometry args={[1.1, 2.1, 0.06]} /></mesh>
            <mesh position={[0, 2.4, 0]} material={mats().exit}><boxGeometry args={[0.55, 0.2, 0.05]} /></mesh>
            <mesh position={[0, 0.03, 0.35]} rotation-x={Math.PI / 2} material={mats().redArrow}><coneGeometry args={[0.18, 0.4, 3]} /></mesh>
          </group>
        )
      })}
    </group>
  )
}

/* ---------- ceiling ---------- */
function Ceiling() {
  const panels = useMemo(() => { const a: [number, number][] = []; for (let x = BX0 + 2; x < BX1 - 1; x += 3) for (let z = BZ0 + 1.5; z < BZ1 - 0.5; z += 3) a.push([x, z]); return a }, [])
  return (
    <group position={[0, CEIL, 0]}>
      <mesh rotation-x={Math.PI / 2} position={[CX, 0, CZ]} material={mats().ceiling}><planeGeometry args={[BW, BD]} /></mesh>
      <Instances limit={120} material={mats().led}>
        <boxGeometry args={[1.2, 0.05, 0.6]} />
        {panels.map((p, i) => <Instance key={i} position={[p[0], -0.03, p[1]]} />)}
      </Instances>
    </group>
  )
}

/* ---------- zones ---------- */
const FLOOR: Record<Zone['type'], string> = { room: '#e6ebec', cooking: '#8f989b', washing: '#b3bfc4', prep: '#c2cacd', storage: '#ccd3d5', packing: '#c6cdd0' }

const ZoneView = memo(function ZoneView({ z, wallH, low }: { z: Zone; wallH: number; low: boolean }) {
  const mode = useStore((s) => s.mode)
  const diet = useStore((s) => s.diet)
  const sel = useStore((s) => s.selected === z.id)
  const edit = useStore((s) => s.edit)
  const bp = mode === 'blueprint'
  const dimmed = !!diet && z.diet !== diet
  const cx = z.x + z.w / 2, cz = z.z + z.d / 2
  const ws = useMemo(() => (z.walled ? wallSegs(z) : null), [z])
  const labelY = z.type === 'room' ? 1.7 : 2.8
  const text = SHORT[z.id] ?? z.name
  return (
    <group>
      {!bp && (
        <>
          <Flat w={z.w} d={z.d} p={[cx, 0.015, cz]} c={FLOOR[z.type]} />
          {z.diet && <Flat w={z.w} d={0.14} p={[cx, 0.02, z.z + z.d - 0.09]} c={DIET_COLOR[z.diet]} em={0.9} />}
          {z.diet && diet === z.diet && <Flat w={z.w} d={z.d} p={[cx, 0.022, cz]} c={DIET_COLOR[z.diet]} em={0.5} />}
          {ws && ws.segs.map((s, i) => <Wall key={i} s={s} h={wallH} />)}
          {ws?.door && <Door {...ws.door} h={wallH} />}
          <group position={[cx, 0, cz]}><Equipment z={z} /></group>
          {dimmed && (
            <mesh rotation-x={-Math.PI / 2} position={[cx, 2.5, cz]}>
              <planeGeometry args={[z.w, z.d]} />
              <meshBasicMaterial color="#071317" transparent opacity={0.62} depthWrite={false} />
            </mesh>
          )}
        </>
      )}
      {mode !== 'walk' && (
        <mesh
          position={[cx, 1.2, cz]}
          onClick={(e) => { e.stopPropagation(); useStore.getState().select(z.id) }}
          onPointerOver={() => { document.body.style.cursor = edit ? 'move' : 'pointer' }}
          onPointerOut={() => { document.body.style.cursor = '' }}
          onPointerDown={(e) => {
            if (!edit) return
            e.stopPropagation()
            const st = useStore.getState()
            st.snapshot(); st.select(z.id)
            ;(window as any).__drag = { id: z.id, ox: e.point.x - z.x, oz: e.point.z - z.z }
            st.set({ dragging: true })
          }}
        >
          <boxGeometry args={[z.w, 2.4, z.d]} />
          <meshBasicMaterial transparent opacity={sel ? 0.08 : 0} color="#E36414" depthWrite={false} />
          {sel && <Edges color="#E36414" />}
        </mesh>
      )}
      {mode !== 'walk' && (
        <Label text={text} sub={bp ? `${z.w.toFixed(1)} x ${z.d.toFixed(1)} m` : undefined} color={!bp && z.diet ? DIET_COLOR[z.diet] : undefined}
          position={[cx, bp ? 0.3 : labelY, cz]} bp={bp} dim={dimmed} small={low} onClick={() => useStore.getState().select(z.id)} />
      )}
    </group>
  )
})

/* ---------- blueprint ---------- */
function Blueprint() {
  const zones = useStore((s) => s.zones)
  const { white, orange } = useMemo(() => {
    const w: number[] = [], o: number[] = []
    const rect = (x1: number, z1: number, x2: number, z2: number) => w.push(x1, 0.05, z1, x2, 0.05, z1, x2, 0.05, z1, x2, 0.05, z2, x2, 0.05, z2, x1, 0.05, z2, x1, 0.05, z2, x1, 0.05, z1)
    rect(BX0, BZ0, BX1, BZ1)
    zones.forEach((z) => {
      rect(z.x, z.z, z.x + z.w, z.z + z.d)
      const d = z.walled ? wallSegs(z).door : undefined
      if (d) d.alongX ? o.push(d.x - d.gap / 2, 0.08, d.z, d.x + d.gap / 2, 0.08, d.z) : o.push(d.x, 0.08, d.z - d.gap / 2, d.x, 0.08, d.z + d.gap / 2)
    })
    return { white: new Float32Array(w), orange: new Float32Array(o) }
  }, [zones])
  const dim = (t: string, pos: [number, number, number]) => <Label text={t} position={pos} bp />
  return (
    <group>
      <lineSegments key={white.length}><bufferGeometry><bufferAttribute attach="attributes-position" args={[white, 3]} /></bufferGeometry><lineBasicMaterial color="#ffffff" /></lineSegments>
      <lineSegments key={'o' + orange.length}><bufferGeometry><bufferAttribute attach="attributes-position" args={[orange, 3]} /></bufferGeometry><lineBasicMaterial color="#ff8a3d" /></lineSegments>
      {dim(`${BW.toFixed(1)} m`, [CX, 0.05, BZ0 - 0.7])}
      {dim(`${BD.toFixed(1)} m`, [BX0 - 1.1, 0.05, CZ])}
      {FIRE_EXITS.map((f) => (
        <mesh key={f.id} position={[f.x, 0.1, f.z]} rotation-z={f.side === 'w' ? Math.PI / 2 : f.side === 'e' ? -Math.PI / 2 : Math.PI}>
          <coneGeometry args={[0.3, 0.7, 3]} /><meshBasicMaterial color="#ff3b3b" />
        </mesh>
      ))}
      <Grid position={[CX, -0.01, CZ]} args={[80, 80]} cellSize={1} sectionSize={5} cellColor="#1f3f6e" sectionColor="#3c68a8" cellThickness={0.6} fadeDistance={70} />
    </group>
  )
}

/* ---------- compliance overlay ---------- */
function Arrow({ a, b, color }: { a: [number, number]; b: [number, number]; color: string }) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(b[0] - a[0], 0, b[1] - a[1]).normalize()), [a, b])
  return <mesh position={[(a[0] + b[0]) / 2, 2.7, (a[1] + b[1]) / 2]} quaternion={q}><coneGeometry args={[0.22, 0.55, 12]} /><meshBasicMaterial color={color} /></mesh>
}
function Compliance() {
  const zones = useStore((s) => s.zones)
  const ctr = (id: string): [number, number] | null => { const z = zones.find((q) => q.id === id); return z ? [z.x + z.w / 2, z.z + z.d / 2] : null }
  const route = (pts: ([number, number] | null)[]) => {
    const p = pts.filter(Boolean) as [number, number][]
    const out: [number, number, number][] = []
    const legs: [[number, number], [number, number]][] = []
    p.forEach((q, i) => {
      if (i === 0) { out.push([q[0], 2.7, q[1]]); return }
      const a = p[i - 1]
      out.push([q[0], 2.7, a[1]], [q[0], 2.7, q[1]])
      legs.push([a, [q[0], a[1]]], [[q[0], a[1]], q])
    })
    return { out, legs: legs.filter(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]) > 1.2) }
  }
  const diets = ['veg', 'nonveg', 'jain'] as const
  const waste = ['veg-cook', 'nv-cook', 'jain-cook']
  const hub: [number, number] = [CX - 3, CZ + 0.5]
  return (
    <group>
      {diets.map((d) => {
        const r = route(FLOW[d].map(ctr))
        return (
          <group key={d}>
            {r.out.length > 1 && <Line points={r.out} color={DIET_COLOR[d]} lineWidth={3} />}
            {r.legs.map((l, i) => <Arrow key={i} a={l[0]} b={l[1]} color={DIET_COLOR[d]} />)}
          </group>
        )
      })}
      {waste.map((id) => {
        const r = route([ctr(id), ctr('waste')])
        return r.out.length > 1 ? <Line key={id} points={r.out.map((p) => [p[0], 2.45, p[2]] as [number, number, number])} color="#8a6a4a" dashed dashSize={0.3} gapSize={0.2} lineWidth={2} /> : null
      })}
      {FIRE_EXITS.map((f) => {
        const r = route([hub, [f.x, f.z]])
        return <Line key={f.id} points={r.out.map((p) => [p[0], 2.2, p[2]] as [number, number, number])} color="#19c25a" dashed dashSize={0.35} gapSize={0.25} lineWidth={2} />
      })}
    </group>
  )
}

/* ---------- ducts from hoods to outer wall ---------- */
function Ducts() {
  const zones = useStore((s) => s.zones)
  return (
    <group>
      {zones.filter((z) => z.type === 'cooking').map((z) => {
        const cx = z.x + z.w / 2, cz = z.z + z.d / 2
        const toWest = cx - BX0 < BZ1 - cz
        const len = toWest ? cx - BX0 : BZ1 - cz
        return (
          <mesh key={z.id} material={mats().steelDark} castShadow
            position={toWest ? [(cx + BX0) / 2, CEIL - 0.25, cz] : [cx, CEIL - 0.25, (cz + BZ1) / 2]}
            rotation={toWest ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, len, 16]} />
          </mesh>
        )
      })}
    </group>
  )
}

/* ---------- camera rig ---------- */
function Rig() {
  const { camera, size } = useThree()
  const controls = useThree((s) => s.controls) as any
  const mode = useStore((s) => s.mode), started = useStore((s) => s.started), tourIdx = useStore((s) => s.tourIdx), zones = useStore((s) => s.zones)
  const anim = useRef<{ p0: THREE.Vector3; t0: THREE.Vector3; p1: THREE.Vector3; t1: THREE.Vector3; t: number; dur: number } | null>(null)
  const first = useRef(true)
  const aspect = size.width / size.height
  const tourIds = useMemo(() => TOUR.filter((id) => zones.some((z) => z.id === id)), [zones])
  useEffect(() => { camera.position.set(CX + 55, 42, CZ + 60) }, [camera])

  useEffect(() => {
    if (!started) return
    const dist = 27 * Math.max(1, 1.7 / aspect)
    let p: [number, number, number] = [CX, dist * 0.72, CZ + dist * 0.72]
    let t: [number, number, number] = [CX, 0, CZ]
    let dur = 1.6
    if (mode === 'blueprint') { p = [CX, Math.max(24, 36 / aspect), CZ + 0.01]; dur = 1.2 }
    if (mode === 'walk') { p = [14, 1.65, 6.6]; t = [8, 1.65, 6.6]; dur = 0.01 }
    if (mode === 'tour') {
      const z = zones.find((q) => q.id === tourIds[tourIdx % tourIds.length])
      if (z) { const cx = z.x + z.w / 2, cz = z.z + z.d / 2; p = [cx + 0.01, 4.8, cz + 6.2]; t = [cx, 0.8, cz]; dur = 2.4 }
    }
    if (mode === 'dollhouse' && first.current) { first.current = false; dur = 5 }
    const tg = controls?.target ?? new THREE.Vector3(CX, 0, CZ)
    anim.current = { p0: camera.position.clone(), t0: tg.clone(), p1: new THREE.Vector3(...p), t1: new THREE.Vector3(...t), t: 0, dur }
  }, [mode, started, tourIdx, tourIds, aspect, camera, controls, zones])

  useEffect(() => {
    if (mode !== 'tour') return
    const id = setInterval(() => useStore.setState((s) => ({ tourIdx: s.tourIdx + 1 })), 6500)
    return () => clearInterval(id)
  }, [mode])

  useFrame((_, dt) => {
    const a = anim.current
    if (!a) return
    a.t = Math.min(1, a.t + dt / a.dur)
    const e = a.t < 0.5 ? 4 * a.t ** 3 : 1 - (-2 * a.t + 2) ** 3 / 2
    camera.position.lerpVectors(a.p0, a.p1, e)
    if (controls) { controls.target.lerpVectors(a.t0, a.t1, e); controls.update() } else camera.lookAt(a.t1)
    if (a.t >= 1) anim.current = null
  })
  return null
}

/* ---------- walk + drag ---------- */
function Walker() {
  const { camera } = useThree()
  const mode = useStore((s) => s.mode)
  const zones = useStore((s) => s.zones)
  const keys = useRef<Record<string, boolean>>({})
  useEffect(() => {
    const d = (e: KeyboardEvent) => { keys.current[e.code] = true }
    const u = (e: KeyboardEvent) => { keys.current[e.code] = false }
    window.addEventListener('keydown', d); window.addEventListener('keyup', u)
    return () => { window.removeEventListener('keydown', d); window.removeEventListener('keyup', u) }
  }, [])
  const blockers = useMemo(() => {
    const R = 0.3, a: Seg[] = []
    zones.forEach((z) => {
      if (z.walled) wallSegs(z).segs.forEach((s) => a.push({ x1: Math.min(s.x1, s.x2) - R - 0.06, z1: Math.min(s.z1, s.z2) - R - 0.06, x2: Math.max(s.x1, s.x2) + R + 0.06, z2: Math.max(s.z1, s.z2) + R + 0.06 }))
      else if (z.type !== 'room') a.push({ x1: z.x - R, z1: z.z - R, x2: z.x + z.w + R, z2: z.z + z.d + R })
    })
    return a
  }, [zones])
  const hit = (x: number, zz: number) => x < BX0 + 0.4 || x > BX1 - 0.4 || zz < BZ0 + 0.4 || zz > BZ1 - 0.4 || blockers.some((b) => x > b.x1 && x < b.x2 && zz > b.z1 && zz < b.z2)
  const dir = useMemo(() => new THREE.Vector3(), [])
  useFrame((_, dt) => {
    if (mode !== 'walk') return
    const k = keys.current
    const f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0)
    const r = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0)
    camera.position.y = 1.65
    if (!f && !r) return
    camera.getWorldDirection(dir); dir.y = 0; dir.normalize()
    const sp = 3.2 * Math.min(dt, 0.05) * (k.ShiftLeft ? 1.8 : 1)
    const nx = camera.position.x + (dir.x * f - dir.z * r) * sp
    const nz = camera.position.z + (dir.z * f + dir.x * r) * sp
    if (!hit(nx, camera.position.z)) camera.position.x = nx
    if (!hit(camera.position.x, nz)) camera.position.z = nz
  })
  return null
}

function DragHandler() {
  const { raycaster, pointer, camera } = useThree()
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const v = useMemo(() => new THREE.Vector3(), [])
  useEffect(() => {
    const up = () => { if (useStore.getState().dragging) { useStore.setState({ dragging: false }); (window as any).__drag = null } }
    window.addEventListener('pointerup', up)
    return () => window.removeEventListener('pointerup', up)
  }, [])
  useFrame(() => {
    const d = (window as any).__drag
    if (!d || !useStore.getState().dragging) return
    raycaster.setFromCamera(pointer, camera)
    if (!raycaster.ray.intersectPlane(plane, v)) return
    const snap = (n: number) => Math.round(n * 2) / 2
    useStore.getState().patch(d.id, { x: snap(v.x - d.ox), z: snap(v.z - d.oz) })
  })
  return null
}

/* ---------- screenshot: grab the frame right after the composer has drawn it ---------- */
function ShotTaker() {
  useFrame(({ gl }) => {
    if (!useStore.getState().shot) return
    useStore.setState({ shot: false, shotUrl: gl.domElement.toDataURL('image/png') })
  }, 2)
  return null
}

/* ---------- main scene ---------- */
function World({ low }: { low: boolean }) {
  const zones = useStore((s) => s.zones)
  const mode = useStore((s) => s.mode)
  const ceiling = useStore((s) => s.ceiling)
  const compliance = useStore((s) => s.compliance)
  const dragging = useStore((s) => s.dragging)
  const { gl } = useThree()
  const bp = mode === 'blueprint'
  const full = mode === 'walk' || ceiling
  const wallH = full ? CEIL : 1.1
  const sunTarget = useMemo(() => { const o = new THREE.Object3D(); o.position.set(CX, 0, CZ); return o }, [])
  // The scene is static, so shadows are re-baked only when the layout or view changes.
  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    const id = setTimeout(() => { gl.shadowMap.needsUpdate = true }, 400)
    return () => clearTimeout(id)
  }, [gl, zones, mode, ceiling, wallH])
  return (
    <>
      <color attach="background" args={[bp ? '#0b2545' : '#0a1a1f']} />
      {!bp && (
        <>
          <Environment resolution={128}>
            <Lightformer form="rect" intensity={1.6} position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={[30, 14, 1]} />
            <Lightformer form="rect" intensity={0.8} position={[-12, 3, 0]} rotation-y={Math.PI / 2} scale={[14, 4, 1]} />
            <Lightformer form="rect" intensity={0.8} position={[12, 3, 0]} rotation-y={-Math.PI / 2} scale={[14, 4, 1]} />
          </Environment>
          <hemisphereLight args={['#ffffff', '#5c676b', 0.55]} />
          <directionalLight position={[CX + 12, 26, CZ + 8]} intensity={1.15} castShadow shadow-mapSize={[low ? 1024 : 2048, low ? 1024 : 2048]} shadow-bias={-0.0004} shadow-radius={3}
            shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-near={1} shadow-camera-far={70} target={sunTarget} />
          <primitive object={sunTarget} />
          <mesh position={[CX, -0.16, CZ]} receiveShadow><boxGeometry args={[BW + 1.2, 0.3, BD + 1.2]} /><meshStandardMaterial color="#14262c" roughness={0.8} /></mesh>
          <mesh rotation-x={-Math.PI / 2} position={[CX, 0, CZ]} receiveShadow>
            <planeGeometry args={[BW, BD]} />
            {mode === 'walk' && !low
              ? <MeshReflectorMaterial blur={[200, 60]} resolution={384} mixBlur={1} mixStrength={0.5} mirror={0.5} roughness={0.55} depthScale={0.5} minDepthThreshold={0.4} maxDepthThreshold={1.3} color="#a9afb1" metalness={0.25} />
              : <meshStandardMaterial color="#aab1b3" roughness={0.28} metalness={0.2} envMapIntensity={0.9} />}
          </mesh>
          <Shell h={wallH} />
          <Ducts />
          {full && <Ceiling />}
        </>
      )}
      {bp && <Blueprint />}
      {zones.map((z) => <ZoneView key={z.id} z={z} wallH={wallH} low={low} />)}
      {compliance && !bp && <Compliance />}
      <Rig /><Walker /><DragHandler /><ShotTaker />
      <OrbitControls makeDefault enabled={!dragging && mode !== 'walk'} enableRotate={!bp} screenSpacePanning={bp} maxPolarAngle={Math.PI / 2.05} minDistance={3} maxDistance={90} enableDamping dampingFactor={0.07} rotateSpeed={0.6} zoomSpeed={0.7} />
      {mode === 'walk' && <PointerLockControls />}
    </>
  )
}

export default function Scene({ onLost }: { onLost: () => void }) {
  const low = useMemo(isLow, [])
  const [factor, setFactor] = useState(1)
  const select = useStore((s) => s.select)
  const maxDpr = low ? 1.25 : Math.min(1.5, window.devicePixelRatio || 1)
  const dpr = 1 + (maxDpr - 1) * factor
  const useAO = !low && factor > 0.5
  return (
    <Canvas
      shadows dpr={dpr}
      gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping }}
      camera={{ position: [CX + 55, 42, CZ + 60], fov: 40, near: 0.1, far: 250 }}
      onPointerMissed={() => select(null)}
      onCreated={({ gl }) => {
        glRef.current = gl
        gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onLost() })
        setTimeout(() => useStore.setState({ ready: true }), 600)
      }}
    >
      <PerformanceMonitor onChange={({ factor: f }) => setFactor(f)} flipflops={3} onFallback={() => setFactor(0)} />
      <World low={low} />
      <EffectComposer multisampling={0} enableNormalPass={false}>
        {useAO ? <N8AO aoRadius={1.0} distanceFalloff={1} intensity={2.2} quality="performance" halfRes /> : <></>}
        <Bloom luminanceThreshold={1.1} mipmapBlur intensity={0.35} />
        <SMAA />
        <Vignette offset={0.3} darkness={0.5} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  )
}
