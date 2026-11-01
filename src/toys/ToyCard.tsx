import { useState } from 'react'
import { motion } from 'motion/react'
import { ageFrom, deleteToy, updateToy, type Toy } from './toysApi'
import { ToyForm } from './ToyForm'
import { HOUSES, whereLabel } from './houses'

/** A toy's catalogue card: who they are, plus edit, move floors and goodbye. */
export function ToyCard({ toy, onChange, onRemove, onClose }: { toy: Toy; onChange: (t: Toy) => void; onRemove: () => void; onClose: () => void }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const age = ageFrom(toy.birthday)
  const since = toy.birthday ? new Date(toy.birthday).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  const run = async (fn: () => Promise<void>) => {
    setSaving(true)
    setError('')
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
    setSaving(false)
  }

  return (
    <div className="toy-sheet" role="dialog" aria-label={`${toy.name}'s card`} onClick={onClose}>
      <motion.div
        className="toy-sheet__card toy-card"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0, rotate: -2 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.35, duration: 0.5 }}
      >
        <button className="toy-card__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        {editing ? (
          <ToyForm
            initial={toy}
            saving={saving}
            submitLabel="Save"
            onCancel={() => setEditing(false)}
            onSubmit={(d) =>
              run(async () => {
                onChange(await updateToy(toy.id, d))
                setEditing(false)
              })
            }
          />
        ) : (
          <>
            <div className="toy-card__top">
              <div className="toy-card__photo">
                <img src={toy.photo} alt={toy.name} />
              </div>
              <div>
                <p className="toy-card__label">soft toy catalogue</p>
                <h2>{toy.name}</h2>
                {age && (
                  <p className="toy-card__age">
                    {age}
                    <span> · since {since}</span>
                  </p>
                )}
              </div>
            </div>
            <dl className="toy-card__facts">
              <Fact label="Gender" value={toy.gender} />
              <Fact label="From" value={toy.origin} />
              <Fact label="Personality" value={toy.personality} />
              <Fact label="Lives in" value={whereLabel(toy)} />
            </dl>
            <div className="toy-card__memory">
              <p className="toy-card__label">favourite memory</p>
              <p className="toy-card__hand">{toy.memory || '…still making one'}</p>
            </div>
            {error && <p className="toy-error">{error}</p>}
            <div className="toy-card__actions">
              <button className="text-btn" onClick={() => setEditing(true)}>
                edit
              </button>
              <label className="toy-card__move">
                move to
                <select
                  value={`${toy.house}:${toy.level}`}
                  disabled={saving}
                  onChange={(e) => {
                    const [house, level] = e.target.value.split(':')
                    run(async () => onChange(await updateToy(toy.id, { house, level: +level })))
                  }}
                >
                  {HOUSES.map((h) => (
                    <optgroup key={h.id} label={h.name}>
                      {h.floors.map((f, i) => (
                        <option key={f.name} value={`${h.id}:${i}`}>
                          {f.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <button
                className="text-btn toy-card__remove"
                disabled={saving}
                onClick={() => confirm(`Remove ${toy.name} from the toy house? This can't be undone.`) && run(async () => (await deleteToy(toy.id), onRemove()))}
              >
                remove
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
