import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { Toy } from './toysApi'
import type { Climb } from './houses'
import { pickLine } from './chatter'

/** Where toys can stand on each floor of a house picture, in % of the picture. */
export interface Floor {
  name: string
  y: number
  x0: number
  x1: number
}

const SPEED = 5 // % of the house width per second: a gentle plush stroll
const CLIMB_SECONDS = 1.8
const WANDER_CHANCE = 0.3 // how often a toy heads for a ladder instead of strolling

type Phase = 'idle' | 'walk' | 'toLadder' | 'climb' | 'talk'

/**
 * One toy roaming the house: stroll about their floor, pause, sometimes hop,
 * and now and then walk to a ladder or staircase and climb to another floor.
 * Photos are flat cut-outs, so the "walk" is a waddle: a little bounce and sway while moving.
 * Stop by (hover, or tap on a phone) and they pause, wave, and say something from the chatter catalogue.
 */
export function WalkingToy({ toy, houseName, housemates, floors, climbs, index, found, onOpen }: {
  toy: Toy
  houseName: string
  housemates: Toy[]
  floors: Floor[]
  climbs: Climb[]
  index: number
  found?: boolean
  onOpen: () => void
}) {
  const home = Math.min(toy.level, floors.length - 1)
  const startX = floors[home].x0 + (((index * 37) % 100) / 100) * (floors[home].x1 - floors[home].x0)
  const [floor, setFloor] = useState(home)
  const [x, setX] = useState(startX)
  const [y, setY] = useState(floors[home].y)
  const [phase, setPhase] = useState<Phase>('idle')
  const [facingLeft, setFacingLeft] = useState(index % 2 === 1)
  const [hop, setHop] = useState(0)
  const [duration, setDuration] = useState(0)
  const next = useRef<{ floor: number; y: number } | null>(null)
  const timer = useRef(0)
  const here = useRef({ x: startX, floor: home })
  const [speech, setSpeech] = useState<string | null>(null)
  const [typed, setTyped] = useState(0)
  const [waving, setWaving] = useState(0)
  const lastLine = useRef<string | undefined>(undefined)
  const talkTimer = useRef(0)
  const phaseRef = useRef<Phase>('idle')
  phaseRef.current = phase
  const pointer = useRef('mouse')
  const self = useRef<HTMLButtonElement>(null)

  const walkTo = (to: number, p: Phase) => {
    // a zero-length move would never 'arrive', so always shuffle at least a little
    if (Math.abs(to - here.current.x) < 0.5) to += to > 50 ? -1 : 1
    setFacingLeft(to < here.current.x)
    setDuration(Math.max(1, Math.abs(to - here.current.x) / SPEED))
    setPhase(p)
    setX(to)
    here.current.x = to
  }

  const rest = () => {
    setPhase('idle')
    timer.current = window.setTimeout(
      () => {
        const f = here.current.floor
        const ways = climbs.filter((c) => c.from === f || c.to === f)
        if (ways.length && Math.random() < WANDER_CHANCE) {
          const c = ways[(Math.random() * ways.length) | 0]
          const target = c.from === f ? c.to : c.from
          next.current = { floor: target, y: floors[target].y }
          walkTo(c.x, 'toLadder')
          return
        }
        if (Math.random() < 0.18) setHop((h) => h + 1)
        const fl = floors[f]
        walkTo(fl.x0 + Math.random() * (fl.x1 - fl.x0), 'walk')
      },
      1200 + Math.random() * 3800,
    )
  }

  useEffect(() => {
    rest()
    return () => (window.clearTimeout(timer.current), window.clearTimeout(talkTimer.current))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onArrive = () => {
    if (phase === 'toLadder' && next.current) {
      // up or down the ladder
      setDuration(CLIMB_SECONDS)
      setPhase('climb')
      setY(next.current.y)
      return
    }
    if (phase === 'climb' && next.current) {
      here.current.floor = next.current.floor
      setFloor(next.current.floor)
      next.current = null
      // step off the ladder onto the floor
      const fl = floors[here.current.floor]
      walkTo(Math.min(fl.x1, Math.max(fl.x0, here.current.x + (here.current.x < 50 ? 6 : -6))), 'walk')
      return
    }
    if (phase === 'walk') rest()
  }

  // the words appear a letter at a time, like they're thinking it through
  useEffect(() => {
    if (!speech) return
    setTyped(0)
    const id = window.setInterval(() => setTyped((n) => (n >= speech.length ? (window.clearInterval(id), n) : n + 1)), 28)
    return () => window.clearInterval(id)
  }, [speech])

  const talk = () => {
    if (speech) return
    const line = pickLine(toy, { house: houseName, room: floors[here.current.floor]?.name ?? '' }, housemates, lastLine.current)
    lastLine.current = line
    setSpeech(line)
    setWaving((w) => w + 1)
    // stop walking to chat (but don't let go of a ladder mid-climb)
    const p = phaseRef.current
    if (p === 'walk' || p === 'idle') {
      window.clearTimeout(timer.current)
      const el = self.current
      const box = el?.parentElement?.getBoundingClientRect()
      const me = el?.getBoundingClientRect()
      if (box && me && box.width) {
        const now = ((me.left + me.width / 2 - box.left) / box.width) * 100
        here.current.x = now
        setDuration(0)
        setX(now)
      }
      setPhase('talk')
    }
    window.clearTimeout(talkTimer.current)
    talkTimer.current = window.setTimeout(
      () => {
        setSpeech(null)
        if (phaseRef.current === 'talk') rest()
      },
      Math.max(3500, line.length * 70 + 1500),
    )
  }

  const moving = phase === 'walk' || phase === 'toLadder'
  const climbing = phase === 'climb'

  return (
    <motion.button
      ref={self}
      className={`toy ${found ? 'is-found' : ''} ${climbing ? 'is-climbing' : ''} ${speech ? 'is-talking' : ''}`}
      // feet on the floor line: centred on x, standing up from y.
      // Position moves with a plain CSS transition; Motion handles the entrance, hover and waddle.
      style={{
        x: '-50%',
        y: '-100%',
        zIndex: speech ? 50 : 2 + floor,
        left: `${x}%`,
        top: `${y}%`,
        transition: `left ${duration}s ease-in-out, top ${climbing ? CLIMB_SECONDS : 0}s ease-in-out`,
      }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ opacity: { duration: 0.5 }, scale: { type: 'spring', bounce: 0.5 } }}
      onTransitionEnd={(e) => {
        if (e.target !== e.currentTarget) return
        if ((e.propertyName === 'left' && phase !== 'climb') || (e.propertyName === 'top' && phase === 'climb')) onArrive()
      }}
      whileHover={{ scale: 1.08 }}
      onPointerDown={(e) => (pointer.current = e.pointerType)}
      onMouseEnter={talk}
      // on a phone the first tap says hello; tapping again while they talk opens their card
      onClick={() => (pointer.current !== 'mouse' && !speech ? talk() : onOpen())}
      aria-label={`${toy.name}: say hello, or open their card`}
    >
      <motion.span
        key={`${hop}-${waving}`}
        className="toy__body"
        animate={
          phase === 'talk' && waving
            ? { y: [0, -10, 0, -5, 0], rotate: [0, -9, 9, -7, 5, 0] }
            : moving
            ? { y: [0, -6, 0], rotate: [-4, 4, -4] }
            : climbing
              ? { y: 0, rotate: [-7, 7, -7] }
              : hop
                ? { y: [0, -22, 0] }
                : { y: 0, rotate: 0 }
        }
        transition={
          phase === 'talk' ? { duration: 0.9, ease: 'easeInOut' } : moving || climbing ? { duration: climbing ? 0.4 : 0.55, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.5, ease: 'easeOut' }
        }
      >
        <img src={toy.photo} alt="" draggable={false} style={{ transform: facingLeft ? 'scaleX(-1)' : undefined }} />
      </motion.span>
      <span className="toy__name">{toy.name}</span>
      {speech && (
        <motion.span
          className="toy__bubble"
          role="status"
          style={{ x: '-50%' }}
          initial={{ opacity: 0, scale: 0.6, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0.45, duration: 0.4 }}
        >
          <span className="toy__bubble-who">{toy.name}</span>
          {speech.slice(0, typed)}
          {/* the rest is laid out but hidden, so the bubble doesn't grow as it types */}
          <span className="toy__bubble-rest">{speech.slice(typed)}</span>
        </motion.span>
      )}
    </motion.button>
  )
}
