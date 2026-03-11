import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '../../_lib/auth/session'
import supabase from '../../_actions/supabase'

function corsHeaders(request: NextRequest) {
  return {
    'Access-Control-Allow-Origin': request.headers.get('origin') ?? '*',
    'Access-Control-Allow-Credentials': 'true',
  }
}

/** GET /api/library-counts?lib=<id>
 *  Returns { Sincerity: 3, Excitement: 1, ... } — count of artworks rated 4/5 per dimension */
export async function GET(request: NextRequest) {
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

  const libId = request.nextUrl.searchParams.get('lib')

  // Get artwork IDs in this library (or all if no lib specified)
  let artworkQuery = supabase
    .from('artworks')
    .select('id')
    .eq('user_id', user.id)

  if (libId) {
    artworkQuery = artworkQuery.eq('library_id', libId)
  }

  const { data: artworks } = await artworkQuery
  const artworkIds = (artworks ?? []).map(a => a.id)

  if (artworkIds.length === 0) {
    return NextResponse.json(
      { Sincerity: 0, Excitement: 0, Competence: 0, Sophistication: 0, Ruggedness: 0 },
      { headers: corsHeaders(request) }
    )
  }

  // Get dimension ratings >= 4 for those artworks
  const dims = ['Sincerity', 'Excitement', 'Competence', 'Sophistication', 'Ruggedness']
  const { data: ratings } = await supabase
    .from('artwork_ratings')
    .select('trait, artwork_id')
    .eq('user_id', Number(user.id))
    .in('trait', dims)
    .gte('score', 4)
    .in('artwork_id', artworkIds)

  const counts: Record<string, number> = {}
  for (const d of dims) {
    const uniqueArtworks = new Set(
      (ratings ?? []).filter(r => r.trait === d).map(r => r.artwork_id)
    )
    counts[d] = uniqueArtworks.size
  }

  return NextResponse.json(counts, { headers: corsHeaders(request) })
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('origin') ?? '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}
