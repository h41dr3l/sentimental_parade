/**
 * The real lock, checked on the server (Vercel middleware + /api functions) and
 * mirrored by the dev server. Uses only Web Crypto so it runs everywhere.
 *
 * Settings (Vercel → Project → Settings → Environment Variables):
 *   AUTH_SECRET    any long random string; signs the "unlocked" cookie. Required.
 *   PASSCODE_HASH  optional; sha256 of `big-moments:<code>`. Defaults to the hash below.
 *
 * To change the code, run (with your new digits):
 *   node -e "console.log(require('crypto').createHash('sha256').update('big-moments:YOUR-CODE').digest('hex'))"
 */
const DEFAULT_PASSCODE_HASH = '9714aba56d8cee46e5017c2b96f918d95b3d4ad20b9966d80a73cf96016256d7'
export const COOKIE = 'bm_auth'
const MAX_AGE = 60 * 60 * 24 * 180 // stay unlocked for about six months

const enc = new TextEncoder()
const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')

export async function codeMatches(code: string, passcodeHash = DEFAULT_PASSCODE_HASH) {
  if (!/^\d{1,12}$/.test(code)) return false
  const digest = hex(await crypto.subtle.digest('SHA-256', enc.encode(`big-moments:${code}`)))
  return digest === passcodeHash
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(value)))
}

/** Set-Cookie header value for a freshly unlocked browser. */
export async function unlockCookie(secret: string, secure: boolean) {
  const expires = String(Math.floor(Date.now() / 1000) + MAX_AGE)
  const value = `${expires}.${await sign(expires, secret)}`
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${secure ? '; Secure' : ''}`
}

export function lockCookie(secure: boolean) {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`
}

/** True if the request carries a valid, unexpired unlock cookie. */
export async function isAuthorised(cookieHeader: string | null, secret: string) {
  const match = cookieHeader?.match(new RegExp(`(?:^|;\\s*)${COOKIE}=(\\d+)\\.([0-9a-f]{64})`))
  if (!match) return false
  const [, expires, sig] = match
  if (+expires < Date.now() / 1000) return false
  const expected = await sign(expires, secret)
  // constant-time-ish comparison
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  return diff === 0
}
