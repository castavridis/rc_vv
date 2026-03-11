import { BRAND_PERSONALITY, DIMENSIONS, type Trait } from '../_lib/brand'
import { type TraitScoreMap } from '../_lib/taste-profile'

interface TasteProfileSummaryProps {
  profile: TraitScoreMap
  totalRated: number
  dimensionCounts?: Record<string, number>
}

export default function TasteProfileSummary({ profile, totalRated, dimensionCounts }: TasteProfileSummaryProps) {
  if (totalRated === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Rate artworks to build your taste profile.
      </p>
    )
  }

  return (
    <div>
      <p className="text-xs text-zinc-500 mb-4 font-mono">{totalRated} artwork{totalRated !== 1 ? 's' : ''} rated</p>

      <div className="space-y-5">
        {DIMENSIONS.map(dimension => {
          const facets = BRAND_PERSONALITY[dimension]
          const allTraits = Object.values(facets).flat() as Trait[]
          const allScores = allTraits.filter(t => profile[t] !== undefined)
          const dimApplies = allScores.filter(t => (profile[t]!) >= 0.5).length
          const dimScore = allScores.length > 0
            ? Math.round((dimApplies / allTraits.length) * 5 * 10) / 10
            : 0

          return (
            <div key={dimension}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-semibold text-zinc-700">{dimension}</span>
                <span className="text-[10px] font-mono text-zinc-500 font-semibold">{dimScore}/5</span>
                {dimensionCounts && dimensionCounts[dimension] > 0 && (
                  <span className="text-[9px] font-mono text-zinc-400">
                    {dimensionCounts[dimension]} rated 4/5
                  </span>
                )}
              </div>

              <div className="space-y-0 ml-2">
                {allTraits.map(trait => {
                  const score = profile[trait]
                  if (score === undefined) return null
                  const applies = score >= 0.5
                  return (
                    <div key={trait} className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-mono ${applies ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        {applies ? '●' : '○'}
                      </span>
                      <span className={`text-[10px] font-mono ${applies ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        {trait}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-300 ml-auto">
                        {(score * 100).toFixed(0)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
