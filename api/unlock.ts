import { codeMatches, isAuthorised, lockCookie, unlockCookie } from '../server/auth'

/** GET → is this browser unlocked? (The cookie is HttpOnly, so the page can't check it itself.) */
export async function GET(request: Request) {
  const secret = process.env.AUTH_SECRET
  const unlocked = !!secret && (await isAuthorised(request.headers.get('cookie'), secret))
  return Response.json({ unlocked }, { headers: { 'Cache-Control': 'no-store' } })
}

/** POST { code } → sets the unlock cookie if the code is right. DELETE → locks again. */
export async function POST(request: Request) {
  const secret = process.env.AUTH_SECRET
  if (!secret) return Response.json({ error: 'AUTH_SECRET is not set' }, { status: 500 })
  const { code } = (await request.json().catch(() => ({}))) as { code?: unknown }
  const ok = await codeMatches(String(code ?? ''), process.env.PASSCODE_HASH || undefined)
  // a short pause makes guessing all 10,000 codes slow and tedious
  if (!ok) {
    await new Promise((r) => setTimeout(r, 400))
    return Response.json({ ok: false }, { status: 401 })
  }
  return Response.json({ ok: true }, { headers: { 'Set-Cookie': await unlockCookie(secret, true) } })
}

export function DELETE() {
  return Response.json({ ok: true }, { headers: { 'Set-Cookie': lockCookie(true) } })
}
