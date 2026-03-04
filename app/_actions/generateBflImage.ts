'use server'

import { contentForTraitAndLevel } from '../_lib/bflPrompt'

export interface GenerateResult {
  success: boolean
  dataUri?: string
  error?: string
}

export async function generateBflImage(
  trait: string,
  level: number
): Promise<GenerateResult> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/flux.2-klein-4b',
        messages: [
          {
            role: 'user',
            content: contentForTraitAndLevel(trait, level),
          },
        ],
        modalities: ['image'],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`[BFL] HTTP ${res.status}: ${text}`)
      return { success: false, error: `HTTP ${res.status}: ${text}` }
    }

    const data = await res.json()
    const message = data.choices?.[0]?.message
    if (!message) return { success: false, error: 'No message in response' }

    // Official: message.images[].image_url.url
    if (message.images?.length > 0) {
      const url = message.images[0].image_url?.url
      if (url) return { success: true, dataUri: url }
    }

    // Fallback: string content
    if (typeof message.content === 'string' && message.content.startsWith('data:')) {
      return { success: true, dataUri: message.content }
    }

    // Fallback: array content
    if (Array.isArray(message.content)) {
      for (const part of message.content) {
        const url = part.image_url?.url || part.imageUrl?.url
        if (url) return { success: true, dataUri: url }
      }
    }

    console.error(`[BFL] No image found in response:`, JSON.stringify(message, null, 2))
    return { success: false, error: 'No image in response' }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[BFL] Error for "${trait}" level ${level}:`, err)
    return { success: false, error: message }
  }
}
