import { useEffect, useRef, useState } from 'react'
import { DIGITS, checkCode, remember } from '../lib/lock'

const STEP = 40 // px of drag per digit
// handwritten subject cards on the other drawers, like a real catalogue
const LABELS = ['travel', 'food', 'firsts', 'us', 'home', 'holidays', 'letters', 'someday', 'misc.']

/** The front door: a library card catalogue whose main drawer is held shut by brass number wheels. */
export function Lock({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState<number[]>(() => Array(DIGITS).fill(0))
  const [open, setOpen] = useState(false)

  // Ask the server once the wheels have settled, not on every click of a wheel.
  useEffect(() => {
    let cancelled = false
    const t = window.setTimeout(() => {
      checkCode(code.join('')).then((ok) => {
        if (!ok || cancelled) return
        setOpen(true)
        remember(true)
        window.setTimeout(onUnlock, 2300)
      })
    }, 350)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [code, onUnlock])

  const turn = (i: number, by: number) => !open && setCode((c) => c.map((v, k) => (k === i ? (v + by + 10) % 10 : v)))

  return (
    <main className={`lock ${open ? 'is-open' : ''}`}>
      <div className="catalog">
        <div className="catalog__top" />
        <div className="catalog__body">
          {LABELS.slice(0, 3).map((l) => (
            <SmallDrawer key={l} label={l} />
          ))}
          <div className="drawer drawer--main">
            <div className="drawer__cards" aria-hidden>
              <span />
              <span />
              <span />
            </div>
            <div className="drawer__front">
              <span className="drawer__plate">
                <span>Big Moments</span>
              </span>
              <div className="lock__housing" role="group" aria-label="Combination lock">
                {code.map((v, i) => (
                  <Wheel key={i} value={v} index={i} onTurn={(by) => turn(i, by)} />
                ))}
              </div>
            </div>
          </div>
          {LABELS.slice(3).map((l) => (
            <SmallDrawer key={l} label={l} />
          ))}
        </div>
        <div className="catalog__base" />
      </div>
      <p className="lock__hint">{open ? 'welcome back' : 'roll the numbers to open the drawer'}</p>
    </main>
  )
}

function SmallDrawer({ label }: { label: string }) {
  return (
    <div className="drawer" aria-hidden>
      <span className="drawer__label">{label}</span>
      <span className="drawer__pull" />
    </div>
  )
}

function Wheel({ value, index, onTurn }: { value: number; index: number; onTurn: (by: number) => void }) {
  const drag = useRef<{ y: number; moved: number } | null>(null)
  const [offset, setOffset] = useState(0)

  // Neighbouring digits above and below, so it reads as a rolling drum.
  const rows = [-2, -1, 0, 1, 2].map((d) => ({ d, n: (value + d + 10) % 10 }))

  return (
    <div
      className="wheel"
      role="spinbutton"
      tabIndex={0}
      aria-label={`Digit ${index + 1}`}
      aria-valuemin={0}
      aria-valuemax={9}
      aria-valuenow={value}
      onWheel={(e) => onTurn(e.deltaY > 0 ? 1 : -1)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp') (e.preventDefault(), onTurn(-1))
        if (e.key === 'ArrowDown') (e.preventDefault(), onTurn(1))
        if (/^[0-9]$/.test(e.key)) {
          onTurn((+e.key - value + 10) % 10)
          ;(e.currentTarget.nextElementSibling as HTMLElement | null)?.focus()
        }
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = { y: e.clientY, moved: 0 }
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d) return
        const dy = e.clientY - d.y
        // every full step of drag rolls one digit; the remainder shows as a partial roll
        const steps = Math.trunc(dy / STEP)
        if (steps !== 0) {
          onTurn(-steps)
          d.y += steps * STEP
          d.moved++
        }
        setOffset(e.clientY - d.y)
      }}
      onPointerUp={(e) => {
        const d = drag.current
        drag.current = null
        setOffset(0)
        // a tap without dragging: top half rolls back, bottom half rolls on
        if (d && !d.moved && Math.abs(e.clientY - d.y) < 4) {
          const r = e.currentTarget.getBoundingClientRect()
          onTurn(e.clientY < r.top + r.height / 2 ? -1 : 1)
        }
      }}
      onPointerCancel={() => ((drag.current = null), setOffset(0))}
    >
      <div className="wheel__drum" style={{ transform: `translateY(${offset}px)` }}>
        {rows.map(({ d, n }) => (
          <span key={d} className={`wheel__digit ${d === 0 ? 'is-current' : ''}`} style={{ '--d': d } as React.CSSProperties}>
            {n}
          </span>
        ))}
      </div>
    </div>
  )
}
