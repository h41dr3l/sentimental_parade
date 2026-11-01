import { useState } from 'react'
import type { ToyDetails } from './toysApi'

export const EMPTY_DETAILS: ToyDetails = { name: '', birthday: '', origin: '', personality: '', gender: '', memory: '' }

/** The catalogue card fields, shared by "add a toy" and "edit". */
export function ToyForm({ initial, saving, submitLabel, onSubmit, onCancel }: {
  initial: ToyDetails
  saving: boolean
  submitLabel: string
  onSubmit: (d: ToyDetails) => void
  onCancel: () => void
}) {
  const [d, setD] = useState<ToyDetails>({ ...EMPTY_DETAILS, ...initial })
  const set = (k: keyof ToyDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD({ ...d, [k]: e.target.value })

  return (
    <form
      className="toy-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (d.name.trim()) onSubmit(d)
      }}
    >
      <label className="toy-form__wide">
        Name
        <input value={d.name} onChange={set('name')} placeholder="e.g. Olu Mel" required autoFocus />
      </label>
      <label>
        Birthday, or the day they came home
        <input type="date" value={d.birthday ?? ''} onChange={set('birthday')} />
      </label>
      <label>
        Gender
        <input value={d.gender} onChange={set('gender')} list="toy-genders" placeholder="girl, boy, …" />
        <datalist id="toy-genders">
          <option value="girl" />
          <option value="boy" />
          <option value="a bit of both" />
          <option value="it's complicated" />
        </datalist>
      </label>
      <label className="toy-form__wide">
        Where they're from
        <input value={d.origin} onChange={set('origin')} placeholder="e.g. Disney Adventure gift shop, May 2026" />
      </label>
      <label className="toy-form__wide">
        Personality
        <input value={d.personality} onChange={set('personality')} placeholder="e.g. shy at first, loves naps and cuddles" />
      </label>
      <label className="toy-form__wide">
        Favourite memory
        <textarea value={d.memory} onChange={set('memory')} rows={3} placeholder="e.g. front row at the Duffy show" />
      </label>
      <div className="toy-form__actions">
        <button type="button" className="text-btn" onClick={onCancel}>
          cancel
        </button>
        <button type="submit" className="toy-btn" disabled={saving || !d.name.trim()}>
          {saving ? 'saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
