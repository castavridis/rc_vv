import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '../_lib/auth/session'
import supabase from '../_actions/supabase'
import { getRatedArtworkIds, getAllUserRatings } from '../_actions/saveArtworkRatings'
import { aggregateRatings } from '../_lib/taste-profile'
import { getSyntheticRaterProfiles } from '../_actions/getSyntheticProfiles'
import { dimensionScoresFromProfile } from '../_lib/taste-profile'
import ArtworkCard from '../_components/ArtworkCard'
import TasteProfileSummary from '../_components/TasteProfileSummary'
import RadarChart from '../_components/RadarChart'
import LibraryHeader from '../_components/LibraryHeader'
import BulkAssessControl from '../_components/BulkAssessControl'
import SyntheticRaterProfiles from '../_components/SyntheticRaterProfiles'

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

  const artworkIds = (artworks ?? []).map((a: { id: string }) => a.id)

  // When filtering by library, only use ratings from artworks in this library
  const artworkIdsInView = new Set(artworkIds)
  const filteredRatings = lib
    ? allRatings.filter(r => artworkIdsInView.has(r.artwork_id))
    : allRatings

  const profile = aggregateRatings(filteredRatings)
  const totalRated = lib
    ? (artworks ?? []).filter(a => ratedIds.has(a.id)).length
    : ratedIds.size
  const libraryList = (libraries ?? []).map(l => ({ id: l.id, name: l.name }))
  const syntheticProfiles = await getSyntheticRaterProfiles(artworkIds)

  // Count artworks rated 4/5 per dimension
  const dimensionNames = ['Sincerity', 'Excitement', 'Competence', 'Sophistication', 'Ruggedness']
  const dimCounts: Record<string, number> = {}
  for (const dim of dimensionNames) {
    const artworksWithHighRating = new Set(
      filteredRatings
        .filter(r => r.trait === dim && r.score >= 4)
        .map(r => r.artwork_id)
    )
    dimCounts[dim] = artworksWithHighRating.size
  }

  // Compute dimension-level scores for radar chart
  const humanDimScores = dimensionScoresFromProfile(profile)
  const OVERLAY_COLORS = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2']
  const radarOverlays = syntheticProfiles.map((rater, i) => ({
    data: dimensionScoresFromProfile(rater.profile),
    strokeColor: OVERLAY_COLORS[i % OVERLAY_COLORS.length],
    fillColor: OVERLAY_COLORS[i % OVERLAY_COLORS.length],
    fillOpacity: 0.05,
    label: `${rater.modelLabel} · ${rater.personaLabel}`,
  }))

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
          {totalRated > 0 && (
            <div className="mb-4">
              <RadarChart
                data={humanDimScores}
                width={260}
                height={260}
                maxValue={5}
                fillColor="#18181b"
                strokeColor="#18181b"
                fillOpacity={0.15}
                strokeWidth={1.5}
                overlays={radarOverlays}
              />
              {radarOverlays.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-zinc-800 inline-block" />
                    <span className="text-[10px] font-mono text-zinc-500">You</span>
                  </div>
                  {radarOverlays.map((o, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 inline-block" style={{ background: o.strokeColor, opacity: 0.8 }} />
                      <span className="text-[10px] font-mono text-zinc-500">{o.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <TasteProfileSummary profile={profile} totalRated={totalRated} dimensionCounts={dimCounts} />
          <BulkAssessControl artworkIds={artworkIds} />
          <SyntheticRaterProfiles profiles={syntheticProfiles} />
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
