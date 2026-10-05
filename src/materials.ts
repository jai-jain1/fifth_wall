import * as THREE from 'three'

function canvas(n = 256) {
  const c = document.createElement('canvas')
  c.width = c.height = n
  return [c, c.getContext('2d')!] as const
}
function finish(c: HTMLCanvasElement, srgb: boolean) {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 8
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  return t
}

let tile: THREE.CanvasTexture | null = null
/** White glazed tile (0.3 m) with grout lines, drawn procedurally. */
export function tileTexture() {
  if (tile) return tile
  const [c, g] = canvas()
  g.fillStyle = '#f2f3f0'; g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.03})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2) }
  g.strokeStyle = '#a9afac'; g.lineWidth = 6; g.strokeRect(0, 0, 256, 256)
  return (tile = finish(c, true))
}

let brush: THREE.CanvasTexture | null = null
/** Brushed-steel normal map: fine horizontal streaks. */
export function brushedNormal() {
  if (brush) return brush
  const [c, g] = canvas()
  g.fillStyle = '#8080ff'; g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgb(${110 + Math.random() * 36},${118 + Math.random() * 20},255)`
    g.fillRect(Math.random() * 256, Math.random() * 256, 20 + Math.random() * 120, 1)
  }
  const t = finish(c, false); t.repeat.set(2, 2); return (brush = t)
}

let M: ReturnType<typeof build> | null = null
function build() {
  return {
    steel: new THREE.MeshStandardMaterial({ color: '#c6cacd', metalness: 1, roughness: 0.32, normalMap: brushedNormal(), normalScale: new THREE.Vector2(0.35, 0.12), envMapIntensity: 1.3 }),
    steelDark: new THREE.MeshStandardMaterial({ color: '#8d9296', metalness: 1, roughness: 0.4, normalMap: brushedNormal(), envMapIntensity: 1.1 }),
    basin: new THREE.MeshStandardMaterial({ color: '#2c3033', metalness: 1, roughness: 0.28 }),
    paint: new THREE.MeshStandardMaterial({ color: '#d9d4c8', roughness: 0.92, envMapIntensity: 0.6 }),
    door: new THREE.MeshStandardMaterial({ color: '#E36414', roughness: 0.5 }),
    black: new THREE.MeshStandardMaterial({ color: '#16191b', roughness: 0.6 }),
    grey: new THREE.MeshStandardMaterial({ color: '#7e8488', metalness: 0.6, roughness: 0.45 }),
    glass: new THREE.MeshStandardMaterial({ color: '#cfe8f2', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35 }),
    frame: new THREE.MeshStandardMaterial({ color: '#f5f5f5', roughness: 0.5 }),
    carton: new THREE.MeshStandardMaterial({ color: '#b98d58', roughness: 0.85 }),
    ceiling: new THREE.MeshStandardMaterial({ color: '#e4e2dc', roughness: 0.95 }),
    redArrow: new THREE.MeshStandardMaterial({ color: '#e11d2e', emissive: '#e11d2e', emissiveIntensity: 1.2 }),
    led: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff6e8', emissiveIntensity: 1.6 }),
    flame: new THREE.MeshStandardMaterial({ color: '#ff9a3c', emissive: '#ff6a00', emissiveIntensity: 3, transparent: true, opacity: 0.9 }),
    exit: new THREE.MeshStandardMaterial({ color: '#19c25a', emissive: '#19c25a', emissiveIntensity: 2.2 }),
  }
}
export const mats = () => (M ??= build())

/** A tiled material sized for a wall of the given length/height. */
const tileCache = new Map<string, THREE.MeshStandardMaterial>()
export function tileMat(len: number, h: number) {
  const key = `${len.toFixed(1)}_${h.toFixed(2)}`
  const hit = tileCache.get(key)
  if (hit) return hit
  const t = tileTexture().clone()
  t.needsUpdate = true
  t.repeat.set(Math.max(1, len / 0.3), Math.max(1, h / 0.3))
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.2, metalness: 0.02, envMapIntensity: 0.6 })
  tileCache.set(key, m)
  return m
}
