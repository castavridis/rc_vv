'use server'

import { getUser } from '../_lib/auth/session'
import { callOpenRouter } from '../_lib/openrouter'
import { VISION_MODELS } from '../_lib/visionModels'
import { ASSESSMENT_PERSONAS } from '../_lib/assessmentPersonas'
import { getArtworkContextForUser } from '../_lib/artworkContext'
import { buildReasonedImagePrompt, buildArtworkContext } from '../_lib/assessmentPrompt'
import { parseReasonedResponse } from '../_lib/traitAggregation'
import supabase from './supabase'

export interface AssessArtworkResult {
  success: boolean
  scores?: Record<string, { score: number; reason: string }>
  model?: string
  persona?: string
  error?: string
}

export async function assessArtwork(
  artworkId: string,
  model: string,
  personaId?: string
): Promise<AssessArtworkResult> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Validate model against allowlist
  const validModel = VISION_MODELS.find(m => m.id === model)
  if (!validModel) return { success: false, error: 'Invalid model selected' }

  // Look up persona
  const persona = ASSESSMENT_PERSONAS.find(p => p.id === (personaId ?? 'none'))

  const { data: promptConfig } = await supabase
    .from('prompt_configs')
    .select('prompt_text')
    .eq('user_id', Number(user.id))
    .eq('model', model)
    .eq('persona', personaId ?? 'none')
    .eq('is_active', true)
    .maybeSingle()

  const personaPrompt = promptConfig?.prompt_text ?? (persona?.prompt ?? '')
  const personaLabel = persona?.id !== 'none' ? persona?.label : undefined

  try {
    // Fetch artwork
    const { data: artwork, error: artworkError } = await supabase
      .from('artworks')
      .select('image_url, title, artist')
      .eq('id', artworkId)
      .single()
    if (artworkError || !artwork) return { success: false, error: 'Artwork not found' }
    if (!artwork.image_url) return { success: false, error: 'Artwork has no image' }

    // Build prompt with artwork context
    const contextItems = await getArtworkContextForUser(user.id)
    const artworkContextStr = buildArtworkContext(contextItems)
    const { system, userContent } = buildReasonedImagePrompt(
      artwork.image_url,
      artworkContextStr,
      personaPrompt || undefined
    )

    const content = await callOpenRouter(model, [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ])

    const scores = parseReasonedResponse(content)
    if (!scores) return { success: false, error: 'Failed to parse model response' }

    return {
      success: true,
      scores,
      model: validModel.label,
      persona: personaLabel,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[assessArtwork]', err)
    return { success: false, error: message }
  }
}
