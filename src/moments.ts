/**
 * The bookshelf. Each big moment is one book; its story lives in
 * public/content/<id>.json and its photos in public/moments/<id>/.
 * To add a new moment, add an entry here and create the JSON file.
 */
export interface BigMoment {
  id: string
  title: string
  dates: string
  /** Cover colours: cloth, and foil for the lettering. */
  cover: [string, string]
  /** Optional opening scene shown before the journey. */
  intro?: 'door'
  /** Sparkle cursor and night sky while inside this moment. */
  magical?: boolean
}

export const moments: BigMoment[] = [
  {
    id: 'disney-adventure',
    title: 'Disney Adventure',
    dates: '14 – 18 May 2026',
    cover: ['#2b2457', '#e8c873'],
    intro: 'door',
    magical: true,
  },
]
