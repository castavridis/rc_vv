/**
 * Extract isolated objects from a FLUX.2 Flex "isolated" image.
 * Uses canvas pixel manipulation to threshold near-white pixels as transparent,
 * then finds bounding boxes of non-white regions and slices them into separate images.
 */

const WHITE_THRESHOLD = 240

function isWhite(r: number, g: number, b: number): boolean {
  return r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD
}

/** Load an image URL into an HTMLImageElement */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Find the bounding box of non-white pixels in an ImageData region */
function findContentBounds(
  data: Uint8ClampedArray,
  width: number,
  height: number
): { x: number; y: number; w: number; h: number } | null {
  let minX = width, maxX = 0, minY = height, maxY = 0
  let found = false

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (!isWhite(data[i], data[i + 1], data[i + 2]) && data[i + 3] > 0) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
        found = true
      }
    }
  }

  if (!found) return null
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

/**
 * Given an image URL of 3 isolated objects side-by-side on a white background,
 * extract each object as a separate PNG data URI.
 *
 * Strategy: divide the image into 3 equal vertical strips, find non-white bounds
 * in each strip, extract with padding, make white pixels transparent.
 */
export async function extractIsolatedObjects(imageUrl: string): Promise<string[]> {
  const img = await loadImage(imageUrl)
  const { naturalWidth: w, naturalHeight: h } = img

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  const fullData = ctx.getImageData(0, 0, w, h)

  const stripWidth = Math.floor(w / 3)
  const results: string[] = []

  for (let strip = 0; strip < 3; strip++) {
    const startX = strip * stripWidth
    const endX = strip === 2 ? w : startX + stripWidth
    const stripW = endX - startX

    // Extract strip pixel data
    const stripData = ctx.getImageData(startX, 0, stripW, h)

    // Find content bounds in this strip
    const bounds = findContentBounds(stripData.data, stripW, h)
    if (!bounds) continue

    const padding = 8
    const cropX = Math.max(0, bounds.x - padding)
    const cropY = Math.max(0, bounds.y - padding)
    const cropW = Math.min(stripW, bounds.x + bounds.w + padding) - cropX
    const cropH = Math.min(h, bounds.y + bounds.h + padding) - cropY

    // Create output canvas for this object
    const outCanvas = document.createElement('canvas')
    outCanvas.width = cropW
    outCanvas.height = cropH
    const outCtx = outCanvas.getContext('2d')!

    // Draw the cropped region
    outCtx.drawImage(img, startX + cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

    // Make white pixels transparent
    const outData = outCtx.getImageData(0, 0, cropW, cropH)
    for (let i = 0; i < outData.data.length; i += 4) {
      if (isWhite(outData.data[i], outData.data[i + 1], outData.data[i + 2])) {
        outData.data[i + 3] = 0
      }
    }
    outCtx.putImageData(outData, 0, 0)

    results.push(outCanvas.toDataURL('image/png'))
  }

  return results
}
