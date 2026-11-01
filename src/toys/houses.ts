import type { Floor } from './WalkingToy'
import type { Toy } from './toysApi'

/** A ladder or staircase toys can climb between two floors, at x (% of the picture). */
export interface Climb {
  from: number
  to: number
  x: number
}

export interface House {
  id: string
  name: string
  art: string
  alt: string
  /** Where toys can stand on each floor, in % of the picture (top floor first). */
  floors: Floor[]
  climbs: Climb[]
  /** Page background around the picture. */
  backdrop: string
}

/** The homes. Floor counts must match HOUSES in server/toys.ts. */
export const HOUSES: House[] = [
  {
    id: 'treehouse',
    name: 'The Treehouse',
    art: '/moments/toyhouse/treehouse.webp',
    alt: 'A cosy treehouse with a bedroom loft, a library and a kitchen',
    floors: [
      { name: 'the bedroom loft', y: 38, x0: 28, x1: 73 },
      { name: 'the library', y: 59.5, x0: 28, x1: 73 },
      { name: 'the kitchen', y: 82.5, x0: 27, x1: 72 },
    ],
    climbs: [
      { from: 0, to: 1, x: 26 },
      { from: 1, to: 2, x: 74.5 },
    ],
    backdrop: 'linear-gradient(180deg, #d3e4ea 0%, #eef0e2 55%, #d7dfbd 100%)',
  },
  {
    id: 'penthouse',
    name: 'The Pink Penthouse',
    art: '/moments/toyhouse/penthouse.webp',
    alt: 'A pink city penthouse with a glass-roofed bedroom, a living room and a kitchen',
    floors: [
      { name: 'the glass-roof bedroom', y: 42.9, x0: 30, x1: 80 },
      { name: 'the living room', y: 67.9, x0: 22, x1: 80 },
      { name: 'the kitchen', y: 93.2, x0: 22, x1: 80 },
    ],
    climbs: [
      { from: 0, to: 1, x: 27 },
      { from: 1, to: 2, x: 27 },
      { from: 1, to: 2, x: 77 },
    ],
    backdrop: 'linear-gradient(180deg, #e4dcef 0%, #f4e7e8 55%, #ead8d6 100%)',
  },
  {
    id: 'castle',
    name: 'The Underwater Castle',
    art: '/moments/toyhouse/castle.webp',
    alt: 'A castle on the sea floor with a clam-shell bedroom, a coral sitting room and a sea-glass kitchen',
    floors: [
      { name: 'the shell bedroom', y: 43.8, x0: 41, x1: 70 },
      { name: 'the coral sitting room', y: 64.6, x0: 35, x1: 68 },
      { name: 'the sea-glass kitchen', y: 85.8, x0: 35, x1: 72 },
    ],
    climbs: [
      { from: 0, to: 1, x: 31 },
      { from: 1, to: 2, x: 29 },
      { from: 0, to: 1, x: 71 },
    ],
    backdrop: 'linear-gradient(180deg, #bcdde6 0%, #d6ecee 55%, #e4e2cf 100%)',
  },
  {
    id: 'bathhouse',
    name: 'The Lantern Bathhouse',
    art: '/moments/toyhouse/bathhouse.webp',
    alt: 'A Japanese wooden bathhouse with a tatami loft, a tea room and a steaming cedar bath',
    floors: [
      { name: 'the tatami loft', y: 41.3, x0: 36, x1: 76 },
      { name: 'the tea room', y: 65, x0: 27, x1: 68 },
      { name: 'the cedar bath', y: 88, x0: 26, x1: 74 },
    ],
    climbs: [
      { from: 0, to: 1, x: 30 },
      { from: 1, to: 2, x: 70 },
    ],
    backdrop: 'linear-gradient(180deg, #c9cde6 0%, #e6e0ea 55%, #d9d3c4 100%)',
  },
]

export const houseById = (id?: string) => HOUSES.find((h) => h.id === id) ?? HOUSES[0]

/** "The Treehouse · the library" */
export function whereLabel(toy: Toy) {
  const house = houseById(toy.house)
  return `${house.name} · ${house.floors[toy.level]?.name ?? house.floors[0].name}`
}
