import { useState } from 'react'

/**
 * A hand-painted sticker from public/moments/<moment>/stickers/<name>.webp.
 * Missing ones simply don't show (in edit mode they leave a labelled gap).
 */
export function Sticker({ momentId, name, editing, className = '' }: { momentId: string; name: string; editing?: boolean; className?: string }) {
  const [missing, setMissing] = useState(false)
  if (missing) return editing ? <span className={`sticker sticker--missing ${className}`}>{name}</span> : null
  return (
    <img
      className={`sticker ${className}`}
      src={`/moments/${momentId}/stickers/${name}.webp`}
      alt=""
      draggable={false}
      onError={() => setMissing(true)}
    />
  )
}
