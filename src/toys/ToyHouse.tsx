import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { go } from '../lib/router'
import { fetchToys, type Toy } from './toysApi'
import { WalkingToy } from './WalkingToy'
import { AddToy } from './AddToy'
import { ToyCard } from './ToyCard'
import { ToyCatalogue } from './ToyCatalogue'
import { HOUSES, houseById } from './houses'

/** Where all the soft toys live: a house to watch them in, and the catalogue beside it. */
export function ToyHouse({ houseId }: { houseId?: string }) {
  const house = houseById(houseId)
  const [toys, setToys] = useState<Toy[] | null>(null)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState<Toy | null>(null)
  const [found, setFound] = useState<string | null>(null)
  const stage = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchToys().then(setToys, (e) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  // the "found" glow fades after a few seconds
  useEffect(() => {
    if (!found) return
    const t = window.setTimeout(() => setFound(null), 4500)
    return () => window.clearTimeout(t)
  }, [found])

  const replace = (t: Toy) => {
    setToys((all) => all?.map((x) => (x.id === t.id ? t : x)) ?? [t])
    setOpen(t)
  }

  const find = (t: Toy) => {
    if (t.house !== house.id) go(`toys/${t.house}`)
    setFound(t.id)
    stage.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const here = toys?.filter((t) => t.house === house.id) ?? []

  return (
    <main className="toyhouse" style={{ background: `var(--grain), ${house.backdrop}` }}>
      <header className="toyhouse__bar">
        <button className="text-btn" onClick={() => go('')}>
          ← Big Moments
        </button>
        <div className="toyhouse__title">
          <h1>The Toy House</h1>
          <nav className="toyhouse__tabs" aria-label="Homes">
            {HOUSES.map((h) => (
              <button key={h.id} className={`toyhouse__tab ${h.id === house.id ? 'is-here' : ''}`} onClick={() => go(`toys/${h.id}`)} aria-current={h.id === house.id}>
                {h.name}
                <span>{toys?.filter((t) => t.house === h.id).length ?? ''}</span>
              </button>
            ))}
          </nav>
        </div>
        <button className="toy-btn" onClick={() => setAdding(true)}>
          + Add a toy
        </button>
      </header>

      <div className="toyhouse__main">
        <div className="toyhouse__stage" ref={stage}>
          <div className="treehouse" key={house.id}>
            <img className="treehouse__art" src={house.art} alt={house.alt} draggable={false} />
            <AnimatePresence>
              {here.map((t) => {
                const neighbours = here.filter((x) => x.level === t.level)
                return <WalkingToy key={`${t.id}-${t.house}-${t.level}`} toy={t} houseName={house.name} housemates={here} floors={house.floors} climbs={house.climbs} index={neighbours.indexOf(t)} found={found === t.id} onOpen={() => setOpen(t)} />
              })}
            </AnimatePresence>
            {toys && here.length === 0 && (
              <button className="treehouse__empty" onClick={() => setAdding(true)}>
                {house.name} is ready. Who's moving in?
              </button>
            )}
          </div>
        </div>
        {toys && <ToyCatalogue toys={toys} onFind={find} onOpen={setOpen} />}
      </div>

      {error && <p className="toy-error toyhouse__error">Couldn't open the toy house: {error}</p>}

      {adding && (
        <AddToy
          house={house}
          onClose={() => setAdding(false)}
          onAdded={(t) => {
            setToys((all) => [...(all ?? []), t])
            setAdding(false)
            setFound(t.id)
          }}
        />
      )}
      {open && (
        <ToyCard
          toy={open}
          onClose={() => setOpen(null)}
          onChange={replace}
          onRemove={() => {
            setToys((all) => all?.filter((x) => x.id !== open.id) ?? [])
            setOpen(null)
          }}
        />
      )}
    </main>
  )
}
