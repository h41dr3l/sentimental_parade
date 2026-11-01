import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { codeMatches, isAuthorised, lockCookie, unlockCookie } from '../server/auth'
import { blobStore, blobToken, handleToys } from '../server/toys'
import { fileStore, localPhotoPath } from './localToys'

/** Locally the lock behaves like on Vercel (same code, same cookie), just with a throwaway secret. */
const DEV_SECRET = process.env.AUTH_SECRET || 'dev-only-secret'
const PRIVATE = /^\/(content|moments|uploads)\//

/**
 * Dev-only plugin that lets edit mode write back into the project:
 *   POST /__scrapbook/save?moment=<id>         body: page JSON  -> public/content/<id>.json
 *   POST /__scrapbook/upload?moment=<id>&ext=x body: image     -> public/uploads/<id>/<file>
 * It also serves /content and /uploads straight from disk, because Vite's own
 * public-file index doesn't see files written while the server is running.
 */
const MOMENT_ID = /^[a-z0-9-]+$/
const MEDIA_TYPES: Record<string, string> = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
}
// Room for short phone videos; the editor warns about anything big before uploading.
const MAX_BODY = 150 * 1024 * 1024

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > MAX_BODY) {
        reject(new Error('Body too large'))
        req.destroy()
      } else chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export function scrapbookEditor(): Plugin {
  let publicDir = ''
  let toysRoot = ''
  return {
    name: 'scrapbook-editor',
    apply: 'serve',
    configResolved(config) {
      // Normalise so the path checks below work with Windows separators too.
      publicDir = path.resolve(config.publicDir)
      toysRoot = path.resolve(config.root, '.local-toys')
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const moment = url.searchParams.get('moment') ?? ''

        try {
          // The lock (mirrors middleware.ts and api/unlock.ts).
          if (url.pathname === '/api/unlock') {
            if (req.method === 'GET') return send(res, 200, { unlocked: await isAuthorised(req.headers.cookie ?? null, DEV_SECRET) })
            if (req.method === 'DELETE') {
              res.setHeader('Set-Cookie', lockCookie(false))
              return send(res, 200, { ok: true })
            }
            if (req.method === 'POST') {
              const { code } = JSON.parse((await readBody(req)).toString('utf8') || '{}')
              if (!(await codeMatches(String(code ?? ''), process.env.PASSCODE_HASH || undefined))) return send(res, 401, { ok: false })
              res.setHeader('Set-Cookie', await unlockCookie(DEV_SECRET, false))
              return send(res, 200, { ok: true })
            }
          }
          if (PRIVATE.test(url.pathname) && !(await isAuthorised(req.headers.cookie ?? null, DEV_SECRET))) {
            res.statusCode = 401
            return res.end('Locked')
          }

          // The soft-toy catalogue (mirrors api/toys.ts; uses Vercel Blob if a token is set, else .local-toys/).
          if (url.pathname === '/api/toys' || url.pathname.startsWith('/__toys/photo/')) {
            if (!(await isAuthorised(req.headers.cookie ?? null, DEV_SECRET))) return send(res, 401, { error: 'Locked' })
            if (url.pathname.startsWith('/__toys/photo/')) {
              const file = localPhotoPath(toysRoot, decodeURIComponent(url.pathname.slice('/__toys/photo/'.length)))
              if (!file) return send(res, 404, { error: 'Not found' })
              res.setHeader('Content-Type', 'image/webp')
              fs.createReadStream(file).pipe(res)
              return
            }
            const headers = new Headers()
            for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v)
            const hasBody = req.method === 'POST' || req.method === 'PUT'
            const request = new Request(`http://localhost${req.url}`, { method: req.method, headers, body: hasBody ? new Uint8Array(await readBody(req)) : undefined })
            const response = await handleToys(request, blobToken() ? blobStore() : fileStore(toysRoot))
            res.statusCode = response.status
            response.headers.forEach((v, k) => res.setHeader(k, v))
            res.end(Buffer.from(await response.arrayBuffer()))
            return
          }

          if (req.method === 'GET' && /^\/(content|uploads|moments\/[a-z0-9-]+\/stickers)\//.test(url.pathname)) {
            const file = path.resolve(publicDir, '.' + decodeURIComponent(url.pathname))
            if (!file.startsWith(publicDir + path.sep) || !fs.existsSync(file)) return next()
            const ext = path.extname(file).slice(1).toLowerCase()
            const size = fs.statSync(file).size
            res.setHeader('Content-Type', ext === 'json' ? 'application/json' : (MEDIA_TYPES[ext] ?? 'application/octet-stream'))
            res.setHeader('Cache-Control', 'no-store')
            res.setHeader('Accept-Ranges', 'bytes')
            // Videos are fetched in byte ranges (Safari won't play them otherwise).
            const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '')
            if (range) {
              const start = range[1] ? +range[1] : 0
              const end = range[2] ? Math.min(+range[2], size - 1) : size - 1
              res.statusCode = 206
              res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`)
              res.setHeader('Content-Length', end - start + 1)
              fs.createReadStream(file, { start, end }).pipe(res)
            } else {
              res.setHeader('Content-Length', size)
              fs.createReadStream(file).pipe(res)
            }
            return
          }

          if (req.method === 'POST' && url.pathname === '/__scrapbook/save') {
            if (!MOMENT_ID.test(moment)) return send(res, 400, { error: 'bad moment id' })
            const doc = JSON.parse((await readBody(req)).toString('utf8'))
            if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return send(res, 400, { error: 'not a scrapbook document' })
            const dir = path.join(publicDir, 'content')
            fs.mkdirSync(dir, { recursive: true })
            fs.writeFileSync(path.join(dir, `${moment}.json`), JSON.stringify(doc, null, 2) + '\n')
            return send(res, 200, { ok: true })
          }

          if (req.method === 'POST' && url.pathname === '/__scrapbook/sticker') {
            const name = url.searchParams.get('name') ?? ''
            if (!MOMENT_ID.test(moment) || !MOMENT_ID.test(name)) return send(res, 400, { error: 'bad sticker' })
            const dir = path.join(publicDir, 'moments', moment, 'stickers')
            fs.mkdirSync(dir, { recursive: true })
            fs.writeFileSync(path.join(dir, `${name}.webp`), await readBody(req))
            return send(res, 200, { src: `/moments/${moment}/stickers/${name}.webp` })
          }

          if (req.method === 'POST' && url.pathname === '/__scrapbook/upload') {
            const ext = (url.searchParams.get('ext') ?? '').toLowerCase()
            if (!MOMENT_ID.test(moment) || !MEDIA_TYPES[ext]) return send(res, 400, { error: 'bad upload' })
            const body = await readBody(req)
            const dir = path.join(publicDir, 'uploads', moment)
            fs.mkdirSync(dir, { recursive: true })
            const name = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
            fs.writeFileSync(path.join(dir, name), body)
            return send(res, 200, { src: `/uploads/${moment}/${name}` })
          }
        } catch (err) {
          return send(res, 500, { error: String(err) })
        }
        next()
      })
    },
  }
}
