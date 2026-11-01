import fs from 'node:fs'
import path from 'node:path'
import type { Toy, ToyStore } from '../server/toys'

/** Stand-in for Vercel Blob while running locally: plain files in .local-toys/ (git-ignored). */
export function fileStore(root: string): ToyStore {
  const dataDir = path.join(root, 'data')
  const photoDir = path.join(root, 'photos')
  fs.mkdirSync(dataDir, { recursive: true })
  fs.mkdirSync(photoDir, { recursive: true })
  return {
    async all() {
      return fs
        .readdirSync(dataDir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8')) as Toy)
    },
    async savePhoto(id, image) {
      fs.writeFileSync(path.join(photoDir, `${id}.webp`), Buffer.from(await image.arrayBuffer()))
      return `/__toys/photo/${id}.webp`
    },
    async save(toy) {
      fs.writeFileSync(path.join(dataDir, `${toy.id}.json`), JSON.stringify(toy, null, 2))
    },
    async remove(toy) {
      fs.rmSync(path.join(dataDir, `${toy.id}.json`), { force: true })
      fs.rmSync(path.join(photoDir, `${toy.id}.webp`), { force: true })
    },
  }
}

export const localPhotoPath = (root: string, file: string) => {
  const p = path.resolve(root, 'photos', file)
  return p.startsWith(path.resolve(root, 'photos') + path.sep) && fs.existsSync(p) ? p : null
}
