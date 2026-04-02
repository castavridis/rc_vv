import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '../../_lib/auth/session'
import { getSyntheticInsights } from '../../_actions/getSyntheticInsights'
import { getUserArtworks, getAllArtworkRatings, getArtworkContextStringWithReasons } from '../../_actions/getUserArtworks'
import { VISION_MODELS } from '../../_lib/visionModels'
import { ASSESSMENT_PERSONAS } from '../../_lib/assessmentPersonas'
import InsightsPanel from './InsightsPanel'

export default async function ExplorePage() {
  const user = await getUser()
  if (!user) redirect('/')

  const [{ rows, error }, artworks, artworkContextStr, userRatings] = await Promise.all([
    getSyntheticInsights(),
    getUserArtworks(),
    getArtworkContextStringWithReasons(),
    getAllArtworkRatings(),
  ])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 font-mono">
      <div className="flex items-center justify-between mb-6">
        <Link href="/library" className="text-xs text-zinc-400 hover:text-zinc-600">← Library</Link>
        <div className="flex gap-4">
          <Link href="/admin/errors" className="text-xs text-zinc-400 hover:text-zinc-600">Errors</Link>
          <Link href="/admin/prompts" className="text-xs text-zinc-400 hover:text-zinc-600">Prompts</Link>
        </div>
      </div>

      <h1 className="text-sm font-mono uppercase tracking-wider text-zinc-800 mb-1">Synthetic Rating Explorer</h1>
      <p className="text-xs text-zinc-400 mb-6">{rows.length} trait assessments</p>

      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : (
        <InsightsPanel
          rows={rows}
          models={VISION_MODELS as unknown as { id: string; label: string }[]}
          personas={ASSESSMENT_PERSONAS as unknown as { id: string; label: string; prompt: string }[]}
          artworks={artworks}
          artworkContextStr={artworkContextStr}
          userRatings={userRatings}
        />
      )}
    </div>
  )
}
