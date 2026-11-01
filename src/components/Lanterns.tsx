import { useMemo } from 'react'

/** The six painted lanterns for a moment (public/moments/<id>/stickers/lantern-1..6.webp). */
export const lanternImages = (momentId: string) => Array.from({ length: 6 }, (_, i) => `/moments/${momentId}/stickers/lantern-${i + 1}.webp`)

/**
 * Paper lanterns drifting upward, like the ones in the garden.
 * With `images` they're the painted lanterns; without, simple glowing shapes.
 */
export function Lanterns({ count = 12, images }: { count?: number; images?: string[] }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const scale = 0.35 + Math.random() * 0.75
        return {
          id: i,
          left: 3 + Math.random() * 94,
          scale,
          delay: -Math.random() * 30,
          // nearer (bigger) lanterns rise a little faster
          dur: 34 - scale * 10 + Math.random() * 12,
          sway: 10 + Math.random() * 30,
          flicker: 1.6 + Math.random() * 1.8,
        }
      }),
    [count],
  )
  return (
    <div className="lanterns" aria-hidden>
      {items.map((l, i) => {
        const style = {
          left: `${l.left}%`,
          animationDelay: `${l.delay}s`,
          animationDuration: `${l.dur}s`,
          '--s': l.scale,
          '--sway': `${l.sway}px`,
        } as React.CSSProperties
        return images?.length ? (
          <img
            key={l.id}
            className="lantern lantern--painted"
            src={images[i % images.length]}
            alt=""
            style={{ ...style, animationDelay: `${l.delay}s, 0s`, animationDuration: `${l.dur}s, ${l.flicker}s` }}
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        ) : (
          <span key={l.id} className="lantern" style={style} />
        )
      })}
    </div>
  )
}
