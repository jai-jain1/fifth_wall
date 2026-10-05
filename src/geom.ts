import { Zone, Side } from './data/layout'

export interface Seg { x1: number; z1: number; x2: number; z2: number }
export interface DoorInfo { x: number; z: number; alongX: boolean; gap: number }
export const GAP = 1.0

/** Wall segments of a walled zone, with a gap where its door is. Used for rendering AND collision. */
export function wallSegs(z: Zone): { segs: Seg[]; door?: DoorInfo } {
  const { x, z: y, w, d } = z
  const doorSide: Side = z.door ?? 's'
  const out: { segs: Seg[]; door?: DoorInfo } = { segs: [] }
  const side = (s: Side, a: [number, number], b: [number, number]) => {
    if (doorSide !== s) { out.segs.push({ x1: a[0], z1: a[1], x2: b[0], z2: b[1] }); return }
    const alongX = a[1] === b[1]
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2
    const len = alongX ? Math.abs(b[0] - a[0]) : Math.abs(b[1] - a[1])
    const g = Math.min(GAP, len * 0.6)
    if (alongX) out.segs.push({ x1: a[0], z1: mz, x2: mx - g / 2, z2: mz }, { x1: mx + g / 2, z1: mz, x2: b[0], z2: mz })
    else out.segs.push({ x1: mx, z1: a[1], x2: mx, z2: mz - g / 2 }, { x1: mx, z1: mz + g / 2, x2: mx, z2: b[1] })
    out.door = { x: mx, z: mz, alongX, gap: g }
  }
  side('n', [x, y], [x + w, y])
  side('s', [x, y + d], [x + w, y + d])
  side('w', [x, y], [x, y + d])
  side('e', [x + w, y], [x + w, y + d])
  return out
}
