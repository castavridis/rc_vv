import { TRAIT_INDEX } from './trait-index'
import { type Trait } from './brand'

/** Convert hex to [h, s, l] — h: 0–360, s/l: 0–1 — for Poline */
function hexToHsl(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }

  return [h * 360, s, l]
}

/** Convert [h, s, l] (h: 0–360, s/l: 0–1) to hex */
function hslToHex(h: number, s: number, l: number): string {
  const hn = h / 360
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  function hue2rgb(t: number) {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  const toHex = (v: number) => Math.round(Math.min(255, Math.max(0, v * 255))).toString(16).padStart(2, '0')
  return `#${toHex(hue2rgb(hn + 1 / 3))}${toHex(hue2rgb(hn))}${toHex(hue2rgb(hn - 1 / 3))}`
}

/**
 * Derive top anchor hex colors from the session's trait profile.
 * Takes top-scoring traits, looks up their highest-scored colors.
 */
export function getAnchorColorsFromProfile(
  traitScores: { trait: string; score: number }[],
  maxAnchors = 4
): string[] {
  const sorted = [...traitScores]
    .filter(t => t.score > 0)
    .sort((a, b) => b.score - a.score)

  const seen = new Set<string>()
  const anchors: string[] = []

  for (const { trait } of sorted) {
    if (anchors.length >= maxAnchors) break
    const colors = TRAIT_INDEX[trait as Trait]
    if (!colors || colors.length === 0) continue
    const topColor = colors[0]
    if (!seen.has(topColor.hex)) {
      seen.add(topColor.hex)
      anchors.push(topColor.hex)
    }
  }

  // Fallback if not enough anchors
  if (anchors.length < 2) anchors.push('#18181b', '#f4f4f5')

  return anchors
}

/**
 * Generate a Poline palette from anchor hex colors.
 * Returns an array of hex strings.
 *
 * Poline is imported dynamically to avoid SSR issues.
 */
export async function generatePolinePalette(
  anchorHexes: string[],
  numColors = 8
): Promise<string[]> {
  const { Poline, positionFunctions } = await import('poline')

  const anchorPoints = anchorHexes.map(hex => hexToHsl(hex))

  const poline = new Poline({
    anchorColors: anchorPoints,
    numPoints: numColors,
    positionFunction: positionFunctions.sinusoidal,
  })

  return poline.colors.map(([h, s, l]: [number, number, number]) => hslToHex(h, s, l))
}
