/**
 * The soft-toy catalogue. Each toy is a small JSON record plus a cut-out photo.
 * On Vercel they live in Vercel Blob (set BLOB_READ_WRITE_TOKEN by adding a Blob store
 * to the project); locally, with no token, they live in .local-toys/ (git-ignored).
 * Every request must carry the unlock cookie.
 */
import { del, list, put } from '@vercel/blob'

export interface Toy {
  id: string
  name: string
  /** Birthday, or the day they came home (YYYY-MM-DD). Age is worked out from it. */
  birthday?: string
  origin: string
  personality: string
  gender: string
  memory: string
  photo: string
  /** Which home they live in, and which floor of it (0 = top). */
  house: string
  level: number
  createdAt: string
}

export interface ToyStore {
  all(): Promise<Toy[]>
  savePhoto(id: string, image: Blob): Promise<string>
  save(toy: Toy): Promise<void>
  remove(toy: Toy): Promise<void>
}

const FIELDS = ['name', 'birthday', 'origin', 'personality', 'gender', 'memory'] as const
/** The homes and how many floors each has (keep in step with src/toys/houses.ts). */
export const HOUSES: Record<string, number> = { treehouse: 3, penthouse: 3 }
const DEFAULT_HOUSE = 'treehouse'
/** Toys added before there was more than one house live in the treehouse. */
const withHouse = (t: Toy): Toy => (HOUSES[t.house] ? t : { ...t, house: DEFAULT_HOUSE })
const clean = (v: unknown, max = 600) => String(v ?? '').trim().slice(0, max)

/** Vercel Blob. Random suffixes keep the photo and record addresses unguessable. */
export function blobStore(): ToyStore {
  const dataUrl = new Map<string, string>()
  return {
    async all() {
      const { blobs } = await list({ prefix: 'toys/data/' })
      const toys = await Promise.all(
        blobs.map(async (b) => {
          const toy = (await (await fetch(b.url, { cache: 'no-store' })).json()) as Toy
          dataUrl.set(toy.id, b.url)
          return toy
        }),
      )
      return toys
    },
    async savePhoto(id, image) {
      const blob = await put(`toys/photos/${id}.webp`, image, { access: 'public', addRandomSuffix: true, contentType: 'image/webp' })
      return blob.url
    },
    async save(toy) {
      // write the new record first, then remove the old one, so a toy is never lost mid-edit
      const old = (await list({ prefix: `toys/data/${toy.id}` })).blobs.map((b) => b.url)
      await put(`toys/data/${toy.id}.json`, JSON.stringify(toy), { access: 'public', addRandomSuffix: true, contentType: 'application/json' })
      if (old.length) await del(old)
    },
    async remove(toy) {
      const old = (await list({ prefix: `toys/data/${toy.id}` })).blobs.map((b) => b.url)
      await del([...old, toy.photo].filter((u) => u.startsWith('https://')))
    },
  }
}

/** Handles /api/toys for whichever store is in use. */
export async function handleToys(request: Request, store: ToyStore): Promise<Response> {
  const url = new URL(request.url)
  const toys = (await store.all()).map(withHouse)

  if (request.method === 'GET') {
    toys.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    return Response.json({ toys }, { headers: { 'Cache-Control': 'no-store' } })
  }

  if (request.method === 'POST') {
    const form = await request.formData()
    const image = form.get('photo')
    if (!(image instanceof Blob) || image.size === 0) return Response.json({ error: 'A photo is needed' }, { status: 400 })
    if (image.size > 4 * 1024 * 1024) return Response.json({ error: 'Photo is too large' }, { status: 413 })
    const id = `toy-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const house = HOUSES[clean(form.get('house'), 40)] ? clean(form.get('house'), 40) : DEFAULT_HOUSE
    // fill the emptiest floor of that house
    const counts = Array.from({ length: HOUSES[house] }, (_, l) => toys.filter((t) => t.house === house && t.level === l).length)
    const toy: Toy = {
      id,
      name: clean(form.get('name'), 60) || 'New friend',
      birthday: clean(form.get('birthday'), 10) || undefined,
      origin: clean(form.get('origin')),
      personality: clean(form.get('personality')),
      gender: clean(form.get('gender'), 40),
      memory: clean(form.get('memory'), 2000),
      photo: await store.savePhoto(id, image),
      house,
      level: counts.indexOf(Math.min(...counts)),
      createdAt: new Date().toISOString(),
    }
    await store.save(toy)
    return Response.json({ toy })
  }

  const id = url.searchParams.get('id') ?? ''
  const toy = toys.find((t) => t.id === id)
  if (!toy) return Response.json({ error: 'No such toy' }, { status: 404 })

  if (request.method === 'PUT') {
    const body = (await request.json()) as Partial<Toy>
    const next: Toy = { ...toy }
    for (const f of FIELDS) if (f in body) next[f] = clean(body[f], f === 'memory' ? 2000 : 600) || (f === 'name' ? toy.name : '')
    if (typeof body.house === 'string' && HOUSES[body.house]) next.house = body.house
    if (typeof body.level === 'number' && Number.isInteger(body.level)) next.level = body.level
    next.level = Math.min(Math.max(0, next.level), HOUSES[next.house] - 1)
    if (!next.birthday) delete next.birthday
    await store.save(next)
    return Response.json({ toy: next })
  }

  if (request.method === 'DELETE') {
    await store.remove(toy)
    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
