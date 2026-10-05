import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProgress } from '@react-three/drei'
import { useStore, Mode } from '../store/useStore'
import { DIET_COLOR, DIET_LABEL, Diet, TYPE_INFO, ZoneType, sqft, TOUR } from '../data/layout'
import { HEADS, DESIGN_FEE, CONTINGENCY, REFURB_FACTOR, fitOut } from '../data/budget'
import { glRef } from '../glRef'
import { useEffect, useState } from 'react'

const MODES: { id: Mode; label: string }[] = [
  { id: 'dollhouse', label: 'Dollhouse' }, { id: 'blueprint', label: 'Blueprint' },
  { id: 'walk', label: 'Walk' }, { id: 'tour', label: 'Guided tour' },
]
const lakh = (n: number) => n.toFixed(2)
const DIETS: Diet[] = ['veg', 'nonveg', 'jain']
const TYPES: ZoneType[] = ['cooking', 'prep', 'storage', 'room', 'packing', 'washing']

function download(href: string, name: string) {
  const a = document.createElement('a'); a.href = href; a.download = name; a.click()
}

function Intro() {
  const { started, ready } = useStore()
  const { progress } = useProgress()
  const pct = ready ? 100 : Math.max(12, Math.round(progress))
  return (
    <AnimatePresence>
      {!started && (
        <motion.div key="intro" exit={{ opacity: 0 }} transition={{ duration: 1.2 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-6"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, #0F4C5C 0%, #071317 70%)' }}>
          <div className="font-display text-5xl md:text-7xl tracking-tight" style={{ fontWeight: 400 }}>The Fifth Wall</div>
          <div className="mt-3 text-sm md:text-base text-white/70 max-w-md">A 3,000 sq ft cloud kitchen, eighth floor. Walk through the proposed layout before a single wall is built.</div>
          <div className="mt-10 w-56 h-[3px] bg-white/15 rounded overflow-hidden"><div className="h-full bg-[#E36414] transition-all duration-500" style={{ width: pct + '%' }} /></div>
          <div className="mt-2 text-xs text-white/50">{ready ? 'Ready' : 'Preparing the scene'}</div>
          <button className="btn mt-8 !px-6 !py-3 !text-base !bg-[#E36414] !border-[#E36414] disabled:!opacity-40" disabled={!ready} onClick={() => useStore.setState({ started: true })}>Enter the kitchen</button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ZonePanel() {
  const { zones, selected, edit, patch, remove, snapshot } = useStore()
  const z = zones.find((q) => q.id === selected)
  if (!z) return null
  const info = TYPE_INFO[z.type]
  const heads = HEADS.filter((h) => info.heads.includes(h.name))
  const foc = () => snapshot()
  return (
    <div className="space-y-3">
      {edit ? <input value={z.name} onFocus={foc} onChange={(e) => patch(z.id, { name: e.target.value })} aria-label="Zone name" /> : <h2 className="font-display text-2xl leading-tight">{z.name}</h2>}
      <div className="flex gap-2 flex-wrap text-xs">
        <span className="chip" style={{ cursor: 'default' }}>{Math.round(sqft(z))} sq ft</span>
        <span className="chip" style={{ cursor: 'default' }}>{z.w.toFixed(1)} × {z.d.toFixed(1)} m</span>
        {z.diet && <span className="chip" style={{ cursor: 'default', background: DIET_COLOR[z.diet] }}>{DIET_LABEL[z.diet]}</span>}
      </div>
      <p className="text-sm text-white/80">{info.purpose}</p>
      <div>
        <div className="text-xs text-white/50 mb-1">Key equipment</div>
        <ul className="text-sm list-disc pl-5 space-y-0.5">{info.equipment.map((e) => <li key={e}>{e}</li>)}</ul>
      </div>
      <div>
        <div className="text-xs text-white/50 mb-1">Related budget heads (Rs lakh, whole project)</div>
        <table className="w-full text-sm"><tbody>{heads.map((h) => <tr key={h.name} className="border-t border-white/10"><td className="py-1">{h.name}</td><td className="text-right">{lakh(h.lakh)}</td></tr>)}</tbody></table>
      </div>
      {edit && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs">Type<select value={z.type} onChange={(e) => { snapshot(); patch(z.id, { type: e.target.value as ZoneType, walled: e.target.value === 'room' }) }}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label className="text-xs">Diet tag<select value={z.diet ?? ''} onChange={(e) => { snapshot(); patch(z.id, { diet: (e.target.value || undefined) as Diet | undefined }) }}><option value="">None</option>{DIETS.map((d) => <option key={d} value={d}>{DIET_LABEL[d]}</option>)}</select></label>
            <label className="text-xs">Width (m)<input type="number" step={0.5} min={1} value={z.w} onFocus={foc} onChange={(e) => patch(z.id, { w: Math.max(1, +e.target.value || 1) })} /></label>
            <label className="text-xs">Depth (m)<input type="number" step={0.5} min={1} value={z.d} onFocus={foc} onChange={(e) => patch(z.id, { d: Math.max(1, +e.target.value || 1) })} /></label>
          </div>
          <div className="flex gap-2">
            <button className="btn" onClick={() => { snapshot(); patch(z.id, { w: z.d, d: z.w }) }}>Rotate 90°</button>
            <button className="btn" onClick={() => remove(z.id)}>Delete zone</button>
          </div>
          <div className="text-xs text-white/50">Drag the zone in the 3D view to move it. Positions snap to 0.5 m.</div>
        </div>
      )}
    </div>
  )
}

function BudgetPanel() {
  const [refurb, setRefurb] = useState(false)
  const total = (r: boolean) => fitOut(r) + DESIGN_FEE + CONTINGENCY
  return (
    <div className="space-y-3">
      <h2 className="font-display text-2xl">Materials and budget</h2>
      <div className="text-3xl font-display">Rs {lakh(total(false))} L <span className="text-sm font-sans text-white/60">all-in, new equipment</span></div>
      <div className="flex gap-2"><button className={'btn ' + (!refurb ? 'on' : '')} onClick={() => setRefurb(false)}>New</button><button className={'btn ' + (refurb ? 'on' : '')} onClick={() => setRefurb(true)}>Refurbished mix</button></div>
      <table className="w-full text-sm">
        <thead><tr className="text-xs text-white/50"><th className="text-left font-normal">Head (Rs lakh)</th><th className="text-right font-normal">New</th><th className="text-right font-normal">Refurb.</th></tr></thead>
        <tbody>
          {HEADS.map((h) => (
            <tr key={h.name} className="border-t border-white/10"><td className="py-1">{h.name}</td><td className="text-right">{lakh(h.lakh)}</td><td className="text-right text-white/70">{h.equipment ? lakh(h.lakh * REFURB_FACTOR) : lakh(h.lakh)}</td></tr>
          ))}
          <tr className="border-t border-white/30 font-semibold"><td className="py-1">Fit-out (17 heads)</td><td className="text-right">{lakh(fitOut(false))}</td><td className="text-right">{lakh(fitOut(true))}</td></tr>
          <tr className="border-t border-white/10"><td className="py-1">Design fee</td><td className="text-right">{lakh(DESIGN_FEE)}</td><td className="text-right">{lakh(DESIGN_FEE)}</td></tr>
          <tr className="border-t border-white/10"><td className="py-1">Contingency</td><td className="text-right">{lakh(CONTINGENCY)}</td><td className="text-right">{lakh(CONTINGENCY)}</td></tr>
          <tr className="border-t border-white/30 font-semibold text-[#E36414]"><td className="py-1">Total</td><td className="text-right">{lakh(total(false))}</td><td className="text-right">{lakh(total(true))}</td></tr>
        </tbody>
      </table>
      <p className="text-xs text-white/50">Estimates, not quotes. The refurbished column assumes refurbished cooking, refrigeration, SS, packing/IT and cold-room items cost about {Math.round((1 - REFURB_FACTOR) * 100)}% less. That factor is an illustrative placeholder to be confirmed with vendor quotes.</p>
    </div>
  )
}

function DietPanel() {
  const { diet, set } = useStore()
  return (
    <div className="space-y-3">
      <h2 className="font-display text-2xl">Diet separation</h2>
      <p className="text-sm text-white/80">Veg, Non-Veg and Jain each get their own cooking line and prep table. Jain and Non-Veg sit at opposite ends of the kitchen.</p>
      <div className="flex gap-2 flex-wrap">
        <button className={'btn ' + (!diet ? 'on' : '')} onClick={() => set({ diet: null })}>All</button>
        {DIETS.map((d) => <button key={d} className="btn" style={diet === d ? { background: DIET_COLOR[d], borderColor: DIET_COLOR[d] } : { borderColor: DIET_COLOR[d] }} onClick={() => set({ diet: d })}>{DIET_LABEL[d]}</button>)}
      </div>
      <ul className="text-sm list-disc pl-5 space-y-1">
        <li>Separate utensils for each line, stored on that line's rack.</li>
        <li>Separate oil and cooking media per line.</li>
        <li>Separate knives and colour-coded chopping boards per prep table.</li>
        <li>Freezer is Non-Veg only. Cold storage has separate Veg and Jain shelves.</li>
      </ul>
      <div className="text-xs text-white/60">Green = Veg, red = Non-Veg, amber = Jain. Used on floor strips, boards, crates and labels.</div>
    </div>
  )
}

function Panels() {
  const { panel, set, select } = useStore()
  const close = () => { if (panel === 'diet') set({ panel: null, diet: null }); else if (panel === 'zone') select(null); else set({ panel: null }) }
  return (
    <AnimatePresence>
      {panel && (
        <motion.aside key={panel} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.25 }}
          className="glass fixed z-30 inset-x-2 bottom-28 max-h-[48vh] md:inset-x-auto md:right-4 md:top-20 md:bottom-20 md:w-[380px] md:max-h-none rounded-2xl p-5 overflow-y-auto">
          <button className="btn absolute right-3 top-3" onClick={close} aria-label="Close panel">Close</button>
          {panel === 'zone' && <ZonePanel />}
          {panel === 'budget' && <BudgetPanel />}
          {panel === 'diet' && <DietPanel />}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function EditBar() {
  const { add, undo, redo, save, reset, zones, past, future, importJson } = useStore()
  const [t, setT] = useState<ZoneType>('prep')
  const file = useRef<HTMLInputElement>(null)
  return (
    <div className="glass fixed z-30 left-1/2 -translate-x-1/2 bottom-[7rem] md:bottom-20 rounded-xl p-2 flex flex-wrap gap-2 items-center justify-center max-w-[96vw]">
      <select value={t} onChange={(e) => setT(e.target.value as ZoneType)} style={{ width: 100 }} aria-label="New zone type">{TYPES.map((x) => <option key={x}>{x}</option>)}</select>
      <button className="btn" onClick={() => add(t)}>Add zone</button>
      <button className="btn" disabled={!past.length} onClick={undo}>Undo</button>
      <button className="btn" disabled={!future.length} onClick={redo}>Redo</button>
      <button className="btn" onClick={save}>Save</button>
      <button className="btn" onClick={() => { const u = URL.createObjectURL(new Blob([JSON.stringify(zones, null, 2)], { type: 'application/json' })); download(u, 'fifth-wall-layout.json'); URL.revokeObjectURL(u) }}>Export</button>
      <button className="btn" onClick={() => file.current?.click()}>Import</button>
      <button className="btn" onClick={() => confirm('Reset to the original plan?') && reset()}>Reset</button>
      <input ref={file} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => importJson(String(r.result)); r.readAsText(f); e.target.value = '' }} />
    </div>
  )
}

export default function Hud() {
  const s = useStore()
  const { mode, set, started, edit, ceiling, compliance, panel, diet, tourIdx, zones, toast } = s
  const tourIds = TOUR.filter((id) => zones.some((z) => z.id === id))
  const tz = zones.find((z) => z.id === tourIds[tourIdx % tourIds.length])
  const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  useEffect(() => { if (!toast) return; const id = setTimeout(() => set({ toast: '' }), 2400); return () => clearTimeout(id) }, [toast, set])

  const shot = () => set({ shot: true })
  const shotUrl = s.shotUrl
  useEffect(() => {
    if (!shotUrl) return
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
      const g = c.getContext('2d')!; g.drawImage(img, 0, 0)
      const fs = Math.round(c.width / 48)
      g.font = `${fs}px Georgia, serif`; g.textAlign = 'right'
      g.fillStyle = 'rgba(7,19,23,0.55)'; g.fillRect(c.width - fs * 8.4, c.height - fs * 2.4, fs * 8, fs * 1.8)
      g.fillStyle = '#fff'; g.fillText('The Fifth Wall', c.width - fs * 0.8, c.height - fs * 1.1)
      c.toBlob((b) => { if (b) { const u = URL.createObjectURL(b); download(u, 'the-fifth-wall-view.png'); URL.revokeObjectURL(u); set({ toast: 'Screenshot saved' }) } })
    }
    img.src = shotUrl
    set({ shotUrl: '' })
  }, [shotUrl, set])
  const share = async () => {
    const h = `#v=${mode}&z=${s.selected ?? ''}&d=${diet ?? ''}&c=${ceiling ? 1 : 0}`
    const url = location.origin + location.pathname + h
    try { await navigator.clipboard.writeText(url); set({ toast: 'Link copied' }) } catch { set({ toast: url }) }
  }
  const setMode = (m: Mode) => { set({ mode: m, tourIdx: 0 }); if (m === 'walk') set({ edit: false }) }

  return (
    <>
      <Intro />
      {started && (
        <>
          <header className="fixed z-20 top-0 inset-x-0 p-3 md:p-4 flex items-start justify-between pointer-events-none">
            <div className="pointer-events-auto">
              <div className="flex items-center gap-3">
                <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><rect x="3" y="3" width="24" height="24" fill="none" stroke="#fff" strokeWidth="1.6" strokeDasharray="24 72" /><path d="M3 3 H27 V27 H3 Z" fill="none" stroke="#fff" strokeWidth="1.6" strokeDasharray="0 24 24 24 24 0" /><line x1="3" y1="27" x2="3" y2="3" stroke="#E36414" strokeWidth="2.4" /></svg>
                <div>
                  <div className="font-display text-2xl md:text-[1.7rem] leading-none tracking-tight">The Fifth Wall</div>
                  <div className="text-xs text-white/60 mt-1">Cloud kitchen, 3,000 sq ft</div>
                </div>
              </div>
            </div>
            <div className="pointer-events-auto flex gap-2 flex-wrap justify-end">
              <button className={'btn glass ' + (panel === 'budget' ? 'on' : '')} onClick={() => set({ panel: panel === 'budget' ? null : 'budget' })}>Budget</button>
              <button className="btn glass" onClick={shot}>Screenshot</button>
              <button className="btn glass" onClick={share}>Share view</button>
            </div>
          </header>

          {mode === 'tour' && tz && (
            <div className="glass fixed z-20 left-1/2 -translate-x-1/2 bottom-[7rem] md:bottom-20 rounded-2xl px-5 py-3 w-[min(92vw,520px)]">
              <div className="font-display text-xl">{tz.name}</div>
              <div className="text-sm text-white/75">{TYPE_INFO[tz.type].purpose}</div>
              <div className="mt-2 flex gap-2">
                <button className="btn" onClick={() => set({ tourIdx: (tourIdx + tourIds.length - 1) % tourIds.length })}>Previous</button>
                <button className="btn" onClick={() => set({ tourIdx: tourIdx + 1 })}>Next</button>
                <button className="btn" onClick={() => setMode('dollhouse')}>End tour</button>
              </div>
            </div>
          )}
          {mode === 'walk' && (
            <div className="glass fixed z-20 left-1/2 -translate-x-1/2 top-16 rounded-xl px-4 py-2 text-sm text-center">
              Click the scene to look around. W A S D to move, Shift to run, Esc to release the mouse.
              <button className="btn ml-3" onClick={() => setMode('dollhouse')}>Exit walkthrough</button>
              {coarse && <div className="text-xs text-white/60 mt-1">Walkthrough needs a keyboard and mouse. On touch, use the guided tour.</div>}
            </div>
          )}
          {edit && <EditBar />}

          <nav className="fixed z-30 bottom-4 left-1/2 -translate-x-1/2 flex gap-2 flex-wrap justify-center items-center max-w-[96vw]">
            <div className="glass rounded-full p-1 flex">
              {MODES.map((m) => <button key={m.id} className={'seg ' + (mode === m.id ? 'seg-on' : '')} onClick={() => setMode(m.id)}>{m.label}</button>)}
            </div>
            <div className="glass rounded-full p-1 flex">
              <button className={'seg ' + (ceiling ? 'tog-on' : '')} onClick={() => set({ ceiling: !ceiling })}>Ceiling</button>
              <button className={'seg ' + (compliance ? 'tog-on' : '')} onClick={() => set({ compliance: !compliance })}>Flow and exits</button>
              <button className={'seg ' + (panel === 'diet' ? 'tog-on' : '')} onClick={() => (panel === 'diet' ? set({ panel: null, diet: null }) : set({ panel: 'diet' }))}>Diet view</button>
              <button className={'seg ' + (edit ? 'tog-on' : '')} onClick={() => set({ edit: !edit, mode: mode === 'walk' || mode === 'tour' ? 'dollhouse' : mode })}>Edit layout</button>
            </div>
          </nav>
          <div className="hidden md:flex glass fixed z-20 left-4 bottom-4 rounded-xl px-3 py-2 gap-4 text-xs text-white/80">
            {DIETS.map((d) => <span key={d} className="flex items-center gap-1.5"><i style={{ width: 8, height: 8, borderRadius: 9, background: DIET_COLOR[d], display: 'inline-block' }} />{DIET_LABEL[d]}</span>)}
          </div>
          <Panels />
          <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass fixed z-40 top-16 left-1/2 -translate-x-1/2 rounded-lg px-4 py-2 text-sm">{toast}</motion.div>}</AnimatePresence>
        </>
      )}
    </>
  )
}
