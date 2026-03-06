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

  let body: { image_url?: string; source_url?: string; title?: string; artist?: string; year?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders(request) })
  }

  const { image_url, source_url, title, artist, year } = body
  if (!image_url) {
    return NextResponse.json({ error: 'image_url is required' }, { status: 400, headers: corsHeaders(request) })
  }

  // Fetch the image
  let imageBuffer: Buffer
  let contentType: string
  try {
    const res = await fetch(image_url)
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
    const arrayBuffer = await res.arrayBuffer()
    imageBuffer = Buffer.from(arrayBuffer)
    contentType = res.headers.get('content-type') ?? 'image/jpeg'
  } catch (err) {
    return NextResponse.json({ error: `Could not fetch image: ${String(err)}` }, { status: 422, headers: corsHeaders(request) })
  }

  // Derive extension from content-type
  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/svg+xml': 'svg',
  }
  const ext = extMap[contentType] ?? 'jpg'
  const filename = `${crypto.randomUUID()}.${ext}`

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('artworks')
    .upload(filename, imageBuffer, { contentType })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500, headers: corsHeaders(request) })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('artworks')
    .getPublicUrl(filename)

  // Derive a title from source URL hostname if none provided
  const derivedTitle = title ||
    (source_url ? new URL(source_url).hostname.replace(/^www\./, '') : 'Untitled')

  // Insert artwork record
  const { data, error: dbError } = await supabase
    .from('artworks')
    .insert({
      title: derivedTitle,
      image_url: publicUrl,
      source: 'upload',
      source_url: source_url ?? null,
      user_id: user.id,
      tags: [],
      artist: artist ?? null,
      year: year ? parseInt(year, 10) || null : null,
    })
    .select('id')
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500, headers: corsHeaders(request) })
  }

  const origin = request.nextUrl.origin
  return NextResponse.json({
    artworkId: data.id,
    libraryUrl: `${origin}/library/${data.id}`,
  }, { headers: corsHeaders(request) })
}

// Allow cross-origin requests from the bookmarklet
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
