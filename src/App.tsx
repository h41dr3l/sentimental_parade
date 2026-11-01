import { useCallback, useEffect, useState } from 'react'
import { go, useRoute } from './lib/router'
import { moments } from './moments'
import { Bookshelf } from './scenes/Bookshelf'
import { DoorIntro } from './scenes/DoorIntro'
import { Journey } from './journey/Journey'
import { SparkleCursor } from './components/SparkleCursor'
import { Lock } from './scenes/Lock'
import { ToyHouse } from './toys/ToyHouse'
import { ToyHouseButton } from './toys/ToyHouseButton'
import { isUnlocked, lockAgain, remember, stillUnlocked } from './lib/lock'

export function App() {
  const [momentId, view] = useRoute()
  const moment = moments.find((m) => m.id === momentId)
  const [unlocked, setUnlocked] = useState(isUnlocked)
  const unlock = useCallback(() => setUnlocked(true), [])

  // The local flag is only a hint; if the server cookie has expired, show the lock again.
  useEffect(() => {
    if (!unlocked) return
    stillUnlocked().then((ok) => {
      if (!ok) {
        remember(false)
        setUnlocked(false)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Old flip-book links still land somewhere sensible.
  useEffect(() => {
    if (moment && view === 'book') go(`${moment.id}/journey`)
  }, [moment, view])

  useEffect(() => {
    document.documentElement.dataset.theme = moment?.magical ? 'magic' : 'plain'
  }, [moment])

  if (!unlocked) return <Lock onUnlock={unlock} />

  const inToyHouse = momentId === 'toys'

  let screen
  if (inToyHouse) screen = <ToyHouse houseId={view} />
  else if (!moment) screen = <Bookshelf onLock={() => void lockAgain().then(() => setUnlocked(false))} />
  else if (view === 'journey' || !moment.intro) screen = <Journey key={moment.id} moment={moment} />
  else screen = <DoorIntro moment={moment} />

  return (
    <>
      {screen}
      {!moment && !inToyHouse && <ToyHouseButton />}
      {moment?.magical && <SparkleCursor />}
    </>
  )
}
