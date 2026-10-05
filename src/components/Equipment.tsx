import { memo, useMemo } from 'react'
import { RoundedBox, Instances, Instance, Sparkles } from '@react-three/drei'
import { Zone, DIET_COLOR, CEIL } from '../data/layout'
import { mats } from '../materials'

type V3 = [number, number, number]
type MatKey = keyof ReturnType<typeof mats>

/** Beveled box: every piece of equipment is a RoundedBox so edges catch light. */
function B({ s, p, m = 'steel', c, r = 0.02, rough = 0.5 }: { s: V3; p: V3; m?: MatKey; c?: string; r?: number; rough?: number }) {
  const radius = Math.max(0.002, Math.min(r, Math.min(...s) / 2 - 0.002))
  return c ? (
    <RoundedBox args={s} position={p} radius={radius} smoothness={3} castShadow receiveShadow>
      <meshStandardMaterial color={c} roughness={rough} />
    </RoundedBox>
  ) : (
    <RoundedBox args={s} position={p} radius={radius} smoothness={3} castShadow receiveShadow material={mats()[m]} />
  )
}

const Flat = ({ w, d, p, c, em = 0 }: { w: number; d: number; p: V3; c: string; em?: number }) => (
  <mesh rotation-x={-Math.PI / 2} position={p} receiveShadow>
    <planeGeometry args={[w, d]} />
    <meshStandardMaterial color={c} emissive={c} emissiveIntensity={em} roughness={0.4} polygonOffset polygonOffsetFactor={-2} />
  </mesh>
)

function Cooking({ L, T, col }: { L: number; T: number; col: string }) {
  const n = Math.max(1, Math.floor((L - 0.2) / 1.0))
  const dep = Math.min(0.75, T - 0.1)
  return (
    <>
      <Flat w={L} d={0.1} p={[0, 0.02, T / 2 - 0.08]} c="#3a3f42" />
      <B s={[L - 0.15, 0.9, dep]} p={[0, 0.45, 0]} />
      <B s={[L - 0.12, 0.05, dep + 0.04]} p={[0, 0.92, 0]} m="steelDark" />
      {Array.from({ length: n }, (_, i) => {
        const x = n > 1 ? (i - (n - 1) / 2) * ((L - 0.4) / (n - 1)) : 0
        return (
          <group key={i} position={[x, 0.95, 0]}>
            <mesh castShadow material={mats().black}><cylinderGeometry args={[0.17, 0.17, 0.04, 20]} /></mesh>
            <mesh position={[0, 0.03, 0]} rotation-x={Math.PI / 2} material={mats().flame}><torusGeometry args={[0.09, 0.018, 8, 22]} /></mesh>
          </group>
        )
      })}
      <B s={[L - 0.15, 0.9, 0.05]} p={[0, 1.4, -T / 2 + 0.06]} />
      <B s={[L * 0.5, 0.05, 0.1]} p={[0, 1.65, -T / 2 + 0.16]} c={col} />
      <B s={[L - 0.1, 0.45, Math.min(0.95, T)]} p={[0, 2.2, 0]} r={0.05} />
      <mesh position={[0, (2.4 + CEIL) / 2, 0]} castShadow material={mats().steelDark}>
        <cylinderGeometry args={[0.2, 0.2, CEIL - 2.4, 18]} />
      </mesh>
      <Sparkles count={Math.min(40, Math.round(L * 7))} scale={[L - 0.3, 0.7, 0.5]} position={[0, 1.55, 0]} size={7} speed={0.25} opacity={0.35} color="#ffffff" />
    </>
  )
}

function Prep({ L, T, col }: { L: number; T: number; col: string }) {
  const dep = Math.min(T * 0.8, 0.8)
  const boards = Math.max(1, Math.floor(L / 1.4))
  return (
    <>
      <B s={[L - 0.1, 0.06, dep]} p={[0, 0.9, 0]} />
      {[-1, 1].flatMap((a) => [-1, 1].map((b) => (
        <mesh key={`${a}${b}`} position={[a * (L / 2 - 0.12), 0.43, b * (dep / 2 - 0.06)]} castShadow material={mats().steelDark}>
          <cylinderGeometry args={[0.025, 0.025, 0.86, 10]} />
        </mesh>
      )))}
      <B s={[L - 0.25, 0.03, dep - 0.1]} p={[0, 0.25, 0]} m="steelDark" />
      {Array.from({ length: boards }, (_, i) => (
        <B key={i} s={[0.45, 0.03, 0.3]} p={[(i - (boards - 1) / 2) * 1.3, 0.95, 0]} c={col} rough={0.7} />
      ))}
      <B s={[0.5, 0.04, 0.08]} p={[L / 2 - 0.45, 0.96, -dep / 2 + 0.1]} c={col} />
    </>
  )
}

