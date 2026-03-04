import { redirect } from 'next/navigation'
import { getUser } from '../_lib/auth/session'
import supabase from '../_actions/supabase'
import { getRatedArtworkIds, getAllUserRatings } from '../_actions/saveArtworkRatings'
import { aggregateRatings, topTraits } from '../_lib/taste-profile'
import ArtworkCard from '../_components/ArtworkCard'
import TasteProfileSummary from '../_components/TasteProfileSummary'
import Link from 'next/link'

export default async function LibraryPage() {
  const user = await getUser()
  if (!user) redirect('/')

  const [{ data: artworks }, ratedIds, allRatings] = await Promise.all([
    supabase.from('artworks').select('*').order('created_at', { ascending: false }),
    getRatedArtworkIds(user.id),
    getAllUserRatings(user.id),
  ])

  const profile = aggregateRatings(allRatings)
  const totalRated = ratedIds.size

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold font-mono mb-1">Artwork Library</h1>
          <p className="text-sm text-zinc-500">
            Rate artworks to calibrate your taste profile.
          </p>
        </div>
        <Link
          href="/admin/upload"
          className="text-xs font-mono px-3 py-1.5 border border-zinc-300 rounded hover:bg-zinc-50"
        >
          + Upload Artwork
        </Link>
      </div>

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
              No artworks in the library yet.{' '}
              <Link href="/admin/upload" className="underline">Upload one.</Link>
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
                  rated={ratedIds.has(artwork.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
