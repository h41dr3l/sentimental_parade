/**
 * Talks to the server-side lock (api/unlock.ts). The code is only ever checked on the
 * server, which then sets an HttpOnly cookie that lets the photos and story load.
 * The passcode and how to change it live in server/auth.ts.
 */
export const DIGITS = 4
const KEY = 'big-moments:unlocked'

export async function checkCode(code: string) {
  try {
    const res = await fetch('/api/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Asks the server whether this browser's unlock cookie is still good. */
export async function stillUnlocked() {
  try {
    const res = await fetch('/api/unlock', { cache: 'no-store' })
    return res.ok && (await res.json()).unlocked === true
  } catch {
    return false
  }
}

export async function lockAgain() {
  remember(false)
  try {
    await fetch('/api/unlock', { method: 'DELETE' })
  } catch {
    // the local flag is cleared either way
  }
}

/** A hint so returning visitors skip the lock screen without a flash; the server has the final say. */
export function isUnlocked() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function remember(unlocked: boolean) {
  try {
    if (unlocked) localStorage.setItem(KEY, '1')
    else localStorage.removeItem(KEY)
  } catch {
    // private mode etc.: they'll just see the lock again next time
  }
}
