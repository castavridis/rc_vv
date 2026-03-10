import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '../../_lib/auth/session'
import supabase from '../../_actions/supabase'

function corsHeaders(request: NextRequest) {
  return {
    'Access-Control-Allow-Origin': request.headers.get('origin') ?? '*',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export async function POST(request: NextRequest) {
  let user = await getUser()
  if (!user) {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const sessionJson = Buffer.from(authHeader.slice(7), 'base64').toString('utf8')
        const session = JSON.parse(sessionJson)
        if (session?.user && session.expiresAt > Date.now()) {
          user = session.user
        }
      } catch {}
    }
  }
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders(request) })
  }

  type TraitRating = { score: number; reason: string }
  type DimRating = { score: number; reason: string; traits: Record<string, TraitRating> }
  let body: { artwork_id?: string; ratings?: Record<string, DimRating> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders(request) })
  }

  if (!body.artwork_id) {
    return NextResponse.json({ error: 'artwork_id is required' }, { status: 400, headers: corsHeaders(request) })
  }

  if (!body.ratings || Object.keys(body.ratings).length === 0) {
    return NextResponse.json({ ok: true }, { headers: corsHeaders(request) })
  }

  const userId = Number(user.id)
  const rows: { user_id: number; artwork_id: string; trait: string; score: number; reason: string }[] = []

  for (const [dim, dimRating] of Object.entries(body.ratings)) {
    // dimension-level score row
    rows.push({
      user_id: userId,
      artwork_id: body.artwork_id,
      trait: dim,
      score: Math.max(0, Math.min(5, Number(dimRating.score) || 0)),
      reason: dimRating.reason ?? '',
    })
    // per-trait rows
    for (const [trait, tr] of Object.entries(dimRating.traits)) {
      rows.push({
        user_id: userId,
        artwork_id: body.artwork_id,
        trait,
        score: Math.max(0, Math.min(5, Number(tr.score) || 0)),
        reason: tr.reason ?? '',
      })
    }
  }

  if (rows.length) {
    const { error } = await supabase
      .from('artwork_ratings')
      .upsert(rows, { onConflict: 'user_id,artwork_id,trait' })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders(request) })
    }
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders(request) })
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') ?? '*'
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}
