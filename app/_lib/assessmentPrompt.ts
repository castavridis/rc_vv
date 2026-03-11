import { BRAND_PERSONALITY, DIMENSIONS, type Trait } from './brand'
import { type TraitScoreMap } from './taste-profile'

const TRAIT_DESCRIPTIONS: Partial<Record<Trait, string>> = {
  'Down-to-Earth': 'approachable, grounded, unpretentious',
  'Family Oriented': 'warm, nurturing, domestic',
  'Small-Town': 'simple, local, community-rooted',
  'Honest': 'truthful, transparent, straightforward',
  'Sincere': 'genuine, heartfelt, authentic',
  'Real': 'unfiltered, raw, unpolished',
  'Wholesome': 'pure, clean, morally positive',
  'Original': 'inventive, first-of-its-kind, pioneering',
  'Cheerful': 'happy, bright, uplifting',
  'Sentimental': 'nostalgic, emotional, tender',
  'Friendly': 'approachable, warm, sociable',
  'Daring': 'bold, risk-taking, adventurous',
  'Trendy': 'fashionable, current, in-the-moment',
  'Exciting': 'energizing, stimulating, thrilling',
  'Spirited': 'lively, enthusiastic, vivacious',
  'Cool': 'effortlessly stylish, understated, desirable',
  'Young': 'fresh, youthful, playful',
  'Imaginative': 'creative, visionary, inventive',
  'Unique': 'singular, unlike anything else, distinctive',
  'Up-to-Date': 'current, modern, timely',
  'Independent': 'self-reliant, non-conformist, autonomous',
  'Contemporary': 'of-the-moment, relevant, present',
  'Reliable': 'dependable, consistent, trustworthy',
  'Hard Working': 'diligent, industrious, earnest',
  'Secure': 'stable, safe, reassuring',
  'Intelligent': 'smart, thoughtful, cerebral',
  'Technical': 'precise, expert, specialized',
  'Corporate': 'professional, institutional, formal',
  'Successful': 'accomplished, proven, winning',
  'Leader': 'authoritative, dominant, influential',
  'Confident': 'assured, self-possessed, decisive',
  'Upper Class': 'elite, high-end, exclusive',
  'Glamorous': 'luxurious, polished, dazzling',
  'Good Looking': 'beautiful, attractive, aesthetically refined',
  'Charming': 'magnetic, charismatic, enchanting',
  'Feminine': 'delicate, graceful, soft',
  'Smooth': 'sleek, fluid, refined',
  'Outdoorsy': 'nature-connected, rugged landscapes, open-air',
  'Masculine': 'strong, bold, traditionally virile',
  'Western': 'frontier, cowboy, American heartland',
  'Tough': 'hard, resilient, no-nonsense',
  'Rugged': 'rough-hewn, weathered, durable',
}

function buildTraitDefinitions(): string {
  const lines: string[] = []
  for (const dimension of DIMENSIONS) {
    lines.push(`\n${dimension.toUpperCase()}`)
    const facets = BRAND_PERSONALITY[dimension]
    for (const [facet, traits] of Object.entries(facets)) {
      lines.push(`  ${facet}:`)
      for (const trait of traits as Trait[]) {
        const desc = TRAIT_DESCRIPTIONS[trait] ?? ''
        lines.push(`    - ${trait}${desc ? `: ${desc}` : ''}`)
      }
    }
  }
  return lines.join('\n')
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
      .slice(0, 10)
    lines.push(`User ratings: ${topRatings.map(([t, s]) => `${t}=${s}`).join(', ')}`)
  }
  return lines.join('\n')
}

const SYSTEM_PROMPT = `You are an expert in visual aesthetics and brand personality analysis using Jennifer Aaker's Brand Personality Framework.

Your task is to assess a given input (text description or image) against 42 brand personality traits. For each trait, decide whether it applies (1) or does not apply (0).

Score scale:
- 0: Does not apply
- 1: Applies

Trait definitions (organized by dimension → facet → trait):
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

export { buildArtworkContext }
