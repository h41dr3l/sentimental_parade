import { isAuthorised } from '../server/auth'
import { blobStore, handleToys } from '../server/toys'

/** The soft-toy catalogue (list, add, edit, remove). Only for unlocked visitors. */
async function guarded(request: Request) {
  const secret = process.env.AUTH_SECRET
  if (!secret || !(await isAuthorised(request.headers.get('cookie'), secret))) return Response.json({ error: 'Locked' }, { status: 401 })
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ error: 'Add a Blob store to the Vercel project' }, { status: 500 })
  return handleToys(request, blobStore())
}

export const GET = guarded
export const POST = guarded
export const PUT = guarded
export const DELETE = guarded
