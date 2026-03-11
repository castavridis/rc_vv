import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from './_lib/auth/session'
import supabase from './_actions/supabase'
import SessionCard from './_components/SessionCard'
import LoginButton from './_components/LoginButton'

export default async function HomePage() {
  const user = await getUser()

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-md text-center">
        <h1 className="text-4xl font-bold font-mono mb-2">vv.</h1>
        <p className="text-sm text-zinc-500 mb-8">
          Brand personality exploration for Recursers.
        </p>
        <LoginButton />
      </div>
    )
  }

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, title, auto_title, created_at, compositions(thumbnail_url, created_at)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold font-mono">vv.</h1>
          <p className="text-sm text-zinc-500 font-mono">Hi, {user.name.split(' ')[0]}.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/libraries"
            className="px-4 py-2 text-sm font-mono text-zinc-600 border border-zinc-200 rounded hover:border-zinc-400"
          >
            Libraries
          </Link>
          <Link
            href="/session/new"
            className="px-4 py-2 bg-zinc-800 text-white text-sm font-mono rounded hover:bg-zinc-700"
          >
            + New Session
          </Link>
        </div>
      </div>

      {!sessions || sessions.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-sm text-zinc-400 font-mono mb-6">No sessions yet.</p>
          <Link
            href="/session/new"
            className="px-5 py-2.5 bg-zinc-800 text-white text-sm font-mono rounded hover:bg-zinc-700"
          >
            Start your first session →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {sessions.map(session => {
            const comps = Array.isArray(session.compositions) ? session.compositions : []
            const latest = comps.sort((a: { created_at: string }, b: { created_at: string }) =>
              b.created_at.localeCompare(a.created_at))[0]
            return (
              <SessionCard
                key={session.id}
                id={session.id}
                title={session.title}
                autoTitle={session.auto_title}
                createdAt={session.created_at}
                thumbnailUrl={latest?.thumbnail_url ?? null}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
