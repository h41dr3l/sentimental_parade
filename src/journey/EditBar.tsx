import { useRef } from 'react'
import type { JourneyDoc, Moment, MomentEffect, TimeOfDay } from '../types'

const STICKER_NAMES = [
  'ship', 'horn', 'sun', 'lantern', 'pingpong', 'ears', 'stage', 'scallops', 'steak', 'icecream', 'beer', 'headphones',
  'hibiscus', 'cocktails', 'martinis', 'popcorn', 'ticket', 'fistbump', 'chicken', 'trophy', 'mic', 'slide', 'bingo',
  'motorbike', 'sprout', 'crown', 'autograph', 'pizza', 'fireworks', 'castle', 'dumbbell', 'camera', 'suitcase', 'tray', 'wheel',
]

interface Props {
  momentId: string
  doc: JourneyDoc
  selected: string | null
  saveState: 'saved' | 'saving' | 'error'
  onAddPhotos: (files: File[]) => void
  onUpdate: (id: string, patch: Partial<Moment>) => void
  onAddAfter: (id: string) => void
  onRemove: (id: string) => void
}

/** Small editing panel, only shown when running locally. Text is edited by clicking it on the page. */
export function EditBar({ momentId, doc, selected, saveState, onAddPhotos, onUpdate, onAddAfter, onRemove }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const m = doc.days.flatMap((d) => d.moments).find((x) => x.id === selected)

  return (
    <aside className="editbar" onPointerDown={(e) => e.stopPropagation()}>
      <div className="editbar__head">
        <strong>Editing</strong>
        <span className={`editbar__save is-${saveState}`}>{saveState === 'saved' ? 'saved' : saveState === 'saving' ? 'saving…' : 'save failed'}</span>
      </div>
      {!m && <p className="editbar__hint">Click a moment to select it. Paste (Ctrl+V) or drop photos onto it; drop videos the same way. Click any text to rewrite it, and drag photos to move them.</p>}
      {m && (
        <div className="editbar__fields">
          <label>
            Time of day
            <select value={m.time} onChange={(e) => onUpdate(m.id, { time: e.target.value as TimeOfDay })}>
              {['morning', 'afternoon', 'evening', 'night'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Place on the ship map
            <select value={m.place ?? ''} onChange={(e) => onUpdate(m.id, { place: e.target.value || undefined })}>
              <option value="">(none)</option>
              {doc.places.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Effect
            <select value={m.effect ?? ''} onChange={(e) => onUpdate(m.id, { effect: (e.target.value || undefined) as MomentEffect })}>
              <option value="">(none)</option>
              <option value="horn">ship's horn</option>
              <option value="fireworks">fireworks</option>
              <option value="lanterns">lanterns</option>
            </select>
          </label>
          <label>
            Stickers
            <div className="editbar__stickers">
              {STICKER_NAMES.map((n) => {
                const on = m.stickers?.includes(n)
                return (
                  <button
                    key={n}
                    className={on ? 'is-on' : ''}
                    title={n}
                    onClick={() => onUpdate(m.id, { stickers: on ? m.stickers!.filter((s) => s !== n) : [...(m.stickers ?? []), n] })}
                  >
                    <img src={`/moments/${momentId}/stickers/${n}.webp`} alt={n} />
                  </button>
                )
              })}
            </div>
          </label>
          <div className="editbar__row">
            <button onClick={() => fileRef.current?.click()}>+ photo or video</button>
            <button onClick={() => onAddAfter(m.id)}>+ moment after</button>
            <button className="danger" onClick={() => confirm('Delete this moment?') && onRemove(m.id)}>
              delete
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            multiple
            hidden
            onChange={(e) => {
              onAddPhotos(Array.from(e.target.files ?? []))
              e.target.value = ''
            }}
          />
        </div>
      )}
    </aside>
  )
}
