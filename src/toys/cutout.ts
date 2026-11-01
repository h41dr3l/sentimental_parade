/**
 * Turns a phone photo of a soft toy into a cut-out with a see-through background,
 * trimmed to the toy and shrunk to a web-friendly WebP. Runs entirely on the device;
 * the first time it downloads the cut-out model (a few tens of MB), after that it's cached.
 */
export async function cutOutToy(file: Blob, onProgress?: (fraction: number) => void): Promise<Blob> {
  const { removeBackground } = await import('@imgly/background-removal')
  const cut = await removeBackground(file, {
    model: 'isnet_quint8',
    output: { format: 'image/png' },
    progress: (_key, current, total) => total && onProgress?.(current / total),
  })
  return trimAndShrink(cut, true)
}

/** Fallback when the cut-out fails or isn't wanted: keep the photo as it is, just smaller. */
export function shrinkPhoto(file: Blob) {
  return trimAndShrink(file, false)
}

async function trimAndShrink(image: Blob, trim: boolean, maxSide = 720): Promise<Blob> {
  const bitmap = await createImageBitmap(image)
  const src = document.createElement('canvas')
  src.width = bitmap.width
  src.height = bitmap.height
  const sx = src.getContext('2d')!
  sx.drawImage(bitmap, 0, 0)

  let box = { x: 0, y: 0, w: bitmap.width, h: bitmap.height }
  if (trim) {
    const { data, width, height } = sx.getImageData(0, 0, src.width, src.height)
    let minx = width, miny = height, maxx = -1, maxy = -1
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        if (data[(y * width + x) * 4 + 3] > 24) {
          if (x < minx) minx = x
          if (x > maxx) maxx = x
          if (y < miny) miny = y
          if (y > maxy) maxy = y
        }
    if (maxx >= 0) box = { x: minx, y: miny, w: maxx - minx + 1, h: maxy - miny + 1 }
  }

  const k = Math.min(1, maxSide / Math.max(box.w, box.h))
  const out = document.createElement('canvas')
  out.width = Math.round(box.w * k)
  out.height = Math.round(box.h * k)
  const ox = out.getContext('2d')!
  ox.imageSmoothingQuality = 'high'
  ox.drawImage(src, box.x, box.y, box.w, box.h, 0, 0, out.width, out.height)
  return new Promise((resolve, reject) => out.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not save the photo'))), 'image/webp', 0.9))
}
