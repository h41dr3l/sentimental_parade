import { go } from '../lib/router'

/** The little treehouse that floats in the bottom-right corner of Big Moments and opens the toy house. */
export function ToyHouseButton() {
  return (
    <button className="toyhouse-fab" onClick={() => go('toys')} aria-label="Visit the toy house" title="Visit the toy house">
      <img src="/moments/toyhouse/icon.webp" alt="" draggable={false} />
    </button>
  )
}
