import { createContext, useContext } from 'react'
import type { Moment, Photo, Place } from '../types'

export interface JourneyCtx {
  momentId: string
  editing: boolean
  places: Place[]
  selectedMoment: string | null
  selectMoment: (id: string | null) => void
  updateMoment: (id: string, patch: Partial<Moment>) => void
  updatePhoto: (momentId: string, photoId: string, patch: Partial<Photo> | null) => void
  openPhoto: (photo: Photo) => void
}

export const JourneyContext = createContext<JourneyCtx | null>(null)

export function useJourney() {
  const ctx = useContext(JourneyContext)
  if (!ctx) throw new Error('useJourney outside <Journey>')
  return ctx
}
