import { useEffect, useState } from 'react'

/** Tiny hash router: #/ , #/<moment> , #/<moment>/book . Works on any static host. */
export function useRoute(): string[] {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  const [parts, setParts] = useState(read)
  useEffect(() => {
    const onChange = () => setParts(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return parts
}

export function go(path: string) {
  window.location.hash = '#/' + path.replace(/^\//, '')
}
