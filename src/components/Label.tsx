import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

interface Props {
  text: string
  sub?: string
  color?: string
  position: [number, number, number]
  bp?: boolean
  dim?: boolean
  small?: boolean
  onClick?: () => void
}

const FONT = '"Instrument Sans", system-ui, -apple-system, "Segoe UI", sans-serif'

/** Canvas-texture sprite label. Far cheaper than a DOM overlay per zone: no layout work every frame. */
export function Label({ text, sub, color, position, bp, dim, small, onClick }: Props) {
  const { tex, ratio } = useMemo(() => {
    const px = 2
    const fs = 13 * px, sfs = 11 * px
    const c = document.createElement('canvas')
    const g = c.getContext('2d')!
    g.font = `600 ${fs}px ${FONT}`
    const w = g.measureText(text).width
    g.font = `400 ${sfs}px ${FONT}`
    const sw = sub ? g.measureText(sub).width : 0
    const padX = bp ? 8 * px : 12 * px
    const dot = color && !bp ? 14 * px : 0
    const h = bp ? (sub ? fs + sfs + 10 * px : fs + 8 * px) : 26 * px
    c.width = Math.ceil(Math.max(w + dot, sw) + padX * 2)
    c.height = Math.ceil(h)
    if (!bp) {
      g.fillStyle = 'rgba(8,28,35,0.88)'
      g.strokeStyle = color ? color : 'rgba(255,255,255,0.28)'
      g.lineWidth = 2
      g.beginPath()
      g.roundRect(1, 1, c.width - 2, c.height - 2, c.height / 2)
      g.fill(); g.stroke()
    }
    g.textBaseline = 'middle'
    g.textAlign = bp ? 'center' : 'left'
    const tx = bp ? c.width / 2 : padX + dot
    if (color && !bp) { g.fillStyle = color; g.beginPath(); g.arc(padX + 4 * px, c.height / 2, 4 * px, 0, Math.PI * 2); g.fill() }
    g.fillStyle = '#e9f1f2'
    g.font = `600 ${fs}px ${FONT}`
    g.fillText(text, tx, sub && bp ? fs * 0.9 : c.height / 2 + 1)
    if (sub && bp) { g.fillStyle = '#9fc3ff'; g.font = `400 ${sfs}px ${FONT}`; g.fillText(sub, tx, fs + sfs * 0.8 + 4 * px) }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return { tex: t, ratio: c.width / c.height }
  }, [text, sub, color, bp])
  useEffect(() => () => tex.dispose(), [tex])
  const k = small ? 0.017 : 0.022
  return (
    <sprite
      position={position} scale={[k * ratio, k, 1]} renderOrder={20}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick() } : undefined}
      onPointerOver={onClick ? () => { document.body.style.cursor = 'pointer' } : undefined}
      onPointerOut={onClick ? () => { document.body.style.cursor = '' } : undefined}
    >
      <spriteMaterial map={tex} transparent depthTest={false} depthWrite={false} sizeAttenuation={false} opacity={dim ? 0.3 : 1} toneMapped={false} />
    </sprite>
  )
}
