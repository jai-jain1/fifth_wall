import { create } from 'zustand'
import { LAYOUT, Zone, ZoneType, Diet } from '../data/layout'

export type Mode = 'dollhouse' | 'blueprint' | 'walk' | 'tour'
export type Panel = 'zone' | 'budget' | 'diet' | null
const KEY = 'fifthwall-layout-v1'

const load = (): Zone[] => {
  try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s) } catch { /* ignore */ }
  return LAYOUT
}

interface State {
  zones: Zone[]
  past: Zone[][]
  future: Zone[][]
  selected: string | null
  mode: Mode
  diet: Diet | null
  edit: boolean
  ceiling: boolean
  compliance: boolean
  panel: Panel
  started: boolean
  ready: boolean
  dragging: boolean
  tourIdx: number
  toast: string
  shot: boolean
  shotUrl: string
  set: (p: Partial<State>) => void
  select: (id: string | null) => void
  snapshot: () => void
  patch: (id: string, p: Partial<Zone>) => void
  add: (type: ZoneType) => void
  remove: (id: string) => void
  undo: () => void
  redo: () => void
  reset: () => void
  save: () => void
  importJson: (s: string) => void
}

export const useStore = create<State>((set, get) => ({
  zones: load(), past: [], future: [], selected: null, mode: 'dollhouse', diet: null,
  edit: false, ceiling: false, compliance: false, panel: null, started: false, ready: false,
  dragging: false, tourIdx: 0, toast: '', shot: false, shotUrl: '',
  set: (p) => set(p),
  select: (id) => set({ selected: id, panel: id ? 'zone' : get().panel === 'zone' ? null : get().panel }),
  snapshot: () => set((s) => ({ past: [...s.past.slice(-49), s.zones], future: [] })),
  patch: (id, p) => set((s) => ({ zones: s.zones.map((z) => (z.id === id ? { ...z, ...p } : z)) })),
  add: (type) => {
    get().snapshot()
    const id = 'z' + Date.now().toString(36)
    const z: Zone = { id, name: 'New ' + type, type, x: 10, z: 7, w: type === 'cooking' ? 4 : 3, d: type === 'cooking' ? 1 : 2, walled: type === 'room', door: 's' }
    set((s) => ({ zones: [...s.zones, z], selected: id, panel: 'zone' }))
  },
  remove: (id) => { get().snapshot(); set((s) => ({ zones: s.zones.filter((z) => z.id !== id), selected: null, panel: null })) },
  undo: () => set((s) => (s.past.length ? { zones: s.past[s.past.length - 1], past: s.past.slice(0, -1), future: [s.zones, ...s.future] } : s)),
  redo: () => set((s) => (s.future.length ? { zones: s.future[0], future: s.future.slice(1), past: [...s.past, s.zones] } : s)),
  reset: () => { get().snapshot(); set({ zones: LAYOUT, selected: null, toast: 'Layout reset' }); localStorage.removeItem(KEY) },
  save: () => { try { localStorage.setItem(KEY, JSON.stringify(get().zones)); set({ toast: 'Layout saved in this browser' }) } catch { set({ toast: 'Could not save' }) } },
  importJson: (s) => {
    try {
      const a = JSON.parse(s)
      if (!Array.isArray(a) || !a.every((z) => z && typeof z.id === 'string' && typeof z.x === 'number' && typeof z.w === 'number')) throw new Error()
      get().snapshot(); set({ zones: a, selected: null, toast: 'Layout imported' })
    } catch { set({ toast: 'That file is not a valid layout JSON' }) }
  },
}))
