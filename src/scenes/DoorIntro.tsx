import { useEffect, useState } from 'react'
import type { BigMoment } from '../moments'
import { go } from '../lib/router'
import { playHorn } from '../lib/horn'

type Stage = 'door' | 'opening' | 'entering'

const IMG = '/moments/disney-adventure'

/** Stateroom 15311: open the decorated door and walk straight through into the voyage. */
export function DoorIntro({ moment }: { moment: BigMoment }) {
  const [stage, setStage] = useState<Stage>('door')
  const openVoyage = () => go(`${moment.id}/journey`)

  useEffect(() => {
    if (stage === 'door') return
    const id = window.setTimeout(() => (stage === 'opening' ? setStage('entering') : openVoyage()), stage === 'opening' ? 1700 : 1000)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  return (
    <div className={`intro intro--${stage}`}>
      <button className="pill intro__back" onClick={() => go('')}>
        ← Bookshelf
      </button>
      <button className="pill intro__skip" onClick={openVoyage}>
        Skip to the voyage →
      </button>

      <div className="corridor">
        {/* Our door, painted in Higgsfield: the frame stays put, only the door panel swings open. */}
        <div className="door-photo">
          <div className="door-photo__doorway" aria-hidden>
            <img src={`${IMG}/stateroom.webp`} alt="" />
          </div>
          <img className="door-photo__frame" src={`${IMG}/door-art.webp`} alt="" aria-hidden />
          <button
            className="door-photo__door"
            aria-label="Open the door to stateroom 15311"
            onClick={() => {
              if (stage !== 'door') return
              playHorn()
              setStage('opening')
            }}
          >
            <img src={`${IMG}/door-art.webp`} alt="Our door, 15311, with Rapunzel flags" />
          </button>
        </div>
        <p className="intro__hint">tap the door to step inside</p>
      </div>
    </div>
  )
}
