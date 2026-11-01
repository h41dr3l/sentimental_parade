export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

/** Hover/arrival magic for a single photo. */
export type PhotoFx = 'bob' | 'shimmer' | 'glow' | 'alive' | 'energy' | 'gold'

/** Something that happens while a moment is on screen. */
export type MomentEffect = 'horn' | 'fireworks' | 'lanterns'

export interface Photo {
  id: string
  src: string
  caption: string
  /** A short clip instead of a still: loops silently in the frame, plays with sound when opened. */
  kind?: 'video'
  /** Photo height / width. */
  ratio?: number
  fx?: PhotoFx
  /** Nudge from its resting spot, in px, and tilt in degrees (set by dragging in edit mode). */
  dx?: number
  dy?: number
  rot?: number
}

export interface Moment {
  id: string
  time: TimeOfDay
  /** Id of a place on the ship map, if we know where it happened. */
  place?: string
  text: string
  photos: Photo[]
  stickers?: string[]
  effect?: MomentEffect
  autographs?: { name: string; note: string }[]
}

export interface Day {
  id: string
  label: string
  date: string
  title: string
  moments: Moment[]
}

export interface Place {
  id: string
  name: string
  /** Pin position on the ship drawing, in % of its width / height. */
  x: number
  y: number
}

export interface JourneyDoc {
  title: string
  prologue: { place: string; date: string; line: string }
  days: Day[]
  epilogue: { date: string; title: string; line: string }
  places: Place[]
}
