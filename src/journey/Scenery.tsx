import { useMemo } from 'react'

/** Fixed sky behind the voyage: colours follow the time of day via CSS, stars come out at night. */
export function Sky() {
  const stars = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 62,
        size: Math.random() < 0.85 ? 1.5 : 2.5,
        delay: Math.random() * 5,
      })),
    [],
  )
  return (
    <div className="sky" aria-hidden>
      <div className="sky__stars">
        {stars.map((s) => (
          <span key={s.id} style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }} />
        ))}
      </div>
      <div className="sky__sun" />
      <div className="sky__moon" />
    </div>
  )
}

/** The sea along the bottom, with our ship riding it. Waves drift with the scroll so it feels like sailing. */
export function Sea({ shipSrc }: { shipSrc: string }) {
  return (
    <div className="sea" aria-hidden>
      <img className="sea__ship" src={shipSrc} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
      <div className="sea__wave sea__wave--back" />
      <div className="sea__wave sea__wave--mid" />
      <div className="sea__wave sea__wave--front" />
    </div>
  )
}
