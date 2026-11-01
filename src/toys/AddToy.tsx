import { useEffect, useMemo, useRef, useState } from 'react'
import { cutOutToy, shrinkPhoto } from './cutout'
import { addToy, type Toy } from './toysApi'
import { EMPTY_DETAILS, ToyForm } from './ToyForm'

type Step = { kind: 'photo' } | { kind: 'cutting'; progress: number } | { kind: 'details'; cut: Blob | null; original: Blob; useCut: boolean }

/** Take a photo → the toy gets cut out of the background → fill in their card → they move in. */
export function AddToy({ house, onAdded, onClose }: { house: { id: string; name: string }; onAdded: (toy: Toy) => void; onClose: () => void }) {
  const [step, setStep] = useState<Step>({ kind: 'photo' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const camera = useRef<HTMLInputElement>(null)
  const library = useRef<HTMLInputElement>(null)

  const pick = async (file?: File) => {
    if (!file) return
    setError('')
    setStep({ kind: 'cutting', progress: 0 })
    try {
      const cut = await cutOutToy(file, (p) => setStep({ kind: 'cutting', progress: p }))
      setStep({ kind: 'details', cut, original: file, useCut: true })
    } catch {
      // the cut-out couldn't run (old phone, no connection for the model): keep the plain photo
      setError("Couldn't cut the toy out automatically, so the whole photo will be used.")
      setStep({ kind: 'details', cut: null, original: file, useCut: false })
    }
  }

  const previewBlob = step.kind === 'details' ? (step.useCut && step.cut ? step.cut : step.original) : null
  const preview = useMemo(() => (previewBlob ? URL.createObjectURL(previewBlob) : ''), [previewBlob])
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview])

  return (
    <div className="toy-sheet" role="dialog" aria-label="Add a soft toy" onClick={onClose}>
      <div className="toy-sheet__card add-toy" onClick={(e) => e.stopPropagation()}>
        <h2>A new friend moves in</h2>
        <p className="add-toy__where">to {house.name}</p>

        {step.kind === 'photo' && (
          <div className="add-toy__photo">
            <p>Take a photo of them on a plain background, standing up if they can.</p>
            <button className="toy-btn" onClick={() => camera.current?.click()}>
              Take a photo
            </button>
            <button className="text-btn" onClick={() => library.current?.click()}>
              or choose one from your photos
            </button>
            <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pick(e.target.files?.[0])} />
            <input ref={library} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
          </div>
        )}

        {step.kind === 'cutting' && (
          <div className="add-toy__cutting">
            <div className="add-toy__scissors" aria-hidden>
              ✂
            </div>
            <p>Cutting them out of the photo…</p>
            <div className="add-toy__bar">
              <span style={{ width: `${Math.round(step.progress * 100)}%` }} />
            </div>
            <p className="add-toy__note">The first time takes a little longer while it gets ready.</p>
          </div>
        )}

        {step.kind === 'details' && (
          <>
            <div className="add-toy__preview">
              <img src={preview} alt="Your toy" />
              {step.cut && (
                <button className="text-btn" onClick={() => setStep({ ...step, useCut: !step.useCut })}>
                  {step.useCut ? 'use the whole photo instead' : 'use the cut-out'}
                </button>
              )}
              <button className="text-btn" onClick={() => setStep({ kind: 'photo' })}>
                retake
              </button>
            </div>
            {error && <p className="toy-error">{error}</p>}
            <ToyForm
              initial={EMPTY_DETAILS}
              saving={saving}
              submitLabel="Move in"
              onCancel={onClose}
              onSubmit={async (details) => {
                setSaving(true)
                setError('')
                try {
                  const photo = step.useCut && step.cut ? step.cut : await shrinkPhoto(step.original)
                  onAdded(await addToy(photo, details, house.id))
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e))
                  setSaving(false)
                }
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
