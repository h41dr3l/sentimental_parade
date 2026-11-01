import { useState } from 'react'
import type { JourneyDoc } from '../types'
import { TIME_LABEL } from './MomentView'

/** The summary: a sketch of the ship with a pin for every place a memory happened. */
export function ShipMap({ doc, mapSrc, onRelive }: { doc: JourneyDoc; mapSrc: string; onRelive: (momentId: string) => void }) {
  const [open, setOpen] = useState<string | null>(null)

  const memoriesAt = (placeId: string) =>
    doc.days.flatMap((d) => d.moments.filter((m) => m.place === placeId).map((m) => ({ day: d, m })))
  const places = doc.places.filter((p) => memoriesAt(p.id).length > 0)
  const current = places.find((p) => p.id === open)

  return (
    <section className="shipmap" id="explore" data-moment="explore" data-time="evening">
      <header className="shipmap__head">
        <p className="shipmap__eyebrow">explore the ship</p>
        <h2>Where it all happened</h2>
        <p>Tap a place to relive what we did there.</p>
      </header>

      <div className="shipmap__scroller">
        <div className="shipmap__canvas">
          <img className="shipmap__img" src={mapSrc} alt="Cutaway painting of the ship, deck by deck" />
          {places.map((p, i) => (
            <button
              key={p.id}
              className={`pin ${open === p.id ? 'is-open' : ''}`}
              style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${i * 0.08}s` }}
              onClick={() => setOpen(open === p.id ? null : p.id)}
            >
              <span className="pin__dot">{memoriesAt(p.id).length}</span>
              <span className="pin__label">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {current && (
        <aside className="place-card" key={current.id}>
          <button className="place-card__close" onClick={() => setOpen(null)} aria-label="Close">
            ×
          </button>
          <h3>{current.name}</h3>
          <ol>
            {memoriesAt(current.id).map(({ day, m }) => (
              <li key={m.id}>
                <p className="place-card__when">
                  {day.label} · {TIME_LABEL[m.time]}
                </p>
                <p className="place-card__text">{m.text}</p>
                {m.photos.length > 0 && (
                  <div className="place-card__thumbs">
                    {m.photos.slice(0, 3).map((ph) =>
                      ph.kind === 'video' ? (
                        <video key={ph.id} src={ph.src} muted playsInline preload="metadata" />
                      ) : (
                        <img key={ph.id} src={ph.src} alt={ph.caption} loading="lazy" />
                      ),
                    )}
                  </div>
                )}
                <button className="text-btn" onClick={() => onRelive(m.id)}>
                  relive it →
                </button>
              </li>
            ))}
          </ol>
        </aside>
      )}
    </section>
  )
}
