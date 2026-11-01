import { moments } from '../moments'
import { go } from '../lib/router'

/** Home: a quiet shelf with one book per big moment. The magic stays inside the books. */
export function Bookshelf({ onLock }: { onLock: () => void }) {
  return (
    <main className="home">
      <header className="home__head">
        <h1>Big Moments</h1>
        <p>Things we never want to forget.</p>
      </header>

      <section className="home__shelf" aria-label="Our books">
        {moments.map((m) => (
          <button
            key={m.id}
            className={`home-book ${m.magical ? 'home-book--magic' : ''}`}
            style={{ '--cloth': m.cover[0], '--foil': m.cover[1] } as React.CSSProperties}
            onClick={() => go(m.intro ? m.id : `${m.id}/journey`)}
          >
            <span className="home-book__spine" />
            <span className="home-book__title">{m.title}</span>
            <span className="home-book__dates">{m.dates}</span>
            {m.magical && (
              <>
                <img className="home-book__emblem" src={`/moments/${m.id}/stickers/sun.webp`} alt="" />
                <span className="home-book__glint" aria-hidden />
              </>
            )}
          </button>
        ))}
        <div className="home-book home-book--empty" aria-hidden>
          <span>next chapter</span>
        </div>
      </section>

      <footer className="home__foot">
        {moments.length} {moments.length === 1 ? 'book' : 'books'} so far ·{' '}
        <button className="lock-again" onClick={onLock}>
          lock
        </button>
      </footer>
    </main>
  )
}