function Storage({ L, T, z }: { L: number; T: number; z: Zone }) {
  const depth = Math.max(0.3, Math.min(T - 0.3, 0.6))
  const n = Math.max(1, Math.floor(L / 1.25))
  const pitch = L / n
  const rw = Math.max(0.5, Math.min(1.1, pitch - 0.15))
  const name = z.name.toLowerCase()
  const palette = name.includes('freezer') ? ['#b9d8ea', '#8fbad6']
    : name.includes('cold') ? ['#2E9E4F', '#E8A317', '#cfe4ee']
    : name.includes('waste') ? ['#2c3b44', '#55646d']
    : name.includes('dry') ? ['#2E9E4F', '#D13B3B', '#E8A317']
    : name.includes('pack') || name.includes('bulk') || name.includes('receiv') ? ['#b98d58', '#cdb08a', '#e9e5dc']
    : ['#d9dde0']
  const col = z.diet ? DIET_COLOR[z.diet] : null
  const crates = useMemo(() => {
    const a: { p: V3; c: string }[] = []
    let k = 0
    for (let i = 0; i < n; i++) for (let s = 0; s < 3; s++) for (let j = 0; j < 2; j++) {
      a.push({ p: [(i - (n - 1) / 2) * pitch + (j - 0.5) * (rw / 2.1), 0.2 + s * 0.5 + 0.17, 0], c: col ?? palette[k++ % palette.length] })
    }
    return a
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, pitch, rw, col, z.name])
  return (
    <>
      <Flat w={L} d={0.06} p={[0, 0.02, T / 2 - 0.05]} c="#e8c53a" />
      {Array.from({ length: n }, (_, i) => {
        const x = (i - (n - 1) / 2) * pitch
        return (
          <group key={i} position={[x, 0, 0]}>
            {[-1, 1].flatMap((a) => [-1, 1].map((b) => (
              <B key={`${a}${b}`} s={[0.04, 1.85, 0.04]} p={[a * rw / 2, 0.925, b * depth / 2]} m="steelDark" r={0.01} />
            )))}
            {[0.2, 0.7, 1.2, 1.78].map((y) => <B key={y} s={[rw, 0.025, depth]} p={[0, y, 0]} m="steelDark" r={0.008} />)}
          </group>
        )
      })}
      <Instances limit={200} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.28, Math.min(0.34, depth - 0.05)]} />
        <meshStandardMaterial roughness={0.55} />
        {crates.map((c, i) => <Instance key={i} position={c.p} color={c.c} />)}
      </Instances>
    </>
  )
}

function Washing({ L, T }: { L: number; T: number }) {
  const n = Math.max(1, Math.min(4, Math.floor(L / 0.9)))
  const dep = Math.min(T * 0.7, 0.8)
  return (
    <>
      <Flat w={L} d={0.1} p={[0, 0.02, T / 2 - 0.08]} c="#3a3f42" />
      <B s={[L - 0.1, 0.9, dep]} p={[0, 0.45, 0]} />
      {Array.from({ length: n }, (_, i) => {
        const x = (i - (n - 1) / 2) * (L / (n + 0.3))
        return (
          <group key={i} position={[x, 0.92, 0]}>
            <B s={[0.6, 0.05, Math.min(0.5, dep - 0.1)]} p={[0, 0.01, 0]} m="basin" />
            <mesh position={[0, 0.2, -dep / 2 + 0.1]} material={mats().steel}><cylinderGeometry args={[0.02, 0.02, 0.4, 10]} /></mesh>
            <mesh position={[0, 0.4, -dep / 2 + 0.2]} rotation-x={Math.PI / 2} material={mats().steel}><cylinderGeometry args={[0.018, 0.018, 0.22, 10]} /></mesh>
          </group>
        )
      })}
      <B s={[L - 0.1, 0.35, 0.04]} p={[0, 1.2, -dep / 2 + 0.02]} />
    </>
  )
}

function Packing({ L, T }: { L: number; T: number }) {
  const dep = Math.min(T * 0.6, 0.9)
  const stacks = Math.max(1, Math.floor(L / 0.9))
  const cartons = useMemo(() => {
    const a: V3[] = []
    for (let i = 0; i < stacks; i++) for (let k = 0; k < 1 + (i % 3); k++) a.push([(i - (stacks - 1) / 2) * 0.85, 1.08 + k * 0.3, 0])
    return a
  }, [stacks])
  return (
    <>
      <B s={[L - 0.2, 0.9, dep]} p={[0, 0.45, 0]} />
      <B s={[L - 0.18, 0.05, dep + 0.04]} p={[0, 0.92, 0]} m="steelDark" />
      <Instances limit={120} castShadow receiveShadow material={mats().carton}>
        <boxGeometry args={[0.42, 0.28, Math.min(0.32, dep - 0.1)]} />
        {cartons.map((p, i) => <Instance key={i} position={p} />)}
      </Instances>
    </>
  )
}

