import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '../../_lib/auth/session'
import supabase from '../../_actions/supabase'

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { image_url?: string; source_url?: string; title?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { image_url, source_url, title } = body
  if (!image_url) {
    return NextResponse.json({ error: 'image_url is required' }, { status: 400 })
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
    return NextResponse.json({ error: `Could not fetch image: ${String(err)}` }, { status: 422 })
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
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
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
    })
    .select('id')
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  const origin = request.nextUrl.origin
  return NextResponse.json({
    artworkId: data.id,
    libraryUrl: `${origin}/library/${data.id}`,
  })
}

// Allow cross-origin requests from the bookmarklet
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}
