import { useEffect, useRef } from 'react'

const COLORS = ['#f4c95d', '#f06292', '#7cc6f2', '#c9b2ff', '#fff6c8', '#8ef0c4']

interface P {
  x: number
  y: number
  px: number
  py: number
  vx: number
  vy: number
  life: number
  color: string
}

/** Fireworks across the whole sky while `active`. */
export function Fireworks({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active) return
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    const parts: P[] = []
    let frame = 0
    let raf = 0
    let w = 0
    let h = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const burst = () => {
      const x = w * (0.1 + Math.random() * 0.8)
      const y = h * (0.08 + Math.random() * 0.4)
      const color = COLORS[(Math.random() * COLORS.length) | 0]
      const n = 50 + ((Math.random() * 30) | 0)
      const power = Math.min(w, h) / 220
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        const v = (1.4 + Math.random() * 1.6) * power
        parts.push({ x, y, px: x, py: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, color })
      }
    }

    const tick = () => {
      frame++
      if (frame % 48 === 1) burst()
      ctx.clearRect(0, 0, w, h)
      ctx.lineCap = 'round'
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]
        p.px = p.x
        p.py = p.y
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.975
        p.vy = p.vy * 0.975 + 0.045
        p.life -= 0.011
        if (p.life <= 0) {
          parts.splice(i, 1)
          continue
        }
        ctx.globalAlpha = p.life
        ctx.strokeStyle = p.color
        ctx.lineWidth = 2.4
        ctx.shadowColor = p.color
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.moveTo(p.px - p.vx * 2, p.py - p.vy * 2)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      ctx.clearRect(0, 0, w, h)
    }
  }, [active])

  return <canvas ref={ref} className={`fireworks ${active ? 'is-on' : ''}`} aria-hidden />
}
