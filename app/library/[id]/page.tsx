import { redirect, notFound } from 'next/navigation'
import { getUser } from '../../_lib/auth/session'
import supabase from '../../_actions/supabase'
import { getArtworkRatings } from '../../_actions/saveArtworkRatings'
import TraitRatingForm from '../../_components/TraitRatingForm'
import ArtworkMetadata from '../../_components/ArtworkMetadata'
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
          <div className="rounded overflow-hidden bg-zinc-100">
            <img
              src={artwork.image_url}
              alt={artwork.title}
              className="w-full h-auto block"
            />
          </div>
        </div>

        <div className="space-y-6">
          <ArtworkMetadata
            artworkId={artwork.id}
            userId={user.id}
            title={artwork.title}
            artist={artwork.artist}
            year={artwork.year}
            medium={artwork.medium}
            sourceUrl={artwork.source_url}
            description={artwork.description}
            tags={artwork.tags ?? []}
          />

          <div className="border-t border-zinc-100 pt-6">
            <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Brand Personality
            </h2>
            <p className="text-xs text-zinc-400 mb-4">
              Score each dimension 0–5. Expand to fine-tune individual traits.
            </p>
            <TraitRatingForm
              userId={user.id}
              artworkId={artwork.id}
              initialRatings={existingRatings}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
