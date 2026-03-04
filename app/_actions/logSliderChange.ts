'use server'

import supabase from './supabase'
import { type Dimension } from '../_lib/brand'

export async function logSliderChange(
  sessionId: string,
  userId: string,
  dimension: Dimension,
  value: number
): Promise<void> {
  const [{ error: insertError }, { error: updateError }] = await Promise.all([
    supabase.from('slider_history').insert({ session_id: sessionId, user_id: userId, dimension, value }),
    supabase.from('sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId),
  ])

  if (insertError) console.error('[logSliderChange] insert error:', insertError)
  if (updateError) console.error('[logSliderChange] update error:', updateError)
}
