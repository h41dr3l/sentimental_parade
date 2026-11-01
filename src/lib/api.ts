import { remember } from './lock'

export const CAN_EDIT = import.meta.env.DEV

export async function loadDoc<T>(momentId: string): Promise<T> {
  const res = await fetch(`/content/${momentId}.json`, { cache: 'no-store' })
  if (res.status === 401) {
    // the unlock cookie has expired: back to the lock
    remember(false)
    window.location.reload()
  }
  if (!res.ok) throw new Error(`Could not load ${momentId}`)
  return res.json()
}

export async function saveDoc(momentId: string, doc: unknown) {
  const res = await fetch(`/__scrapbook/save?moment=${momentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  })
  if (!res.ok) throw new Error('Save failed')
}

/** Shrinks a pasted/dropped photo to a web-friendly WebP and stores it in public/uploads. */
export async function uploadImage(momentId: string, file: Blob): Promise<{ src: string; ratio: number }> {
  const bitmap = await createImageBitmap(file)
  const MAX = 1600
  const k = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * k)
  canvas.height = Math.round(bitmap.height * k)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Encode failed'))), 'image/webp', 0.86),
  )
  const res = await fetch(`/__scrapbook/upload?moment=${momentId}&ext=webp`, { method: 'POST', body: blob })
  if (!res.ok) throw new Error('Upload failed')
  const { src } = await res.json()
  return { src, ratio: +(canvas.height / canvas.width).toFixed(3) }
}

const VIDEO_EXT: Record<string, string> = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' }
/** Videos above this size get a warning: they make the site slow to load and bloat the repo. */
export const VIDEO_WARN_MB = 40

/** Stores a video as-is in public/uploads (no re-encoding in the browser). */
export async function uploadVideo(momentId: string, file: File): Promise<{ src: string; ratio: number }> {
  const ext = VIDEO_EXT[file.type]
  if (!ext) throw new Error(`Unsupported video type: ${file.type || 'unknown'} (use MP4, WebM or MOV)`)
  const ratio = await new Promise<number>((resolve) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      resolve(v.videoWidth ? +(v.videoHeight / v.videoWidth).toFixed(3) : 1.333)
      URL.revokeObjectURL(v.src)
    }
    v.onerror = () => resolve(1.333)
    v.src = URL.createObjectURL(file)
  })
  const res = await fetch(`/__scrapbook/upload?moment=${momentId}&ext=${ext}`, { method: 'POST', body: file })
  if (!res.ok) throw new Error('Upload failed')
  const { src } = await res.json()
  return { src, ratio }
}
