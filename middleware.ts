import { next } from '@vercel/functions'
import { isAuthorised } from './server/auth.js'

/**
 * Vercel runs this before serving any of the scrapbook's private files:
 * the story text, photos, videos and uploads. Without a valid unlock cookie they get a 401,
 * so the files can't be opened by guessing their address.
 * (The app shell and the lock screen itself stay public.)
 */
export const config = {
  matcher: ['/content/:path*', '/moments/:path*', '/uploads/:path*'],
}

export default async function middleware(request: Request) {
  const secret = process.env.AUTH_SECRET
  if (!secret) return new Response('Set AUTH_SECRET in the Vercel project settings.', { status: 500 })
  if (await isAuthorised(request.headers.get('cookie'), secret)) return next()
  return new Response('Locked', { status: 401, headers: { 'Cache-Control': 'no-store' } })
}