function Room({ z }: { z: Zone }) {
  const n = z.name.toLowerCase()
  const lockers = useMemo(() => Array.from({ length: Math.max(0, Math.floor((z.w - 0.5) / 0.45)) }, (_, i) => i), [z.w])
  if (n.includes('locker')) {
    return (
      <>
        <Instances limit={60} castShadow receiveShadow>
          <boxGeometry args={[0.4, 1.8, 0.45]} />
          <meshStandardMaterial color="#5d7a85" metalness={0.6} roughness={0.4} />
          {lockers.map((i) => <Instance key={i} position={[(i - (lockers.length - 1) / 2) * 0.45, 0.9, z.d / 2 - 0.35]} />)}
        </Instances>
        <Instances limit={60} material={mats().black}>
          <boxGeometry args={[0.28, 0.03, 0.02]} />
          {lockers.map((i) => <Instance key={i} position={[(i - (lockers.length - 1) / 2) * 0.45, 1.6, z.d / 2 - 0.12]} />)}
        </Instances>
        <B s={[Math.min(2.4, z.w - 1), 0.45, 0.4]} p={[0, 0.22, 0]} c="#c9b79c" rough={0.8} />
      </>
    )
  }
  if (n.includes('it room')) {
    return (
      <>
        {[-0.9, 0, 0.9].map((o) => (
          <group key={o} position={[z.w / 2 - 0.55, 0, o]}>
            <B s={[0.6, 2.0, 0.9]} p={[0, 1, 0]} c="#1b1f22" />
            <mesh position={[-0.31, 1.5, 0]} material={mats().exit}><boxGeometry args={[0.02, 0.5, 0.05]} /></mesh>
          </group>
        ))}
      </>
    )
  }
  if (n.includes('electrical')) {
    return (
      <>
        {[-0.6, 0.6].map((o) => (
          <group key={o} position={[z.w / 2 - 0.2, 0, o]}>
            <B s={[0.25, 1.8, 0.8]} p={[0, 0.9, 0]} m="grey" />
            <B s={[0.02, 0.2, 0.6]} p={[-0.13, 1.4, 0]} m="door" />
          </group>
        ))}
      </>
    )
  }
  if (n.includes('freezer') || n.includes('cold')) {
    return (
      <>
        <Flat w={z.w - 0.2} d={z.d - 0.2} p={[0, 0.025, 0]} c="#cfe6f0" />
        <Storage L={Math.max(z.w, z.d) - 0.5} T={Math.min(z.w, z.d) - 0.5} z={z} />
      </>
    )
  }
  if (n.includes('lift')) return <B s={[1.1, 2.2, 0.06]} p={[0, 1.1, -z.d / 2 + 0.05]} />
  if (n.includes('clean')) return (
    <>
      <B s={[0.7, 0.5, 0.55]} p={[0, 0.25, z.d / 2 - 0.4]} />
      <B s={[0.7, 0.05, 0.5]} p={[0, 0.52, z.d / 2 - 0.4]} m="basin" />
      <B s={[1.2, 0.04, 0.3]} p={[0, 1.4, z.d / 2 - 0.2]} m="steelDark" />
    </>
  )
  if (n.includes('changing') || n.includes('washroom')) {
    const k = Math.max(1, Math.floor(z.w / 1.3))
    return (
      <>
        {Array.from({ length: k }, (_, i) => (
          <B key={i} s={[0.04, 2.0, 1.2]} p={[(i - (k - 1) / 2) * 1.3, 1, -z.d / 2 + 0.7]} c="#f1f1ee" rough={0.6} />
        ))}
      </>
    )
  }
  return null
}

export const Equipment = memo(function Equipment({ z }: { z: Zone }) {
  const L = Math.max(z.w, z.d), T = Math.min(z.w, z.d)
  const col = z.diet ? DIET_COLOR[z.diet] : '#9aa5a8'
  if (z.type === 'room') return <Room z={z} />
  return (
    <group rotation-y={z.w >= z.d ? 0 : Math.PI / 2}>
      {z.type === 'cooking' && <Cooking L={L} T={T} col={col} />}
      {z.type === 'prep' && <Prep L={L} T={T} col={col} />}
      {z.type === 'storage' && <Storage L={L} T={T} z={z} />}
      {z.type === 'washing' && <Washing L={L} T={T} />}
      {z.type === 'packing' && <Packing L={L} T={T} />}
    </group>
  )
})

export { Flat, B }
