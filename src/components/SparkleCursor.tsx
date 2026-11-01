import { useEffect, useRef } from 'react'

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  hue: string
  spin: number
}

const COLORS = ['#fff6c8', '#f4c95d', '#f7b3d6', '#c9b2ff', '#ffffff', '#9fe3ff']

function star(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath()
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2
    ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s)
    ctx.lineTo(Math.cos(a + Math.PI / 4) * s * 0.28, Math.sin(a + Math.PI / 4) * s * 0.28)
  }
  ctx.closePath()
  ctx.fill()
}

/** Pixie-dust trail that follows the pointer, and bursts on every tap. */
export function SparkleCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const sparks: Spark[] = []
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let last = { x: -1, y: -1 }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const spawn = (x: number, y: number, n: number, speed: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2
        const v = Math.random() * speed
        sparks.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 0.3,
          life: 0,
          max: 30 + Math.random() * 30,
          size: 1.5 + Math.random() * 3,
          hue: COLORS[(Math.random() * COLORS.length) | 0],
          spin: Math.random() * Math.PI,
        })
      }
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.life++
        s.x += s.vx
        s.y += s.vy
        s.vy += 0.035
        s.vx *= 0.97
        s.spin += 0.08
        const k = 1 - s.life / s.max
        if (k <= 0) {
          sparks.splice(i, 1)
          continue
        }
        ctx.save()
        ctx.translate(s.x, s.y)
        ctx.rotate(s.spin)
        ctx.globalAlpha = k
        ctx.fillStyle = s.hue
        ctx.shadowColor = s.hue
        ctx.shadowBlur = 8
        star(ctx, s.size * (0.5 + k * 0.6))
        ctx.restore()
      }
      raf = sparks.length ? requestAnimationFrame(tick) : 0
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const d = Math.hypot(e.clientX - last.x, e.clientY - last.y)
      last = { x: e.clientX, y: e.clientY }
      if (d > 3) spawn(e.clientX, e.clientY, 1, 0.8)
    }
    const onDown = (e: PointerEvent) => spawn(e.clientX, e.clientY, reduced ? 3 : 7, 2.2)

    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [])

  return <canvas ref={canvasRef} className="sparkle-canvas" aria-hidden />
}
