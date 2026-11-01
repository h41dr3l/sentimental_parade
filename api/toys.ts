import { isAuthorised } from '../server/auth.js'
import { blobConfigured, blobStore, handleToys } from '../server/toys.js'

/** The soft-toy catalogue (list, add, edit, remove). Only for unlocked visitors. */
async function guarded(request: Request) {
  const secret = process.env.AUTH_SECRET
  if (!secret || !(await isAuthorised(request.headers.get('cookie'), secret))) return Response.json({ error: 'Locked' }, { status: 401 })
  if (!blobConfigured()) return Response.json({ error: 'Add a Blob store to the Vercel project' }, { status: 500 })
  try {
    return await handleToys(request, blobStore())
  } catch (e) {
    // surface the storage error so it can be fixed, rather than a bare 500
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export const GET = guarded
export const POST = guarded
export const PUT = guarded
export const DELETE = guarded
