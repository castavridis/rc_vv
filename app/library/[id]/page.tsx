import { redirect, notFound } from 'next/navigation'
import { getUser } from '../../_lib/auth/session'
import supabase from '../../_actions/supabase'
import { getArtworkRatings } from '../../_actions/saveArtworkRatings'
import TraitRatingForm from '../../_components/TraitRatingForm'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ArtworkPage({ params }: Props) {
  const { id } = await params
  const user = await getUser()
  if (!user) redirect('/')

  const [{ data: artwork }, existingRatings] = await Promise.all([
    supabase.from('artworks').select('*').eq('id', id).single(),
    getArtworkRatings(user.id, id),
  ])

  if (!artwork) notFound()

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link
        href="/library"
        className="text-xs font-mono text-zinc-400 hover:text-zinc-600 mb-8 inline-block"
      >
        ← Library
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
        <div>
          <div className="aspect-square rounded overflow-hidden bg-zinc-100">
            <img
              src={artwork.image_url}
              alt={artwork.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="mt-3">
            <h1 className="text-lg font-semibold">{artwork.title}</h1>
            {(artwork.artist || artwork.year) && (
              <p className="text-sm text-zinc-500">
                {[artwork.artist, artwork.year].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-6">
            Rate this artwork
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            Score each trait 0–5. 0 = not at all representative, 5 = maximally representative.
            You only need to score traits that feel relevant.
          </p>
          <TraitRatingForm
            userId={user.id}
            artworkId={artwork.id}
            initialRatings={existingRatings}
          />
        </div>
      </div>
    </div>
  )
}
