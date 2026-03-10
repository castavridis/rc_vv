import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '../../_lib/auth/session'
import supabase from '../../_actions/supabase'

function corsHeaders(request: NextRequest) {
  return {
    'Access-Control-Allow-Origin': request.headers.get('origin') ?? '*',
    'Access-Control-Allow-Credentials': 'true',
  }
}

async function resolveUser(request: NextRequest) {
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
  return user
}

export async function GET(request: NextRequest) {
  const user = await resolveUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders(request) })
  }

  const { data, error } = await supabase
    .from('libraries')
    .select('id, name, created_at')
    .eq('user_id', Number(user.id))
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders(request) })
  }

  return NextResponse.json(data ?? [], { headers: corsHeaders(request) })
}

export async function POST(request: NextRequest) {
  const user = await resolveUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders(request) })
  }

  let body: { name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders(request) })
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400, headers: corsHeaders(request) })
  }

  const { data, error } = await supabase
    .from('libraries')
    .insert({ name: body.name.trim(), user_id: Number(user.id) })
    .select('id, name, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders(request) })
  }

  return NextResponse.json(data, { status: 201, headers: corsHeaders(request) })
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') ?? '*'
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}
