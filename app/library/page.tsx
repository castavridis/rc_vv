import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '../_lib/auth/session'
import supabase from '../_actions/supabase'
import { getRatedArtworkIds, getAllUserRatings } from '../_actions/saveArtworkRatings'
import { aggregateRatings } from '../_lib/taste-profile'
import ArtworkCard from '../_components/ArtworkCard'
import TasteProfileSummary from '../_components/TasteProfileSummary'
import LibraryHeader from '../_components/LibraryHeader'

interface Props {
  searchParams: Promise<{ lib?: string }>
}

export default async function LibraryPage({ searchParams }: Props) {
  const user = await getUser()
  if (!user) redirect('/')

  const { lib } = await searchParams

  // Build artworks query
  let artworksQuery = supabase
    .from('artworks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (lib) {
    artworksQuery = artworksQuery.eq('library_id', lib)
  }

  const [{ data: artworks }, ratedIds, allRatings, libraryName, { data: libraries }] = await Promise.all([
    artworksQuery,
    getRatedArtworkIds(user.id),
    getAllUserRatings(user.id),
    lib ? supabase.from('libraries').select('name').eq('id', lib).single().then(r => r.data?.name ?? null) : Promise.resolve(null),
    supabase.from('libraries').select('id, name').eq('user_id', user.id).order('name'),
  ])

  const profile = aggregateRatings(allRatings)
  const totalRated = ratedIds.size
  const libraryList = (libraries ?? []).map(l => ({ id: l.id, name: l.name }))

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {lib && (
        <div className="mb-4">
          <Link href="/libraries" className="text-xs font-mono text-zinc-400 hover:text-zinc-600">
            ← All Libraries
          </Link>
          {libraryName && (
            <h1 className="text-lg font-mono font-semibold text-zinc-800 mt-2">{libraryName}</h1>
          )}
        </div>
      )}
      <LibraryHeader userId={user.id} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <aside className="lg:col-span-1">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4">
            Taste Profile
          </h2>
          <TasteProfileSummary profile={profile} totalRated={totalRated} />
        </aside>

        <main className="lg:col-span-3">
          {!artworks || artworks.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No images saved yet. Click <span className="font-semibold">+ Save Image</span> to add your first.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {artworks.map(artwork => (
                <ArtworkCard
                  key={artwork.id}
                  id={artwork.id}
                  title={artwork.title}
                  artist={artwork.artist}
                  year={artwork.year}
                  imageUrl={artwork.image_url}
                  medium={artwork.medium}
                  tags={artwork.tags ?? []}
                  rated={ratedIds.has(artwork.id)}
                  userId={user.id}
                  libraries={libraryList}
                  currentLibraryId={artwork.library_id}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
