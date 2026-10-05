import { useEffect, useState } from 'react'
import Scene from './components/Scene'
import Hud from './components/Hud'
import { useStore, Mode } from './store/useStore'
import { Diet } from './data/layout'

function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false }
}

export default function App() {
  const [ok] = useState(hasWebGL)
  const [key, setKey] = useState(0)
  const [lost, setLost] = useState(false)

  useEffect(() => {
    const p = new URLSearchParams(location.hash.slice(1))
    const v = p.get('v') as Mode | null
    const patch: Partial<ReturnType<typeof useStore.getState>> = {}
    if (v && ['dollhouse', 'blueprint', 'tour'].includes(v)) patch.mode = v
    const d = p.get('d'); if (d === 'veg' || d === 'nonveg' || d === 'jain') { patch.diet = d as Diet; patch.panel = 'diet' }
    const z = p.get('z'); if (z && useStore.getState().zones.some((q) => q.id === z)) { patch.selected = z; patch.panel = 'zone' }
    if (p.get('c') === '1') patch.ceiling = true
    useStore.setState(patch)
  }, [])

  if (!ok) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center" style={{ background: '#071317' }}>
        <div className="max-w-md">
          <div className="font-display text-3xl mb-3">The Fifth Wall</div>
          <p className="text-white/80">This walkthrough needs WebGL, and your browser or device has it turned off. Try the latest Chrome, Edge, Safari or Firefox, and check that hardware acceleration is on.</p>
        </div>
      </div>
    )
  }
  return (
    <div className="h-full w-full relative">
      <Scene key={key} onLost={() => setLost(true)} />
      <Hud />
      {lost && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 text-center p-6">
          <div className="glass rounded-2xl p-6 max-w-sm">
            <div className="font-display text-2xl mb-2">The graphics context was lost</div>
            <p className="text-sm text-white/75 mb-4">This usually happens when the GPU is busy or the tab was in the background. Reload the 3D view to continue.</p>
            <button className="btn on" onClick={() => { setLost(false); setKey((k) => k + 1) }}>Reload 3D view</button>
          </div>
        </div>
      )}
    </div>
  )
}
