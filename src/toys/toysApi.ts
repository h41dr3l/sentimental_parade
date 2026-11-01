import type { Toy } from '../../server/toys'

export type { Toy }
export type ToyDetails = Pick<Toy, 'name' | 'birthday' | 'origin' | 'personality' | 'gender' | 'memory'>

async function json<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error ?? `Something went wrong (${res.status})`)
  return body as T
}

export async function fetchToys() {
  return (await json<{ toys: Toy[] }>(await fetch('/api/toys', { cache: 'no-store' }))).toys
}

export async function addToy(photo: Blob, details: ToyDetails, house: string) {
  const form = new FormData()
  form.append('house', house)
  form.append('photo', photo, 'toy.webp')
  for (const [k, v] of Object.entries(details)) form.append(k, v ?? '')
  return (await json<{ toy: Toy }>(await fetch('/api/toys', { method: 'POST', body: form }))).toy
}

export async function updateToy(id: string, patch: Partial<ToyDetails & { house: string; level: number }>) {
  const res = await fetch(`/api/toys?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  return (await json<{ toy: Toy }>(res)).toy
}

export async function deleteToy(id: string) {
  await json(await fetch(`/api/toys?id=${encodeURIComponent(id)}`, { method: 'DELETE' }))
}

/** "3 years old", "7 months old", or '' when we don't know the birthday. */
export function ageFrom(birthday?: string) {
  if (!birthday) return ''
  const b = new Date(birthday)
  if (Number.isNaN(b.getTime())) return ''
  const now = new Date()
  let months = (now.getFullYear() - b.getFullYear()) * 12 + now.getMonth() - b.getMonth()
  if (now.getDate() < b.getDate()) months--
  if (months < 1) return 'brand new'
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} old`
  const years = Math.floor(months / 12)
  return `${years} year${years === 1 ? '' : 's'} old`
}
