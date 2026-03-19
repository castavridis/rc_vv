import { type TraitScoreMap } from './taste-profile'
import { type Trait } from './brand'

function buildTraitDefinitions(): string {
  return [
    'SINCERITY: Down-to-Earth, Family Oriented, Small-Town, Honest, Sincere, Real, Wholesome, Original, Cheerful, Sentimental, Friendly',
    'EXCITEMENT: Daring, Trendy, Exciting, Spirited, Cool, Young, Imaginative, Unique, Up-to-Date, Independent, Contemporary',
    'COMPETENCE: Reliable, Hard Working, Secure, Intelligent, Technical, Corporate, Successful, Leader, Confident',
    'SOPHISTICATION: Upper Class, Glamorous, Good Looking, Charming, Feminine, Smooth',
    'RUGGEDNESS: Outdoorsy, Masculine, Western, Tough, Rugged',
  ].join('\n')
}

function buildArtworkContext(
  artworks: { title: string; artist?: string | null; ratings: TraitScoreMap; direction: 'same' | 'opposing' }[]
): string {
  if (artworks.length === 0) return ''

  const lines = ['\n\nREFERENCE ARTWORKS (from the user\'s rated library):']
  for (const aw of artworks) {
    const label = aw.direction === 'same'
      ? 'Same-direction reference (aligns with user\'s taste)'
      : 'Opposing reference (contrasts with user\'s taste)'
    lines.push(`\n[${label}]`)
    lines.push(`Artwork: "${aw.title}"${aw.artist ? ` by ${aw.artist}` : ''}`)
    const topRatings = (Object.entries(aw.ratings) as [Trait, number][])
      .filter(([, s]) => s > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    lines.push(`User ratings: ${topRatings.map(([t, s]) => `${t}=${s}`).join(', ')}`)
  }
  return lines.join('\n')
}

const SYSTEM_PROMPT = `You are an expert in visual aesthetics and brand personality analysis using Jennifer Aaker's Brand Personality Framework.

Your task is to assess a given input (text description or image) against 42 brand personality traits. For each trait, decide whether it applies (1) or does not apply (0).

Traits by dimension:
${buildTraitDefinitions()}

Return ONLY a valid JSON object with all 42 trait names as keys and binary scores (0 or 1) as values. No markdown, no explanation, just the JSON object.`

export function buildTextPrompt(
  text: string,
  artworkContext: string
): { system: string; user: string } {
  return {
    system: SYSTEM_PROMPT,
    user: `${artworkContext}\n\nAssess the following text input against all 42 traits:\n\n"${text}"`,
  }
}

export function buildImagePrompt(
  imageUrl: string,
  artworkContext: string
): { system: string; userContent: unknown[] } {
  return {
    system: SYSTEM_PROMPT,
    userContent: [
      { type: 'text', text: `${artworkContext}\n\nAssess the following image against all 42 traits:` },
      { type: 'image_url', image_url: { url: imageUrl } },
      { type: 'text', text: 'Return only the JSON object with all 42 trait scores.' },
    ],
  }
}

export function buildReasonedImagePrompt(
  imageUrl: string,
  artworkContext: string,
  personaPrompt?: string
): { system: string; userContent: unknown[] } {
  const personaPrefix = personaPrompt ? `${personaPrompt}\n\n` : ''
  const system = `${personaPrefix}${SYSTEM_PROMPT.replace(
    'Return ONLY a valid JSON object with all 42 trait names as keys and binary scores (0 or 1) as values. No markdown, no explanation, just the JSON object.',
    'For each trait, return a JSON object where each key is a trait name and the value is an object with "score" (0 or 1) and "reason" (a brief 3-8 word explanation). No markdown, no explanation, just the JSON object.\n\nExample format:\n{"Down-to-Earth": {"score": 1, "reason": "warm earthy tones, grounded feel"}, ...}'
  )}`
  return {
    system,
    userContent: [
      { type: 'text', text: `${artworkContext}\n\nAssess the following image against all 42 traits:` },
      { type: 'image_url', image_url: { url: imageUrl } },
      { type: 'text', text: 'Return only the JSON object with all 42 trait scores and reasons.' },
    ],
  }
}

export { buildArtworkContext }
