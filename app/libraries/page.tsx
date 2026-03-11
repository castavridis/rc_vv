import { redirect } from 'next/navigation'
import { getUser } from '../_lib/auth/session'
import supabase from '../_actions/supabase'
import Link from 'next/link'
import CreateLibraryForm from '../_components/CreateLibraryForm'

export default async function LibrariesPage() {
  const user = await getUser()
  if (!user) redirect('/')

  const { data: libraries } = await supabase
    .from('libraries')
    .select('id, name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  // Get artwork counts per library
  const { data: counts } = await supabase
    .from('artworks')
    .select('library_id')
    .eq('user_id', user.id)
    .not('library_id', 'is', null)

  const countMap: Record<string, number> = {}
  counts?.forEach(r => {
    if (r.library_id) countMap[r.library_id] = (countMap[r.library_id] || 0) + 1
  })

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-lg font-mono font-semibold text-zinc-800">Libraries</h1>
        <CreateLibraryForm userId={user.id} />
      </div>

      {!libraries || libraries.length === 0 ? (
        <p className="text-sm font-mono text-zinc-500">No libraries yet. Create one above.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {libraries.map(lib => (
            <Link
              key={lib.id}
              href={`/library?lib=${lib.id}`}
              className="border border-zinc-200 rounded p-4 hover:border-zinc-400 transition-colors"
            >
              <p className="font-mono font-semibold text-sm text-zinc-800 truncate">{lib.name}</p>
              <p className="font-mono text-xs text-zinc-400 mt-1">
                {countMap[lib.id] ?? 0} image{(countMap[lib.id] ?? 0) !== 1 ? 's' : ''}
              </p>
              <p className="font-mono text-xs text-zinc-300 mt-1">
                {new Date(lib.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
