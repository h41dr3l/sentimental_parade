import { useEffect, useRef, useState } from 'react'
import type { Moment, Photo, TimeOfDay } from '../types'
import { useJourney } from './JourneyContext'
import { Sticker } from '../components/Sticker'
import { playHorn } from '../lib/horn'

export const TIME_LABEL: Record<TimeOfDay, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
}

/** True once the element has scrolled into view (stays true). */
export function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [seen, threshold])
  return [ref, seen] as const
}

/** Text that is editable in place while editing, and plain otherwise. */
function Editable({ value, onChange, className, tag: Tag = 'p' }: { value: string; onChange: (v: string) => void; className?: string; tag?: 'p' | 'figcaption' | 'span' }) {
  const { editing } = useJourney()
  if (!editing) return <Tag className={className}>{value}</Tag>
  return (
    <Tag
      className={`${className ?? ''} is-editable-text`}
      contentEditable
      suppressContentEditableWarning
      onPointerDown={(e) => e.stopPropagation()}
      onBlur={(e) => {
        const v = (e.currentTarget as HTMLElement).innerText.trim()
        if (v !== value) onChange(v)
      }}
    >
      {value}
    </Tag>
  )
}

export function MomentView({ m, side }: { m: Moment; side: 'left' | 'right' }) {
  const j = useJourney()
  const [ref, seen] = useInView<HTMLElement>(0.25)
  const place = j.places.find((p) => p.id === m.place)
  const selected = j.selectedMoment === m.id
  const hasPhotos = m.photos.length > 0

  return (
    <article
      id={`m-${m.id}`}
      ref={ref}
      data-moment={m.id}
      data-time={m.time}
      className={`moment moment--${side} ${hasPhotos ? '' : 'moment--text'} ${seen ? 'is-in' : ''} ${selected ? 'is-selected' : ''}`}
      onPointerDown={() => j.editing && j.selectMoment(m.id)}
    >
      <div className="moment__note">
        <p className="moment__when">
          {TIME_LABEL[m.time]}
          {place && <span> · {place.name}</span>}
        </p>
        <Editable className="moment__text" value={m.text} onChange={(text) => j.updateMoment(m.id, { text })} />
        {m.autographs && (
          <div className="autographs">
            {m.autographs.map((a, i) => (
              <div key={a.name} className="autographs__row">
                <span className="autographs__sig">{a.name}</span>
                <Editable
                  tag="span"
                  className="autographs__note"
                  value={a.note || (j.editing ? 'our silly question…' : '')}
                  onChange={(note) => j.updateMoment(m.id, { autographs: m.autographs!.map((x, k) => (k === i ? { ...x, note } : x)) })}
                />
              </div>
            ))}
          </div>
        )}
        {m.effect === 'horn' && (
          <button className="text-btn moment__horn" onClick={playHorn}>
            hear the horn
          </button>
        )}
        {!hasPhotos && <Stickers m={m} />}
      </div>

      {hasPhotos && (
        <div className={`moment__photos count-${Math.min(m.photos.length, 3)}`}>
          {m.photos.map((p, i) => (
            <PhotoView key={p.id} momentId={m.id} photo={p} index={i} />
          ))}
          <Stickers m={m} />
        </div>
      )}
    </article>
  )
}

function Stickers({ m }: { m: Moment }) {
  const j = useJourney()
  if (!m.stickers?.length) return null
  return (
    <>
      {m.stickers.map((name, i) => (
        <Sticker key={name + i} momentId={j.momentId} name={name} editing={j.editing} className={`moment__sticker s-${i % 3}`} />
      ))}
    </>
  )
}

function PhotoView({ momentId, photo, index }: { momentId: string; photo: Photo; index: number }) {
  const j = useJourney()
  const start = useRef<{ x: number; y: number } | null>(null)
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const landscape = (photo.ratio ?? 1.33) < 1

  return (
    <figure
      className={`photo ${landscape ? 'photo--wide' : ''} ${photo.fx ? `fx-${photo.fx}` : ''} ${j.editing ? 'is-draggable' : ''}`}
      style={
        {
          '--i': index,
          '--rot': `${photo.rot ?? (index % 2 ? 3 : -3)}deg`,
          translate: `${(photo.dx ?? 0) + drag.x}px ${(photo.dy ?? 0) + drag.y}px`,
        } as React.CSSProperties
      }
      onClick={() => !j.editing && j.openPhoto(photo)}
      onPointerDown={(e) => {
        if (!j.editing) return
        j.selectMoment(momentId)
        e.currentTarget.setPointerCapture(e.pointerId)
        start.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerMove={(e) => start.current && setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y })}
      onPointerUp={() => {
        if (!start.current) return
        start.current = null
        if (drag.x || drag.y) j.updatePhoto(momentId, photo.id, { dx: Math.round((photo.dx ?? 0) + drag.x), dy: Math.round((photo.dy ?? 0) + drag.y) })
        setDrag({ x: 0, y: 0 })
      }}
    >
      <div className="photo__img" style={photo.ratio ? { aspectRatio: `1 / ${photo.ratio}` } : undefined}>
        {photo.kind === 'video' ? <LoopingClip src={photo.src} /> : <img src={photo.src} alt={photo.caption} draggable={false} loading="lazy" />}
        {photo.kind === 'video' && <span className="photo__play" aria-hidden />}
        {photo.fx === 'shimmer' && <span className="photo__shine" />}
      </div>
      <Editable tag="figcaption" value={photo.caption} onChange={(caption) => j.updatePhoto(momentId, photo.id, { caption })} />
      {j.editing && (
        <span className="photo__tools" onPointerDown={(e) => e.stopPropagation()}>
          <button onClick={() => j.updatePhoto(momentId, photo.id, { rot: (photo.rot ?? 0) - 4 })} aria-label="Tilt left">
            ↺
          </button>
          <button onClick={() => j.updatePhoto(momentId, photo.id, { rot: (photo.rot ?? 0) + 4 })} aria-label="Tilt right">
            ↻
          </button>
          <button onClick={() => confirm('Remove this photo?') && j.updatePhoto(momentId, photo.id, null)} aria-label="Remove photo">
            ×
          </button>
        </span>
      )}
    </figure>
  )
}

/** A silent looping clip that only plays while it's on screen, so long pages stay smooth. */
function LoopingClip({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? void v.play().catch(() => {}) : v.pause()), { threshold: 0.3 })
    io.observe(v)
    return () => io.disconnect()
  }, [])
  return <video ref={ref} src={src} muted loop playsInline preload="metadata" />
}
