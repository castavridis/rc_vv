import { redirect, notFound } from 'next/navigation'
import { getUser } from '../../_lib/auth/session'
import supabase from '../../_actions/supabase'
import { getArtworkRatings } from '../../_actions/saveArtworkRatings'
import { getSyntheticRaterProfiles } from '../../_actions/getSyntheticProfiles'
import { dimensionScoresFromProfile } from '../../_lib/taste-profile'
import ArtworkRatingSection from '../../_components/ArtworkRatingSection'
import ArtworkMetadata from '../../_components/ArtworkMetadata'
import RadarChart from '../../_components/RadarChart'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ArtworkPage({ params }: Props) {
  const { id } = await params
  const user = await getUser()
  if (!user) redirect('/')

  const [{ data: artwork }, existingRatings, syntheticProfiles] = await Promise.all([
    supabase.from('artworks').select('*').eq('id', id).single(),
    getArtworkRatings(user.id, id),
    getSyntheticRaterProfiles([id]),
  ])

  if (!artwork) notFound()

  // Extract human dimension scores directly from ratings (dimensions are stored at 0-5 scale)
  const DIMS = ['Sincerity', 'Excitement', 'Competence', 'Sophistication', 'Ruggedness']
  const humanDimScores: Record<string, number> = {}
  for (const dim of DIMS) {
    humanDimScores[dim] = existingRatings[dim]?.score ?? 0
  }
  const hasHumanRatings = DIMS.some(d => (existingRatings[d]?.score ?? 0) > 0)

  const OVERLAY_COLORS = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2']
  const radarOverlays = syntheticProfiles.map((rater, i) => ({
    data: dimensionScoresFromProfile(rater.profile),
    strokeColor: OVERLAY_COLORS[i % OVERLAY_COLORS.length],
    fillColor: OVERLAY_COLORS[i % OVERLAY_COLORS.length],
    fillOpacity: 0.05,
    label: `${rater.modelLabel} · ${rater.personaLabel}`,
  }))

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
            context={artwork.context}
            tags={artwork.tags ?? []}
          />

          <div className="border-t border-zinc-100 pt-6">
            <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Brand Personality
            </h2>
            <p className="text-xs text-zinc-400 mb-4">
              Score each dimension 0–5. Expand to fine-tune individual traits.
            </p>
            <ArtworkRatingSection
              userId={user.id}
              artworkId={artwork.id}
              initialRatings={existingRatings}
            />
          </div>

          {(hasHumanRatings || syntheticProfiles.length > 0) && (
            <div className="border-t border-zinc-100 pt-6">
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
                Ratings Comparison
              </h2>
              <RadarChart
                data={hasHumanRatings ? humanDimScores : dimensionScoresFromProfile(syntheticProfiles[0]?.profile ?? {})}
                width={280}
                height={280}
                maxValue={5}
                fillColor={hasHumanRatings ? '#18181b' : (OVERLAY_COLORS[0])}
                strokeColor={hasHumanRatings ? '#18181b' : (OVERLAY_COLORS[0])}
                fillOpacity={0.15}
                strokeWidth={1.5}
                overlays={hasHumanRatings ? radarOverlays : radarOverlays.slice(1)}
              />
              <div className="mt-2 space-y-1">
                {hasHumanRatings && (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-800 inline-block shrink-0" />
                    <span className="text-[10px] font-mono text-zinc-600">You</span>
                  </div>
                )}
                {syntheticProfiles.map((rater, i) => (
                  <div key={`${rater.model}::${rater.persona}`} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: OVERLAY_COLORS[i % OVERLAY_COLORS.length] }} />
                    <span className="text-[10px] font-mono text-zinc-600">
                      {rater.modelLabel} · {rater.personaLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
