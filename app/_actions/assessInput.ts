'use server'

import { redirect } from 'next/navigation'
import supabase from './supabase'
import { getUser } from '../_lib/auth/session'
import { getArtworkContextForUser } from '../_lib/artworkContext'
import { buildTextPrompt, buildImagePrompt, buildArtworkContext } from '../_lib/assessmentPrompt'
import { parseModelResponse, autoTitleFromScores } from '../_lib/traitAggregation'
import { TRAITS } from '../_lib/brand'

const TEXT_MODEL = 'mistralai/mistral-medium-3'
const IMAGE_MODEL = 'anthropic/claude-sonnet-4-6'

export interface AssessResult {
  success: boolean
  sessionId?: string
  error?: string
}

async function callOpenRouter(model: string, messages: unknown[]): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter ${res.status}: ${text}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (typeof content !== 'string') throw new Error('No text content in response')
  return content
}

export async function assessTextInput(formData: FormData): Promise<AssessResult> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const text = formData.get('text') as string
  if (!text?.trim()) return { success: false, error: 'Text input is required' }

  try {
    const contextItems = await getArtworkContextForUser(user.id)
    const artworkContextStr = buildArtworkContext(contextItems)
    const { system, user: userMsg } = buildTextPrompt(text, artworkContextStr)

    const content = await callOpenRouter(TEXT_MODEL, [
      { role: 'system', content: system },
      { role: 'user', content: userMsg },
    ])

    const scores = parseModelResponse(content)
    if (!scores) throw new Error('Failed to parse trait scores from model response')

    const autoTitle = autoTitleFromScores(scores)
    const sessionId = await createSessionWithScores(user.id, scores, TEXT_MODEL, autoTitle, {
      type: 'text',
      raw_text: text,
    })

    return { success: true, sessionId }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[assessTextInput]', err)
    return { success: false, error: message }
  }
}

export async function assessImageInput(formData: FormData): Promise<AssessResult> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const file = formData.get('image') as File | null
  if (!file) return { success: false, error: 'Image is required' }

  try {
    // Upload image to Supabase Storage
    const ext = file.name.split('.').pop() ?? 'jpg'
    const filename = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('inputs')
      .upload(filename, file, { contentType: file.type })
    if (uploadError) throw new Error(uploadError.message)

    const { data: { publicUrl } } = supabase.storage.from('inputs').getPublicUrl(filename)

    const contextItems = await getArtworkContextForUser(user.id)
    const artworkContextStr = buildArtworkContext(contextItems)
    const { system, userContent } = buildImagePrompt(publicUrl, artworkContextStr)

    const content = await callOpenRouter(IMAGE_MODEL, [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ])

    const scores = parseModelResponse(content)
    if (!scores) throw new Error('Failed to parse trait scores from model response')

    const autoTitle = autoTitleFromScores(scores)
    const sessionId = await createSessionWithScores(user.id, scores, IMAGE_MODEL, autoTitle, {
      type: 'image',
      content_url: publicUrl,
    })

    return { success: true, sessionId }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[assessImageInput]', err)
    return { success: false, error: message }
  }
}

async function createSessionWithScores(
  userId: string,
  scores: Record<string, number>,
  model: string,
  autoTitle: string,
  input: { type: 'text'; raw_text: string } | { type: 'image'; content_url: string }
): Promise<string> {
  // Create session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({ user_id: userId, title: autoTitle, auto_title: autoTitle })
    .select('id')
    .single()
  if (sessionError) throw new Error(sessionError.message)

  const sessionId = session.id

  // Store input
  await supabase.from('session_inputs').insert({
    session_id: sessionId,
    ...input,
  })

  // Store trait scores
  const profileRows = TRAITS.map(trait => ({
    session_id: sessionId,
    trait,
    score: scores[trait] ?? 0,
    model,
    source: 'assessed',
  }))
  const { error: profileError } = await supabase.from('trait_profiles').insert(profileRows)
  if (profileError) throw new Error(profileError.message)

  return sessionId
}
