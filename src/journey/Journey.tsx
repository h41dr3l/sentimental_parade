import { useCallback, useEffect, useRef, useState } from 'react'
import type { JourneyDoc, Moment, Photo, TimeOfDay } from '../types'
import type { BigMoment } from '../moments'
import { JourneyContext, type JourneyCtx } from './JourneyContext'
import { MomentView, useInView } from './MomentView'
import { Sea, Sky } from './Scenery'
import { ShipMap } from './ShipMap'
import { EditBar } from './EditBar'
import { Fireworks } from '../components/Fireworks'
import { Lanterns, lanternImages } from '../components/Lanterns'
import { Sticker } from '../components/Sticker'
import { CAN_EDIT, loadDoc, saveDoc, uploadImage, uploadVideo, VIDEO_WARN_MB } from '../lib/api'
import { playHorn } from '../lib/horn'
import { go } from '../lib/router'

let nextId = 1
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${nextId++}`

/**
 * The voyage: one long scroll through the trip. The sky follows the time of day of
 * whatever moment is in the middle of the screen, the ship sails along the bottom,
 * and each moment develops as it arrives.
 */
export function Journey({ moment }: { moment: BigMoment }) {
  const [doc, setDoc] = useState<JourneyDoc | null>(null)
  const [error, setError] = useState('')
  const [active, setActive] = useState<{ id: string; time: TimeOfDay }>({ id: 'prologue', time: 'morning' })
  const [progress, setProgress] = useState(0)
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved')
  const dirty = useRef(false)
  const hornPlayed = useRef(new Set<string>())

  useEffect(() => {
    loadDoc<JourneyDoc>(moment.id).then(setDoc, (e) => setError(String(e)))
    window.scrollTo(0, 0)
  }, [moment.id])

  // Whatever sits on the middle line of the screen sets the time of day.
  useEffect(() => {
    if (!doc) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const el = e.target as HTMLElement
          setActive({ id: el.dataset.moment!, time: el.dataset.time as TimeOfDay })
        }
      },
      { rootMargin: '-48% 0px -48% 0px' },
    )
    document.querySelectorAll('[data-moment]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [doc])

  // Scroll position drives the waves and the little ship on the route line.
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        const end = document.getElementById('explore')?.offsetTop ?? max
        document.documentElement.style.setProperty('--scroll', String(window.scrollY))
        setProgress(Math.min(1, window.scrollY / Math.max(1, end - window.innerHeight * 0.5)))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [doc])

  const activeMoment = doc?.days.flatMap((d) => d.moments).find((m) => m.id === active.id)
  useEffect(() => {
    if (activeMoment?.effect === 'horn' && !hornPlayed.current.has(activeMoment.id)) {
      hornPlayed.current.add(activeMoment.id)
      playHorn()
    }
  }, [activeMoment])

  // ----- Editing (only when running locally) -----
  const mutate = useCallback((fn: (d: JourneyDoc) => JourneyDoc) => {
    dirty.current = true
    setDoc((d) => (d ? fn(d) : d))
  }, [])

  const mapMoment = useCallback(
    (id: string, fn: (m: Moment) => Moment) =>
      mutate((d) => ({ ...d, days: d.days.map((day) => ({ ...day, moments: day.moments.map((m) => (m.id === id ? fn(m) : m)) })) })),
    [mutate],
  )

  useEffect(() => {
    if (!doc || !dirty.current) return
    setSaveState('saving')
    const t = window.setTimeout(() => saveDoc(moment.id, doc).then(() => setSaveState('saved'), () => setSaveState('error')), 600)
    return () => window.clearTimeout(t)
  }, [doc, moment.id])

  const addPhotos = useCallback(
    async (files: File[], momentId: string | null) => {
      const target = momentId ?? (doc?.days.some((d) => d.moments.some((m) => m.id === active.id)) ? active.id : null)
      if (!target) return
      for (const file of files) {
        const isVideo = file.type.startsWith('video/')
        if (!isVideo && !file.type.startsWith('image/')) continue
        const mb = file.size / 1024 / 1024
        if (isVideo && mb > VIDEO_WARN_MB && !confirm(`This video is ${Math.round(mb)} MB. Big videos make the site slow to load; trimming it to a short clip first is best. Add it anyway?`)) continue
        setSaveState('saving')
        try {
          const { src, ratio } = isVideo ? await uploadVideo(moment.id, file) : await uploadImage(moment.id, file)
          const item: Photo = { id: newId(isVideo ? 'video' : 'photo'), src, ratio, caption: '', ...(isVideo && { kind: 'video' as const }) }
          mapMoment(target, (m) => ({ ...m, photos: [...m.photos, item] }))
        } catch (err) {
          setSaveState('error')
          if (isVideo) alert(String(err))
        }
      }
    },
    [active.id, doc, mapMoment, moment.id],
  )

  useEffect(() => {
    if (!editing) return
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? [])
      if (files.length) {
        e.preventDefault()
        void addPhotos(files, selected)
      }
    }
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      const el = (e.target as Element).closest?.('[data-moment]') as HTMLElement | null
      void addPhotos(Array.from(e.dataTransfer?.files ?? []), el?.dataset.moment ?? selected)
    }
    const onDragOver = (e: DragEvent) => e.preventDefault()
    window.addEventListener('paste', onPaste)
    window.addEventListener('drop', onDrop)
    window.addEventListener('dragover', onDragOver)
    return () => {
      window.removeEventListener('paste', onPaste)
      window.removeEventListener('drop', onDrop)
      window.removeEventListener('dragover', onDragOver)
    }
  }, [editing, selected, addPhotos])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPhoto(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const ctx: JourneyCtx = {
    momentId: moment.id,
    editing,
    places: doc?.places ?? [],
    selectedMoment: selected,
    selectMoment: setSelected,
    updateMoment: (id, patch) => mapMoment(id, (m) => ({ ...m, ...patch })),
    updatePhoto: (mid, pid, patch) =>
      mapMoment(mid, (m) => ({
        ...m,
        photos: patch === null ? m.photos.filter((p) => p.id !== pid) : m.photos.map((p) => (p.id === pid ? { ...p, ...patch } : p)),
      })),
    openPhoto: setPhoto,
  }

  const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const currentDay = doc?.days.find((d) => d.id === active.id || d.moments.some((m) => m.id === active.id))

  if (error) return <p className="voyage-error">Couldn't load this journey: {error}</p>
  if (!doc) return <div className="voyage phase-morning" />

  return (
    <JourneyContext.Provider value={ctx}>
      <div className={`voyage phase-${active.time} ${editing ? 'is-editing' : ''}`}>
        <Sky />
        <Fireworks active={activeMoment?.effect === 'fireworks'} />
        {activeMoment?.effect === 'lanterns' && <Lanterns count={16} images={lanternImages(moment.id)} />}

        <header className="voyage-bar">
          <button className="text-btn" onClick={() => go('')}>
            ← Big Moments
          </button>
          <div className="route" aria-label="Where we are in the trip">
            <div className="route__line">
              {doc.days.map((d, i) => (
                <button
                  key={d.id}
                  className={`route__stop ${currentDay?.id === d.id ? 'is-here' : ''}`}
                  style={{ left: `${(i / Math.max(1, doc.days.length - 1)) * 100}%` }}
                  onClick={() => scrollToId(d.id)}
                >
                  <span>{d.label}</span>
                </button>
              ))}
              <span className="route__ship" style={{ left: `${progress * 100}%` }} />
            </div>
          </div>
          <div className="voyage-bar__right">
            <button className="text-btn" onClick={() => scrollToId('explore')}>
              the ship
            </button>
            {CAN_EDIT && (
              <button className={`text-btn ${editing ? 'is-on' : ''}`} onClick={() => (setEditing((e) => !e), setSelected(null))}>
                {editing ? 'done' : 'edit'}
              </button>
            )}
          </div>
        </header>

        <main className="voyage__scroll">
          <section className="prologue" data-moment="prologue" data-time="morning">
            <Sticker momentId={moment.id} name="ship" className="prologue__sticker" />
            <p className="prologue__place">
              {doc.prologue.place} · {doc.prologue.date}
            </p>
            <h1>{doc.title}</h1>
            <p className="prologue__line">{doc.prologue.line}</p>
            <p className="prologue__hint">scroll to set sail</p>
          </section>

          {doc.days.map((day) => (
            <section key={day.id} className="day" id={day.id}>
              <DayHeader day={day} />
              {day.moments.map((m, i) => (
                <MomentView key={m.id} m={m} side={i % 2 ? 'right' : 'left'} />
              ))}
            </section>
          ))}

          <section className="epilogue" data-moment="epilogue" data-time="morning">
            <Sticker momentId={moment.id} name="suitcase" className="epilogue__sticker" />
            <p className="prologue__place">{doc.epilogue.date}</p>
            <h2>{doc.epilogue.title}</h2>
            <p className="prologue__line">{doc.epilogue.line}</p>
            <button className="text-btn" onClick={() => scrollToId('explore')}>
              explore the ship ↓
            </button>
          </section>

          <ShipMap doc={doc} mapSrc={`/moments/${moment.id}/ship-map.webp`} onRelive={(id) => scrollToId(`m-${id}`)} />

          <footer className="voyage__end">
            <button className="text-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              sail it again ↑
            </button>
            <button className="text-btn" onClick={() => go('')}>
              back to Big Moments
            </button>
          </footer>
        </main>

        <Sea shipSrc={`/moments/${moment.id}/ship-side.webp`} />

        {editing && (
          <EditBar
            momentId={moment.id}
            doc={doc}
            selected={selected}
            saveState={saveState}
            onAddPhotos={(files) => addPhotos(files, selected)}
            onUpdate={(id, patch) => mapMoment(id, (m) => ({ ...m, ...patch }))}
            onAddAfter={(id) => {
              const fresh: Moment = { id: newId('m'), time: 'afternoon', text: 'A new memory…', photos: [] }
              mutate((d) => ({
                ...d,
                days: d.days.map((day) => {
                  const i = day.moments.findIndex((m) => m.id === id)
                  return i < 0 ? day : { ...day, moments: [...day.moments.slice(0, i + 1), { ...fresh, time: day.moments[i].time }, ...day.moments.slice(i + 1)] }
                }),
              }))
              setSelected(fresh.id)
            }}
            onRemove={(id) => {
              mutate((d) => ({ ...d, days: d.days.map((day) => ({ ...day, moments: day.moments.filter((m) => m.id !== id) })) }))
              setSelected(null)
            }}
          />
        )}

        {photo && (
          <div className="lightbox" onClick={() => setPhoto(null)} role="dialog" aria-label={photo.caption || 'Photo'}>
            <figure onClick={(e) => e.stopPropagation()}>
              {photo.kind === 'video' ? (
                <video src={photo.src} controls autoPlay playsInline />
              ) : (
                <img src={photo.src} alt={photo.caption} />
              )}
              {photo.caption && <figcaption>{photo.caption}</figcaption>}
            </figure>
          </div>
        )}
      </div>
    </JourneyContext.Provider>
  )
}

function DayHeader({ day }: { day: JourneyDoc['days'][number] }) {
  const [ref, seen] = useInView<HTMLElement>(0.4)
  return (
    <header ref={ref} className={`day__head ${seen ? 'is-in' : ''}`} data-moment={day.id} data-time="morning">
      <p className="day__label">{day.label}</p>
      <h2>{day.title}</h2>
      <p className="day__date">{day.date}</p>
    </header>
  )
}
