import { useMemo, useState } from 'react'
import { ageFrom, type Toy } from './toysApi'
import { whereLabel } from './houses'

/** Index cards for every friend in every house, with a search box. Tap one to find them. */
export function ToyCatalogue({ toys, onFind, onOpen }: { toys: Toy[]; onFind: (t: Toy) => void; onOpen: (t: Toy) => void }) {
  const [q, setQ] = useState('')
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return [...toys]
      .filter((t) => !needle || [t.name, t.origin, t.personality, t.gender, t.memory, whereLabel(t)].some((v) => v?.toLowerCase().includes(needle)))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [toys, q])

  return (
    <aside className="catalogue" aria-label="Friends catalogue">
      <header className="catalogue__head">
        <h2>Friends catalogue</h2>
        <p>
          {toys.length} {toys.length === 1 ? 'card' : 'cards'}
        </p>
      </header>
      <input className="catalogue__search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="find a friend…" aria-label="Find a friend" />
      <ul className="catalogue__list">
        {shown.map((t) => (
          <li key={t.id}>
            <button className="catalogue__card" onClick={() => onFind(t)} title={`Find ${t.name}`}>
              <span className="catalogue__thumb">
                <img src={t.photo} alt="" loading="lazy" />
              </span>
              <span className="catalogue__text">
                <span className="catalogue__name">{t.name}</span>
                <span className="catalogue__where">{whereLabel(t)}</span>
                {ageFrom(t.birthday) && <span className="catalogue__age">{ageFrom(t.birthday)}</span>}
              </span>
            </button>
            <button className="catalogue__open text-btn" onClick={() => onOpen(t)}>
              card
            </button>
          </li>
        ))}
        {toys.length > 0 && shown.length === 0 && <li className="catalogue__none">No one by that name… yet.</li>}
        {toys.length === 0 && <li className="catalogue__none">The catalogue fills up as friends move in.</li>}
      </ul>
    </aside>
  )
}
