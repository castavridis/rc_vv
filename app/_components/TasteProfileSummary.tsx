import { BRAND_PERSONALITY, DIMENSIONS, type Dimension, type Trait } from '../_lib/brand'
import { topTraits, type TraitScoreMap } from '../_lib/taste-profile'

interface TasteProfileSummaryProps {
  profile: TraitScoreMap
  totalRated: number
}

export default function TasteProfileSummary({ profile, totalRated }: TasteProfileSummaryProps) {
  if (totalRated === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Rate artworks to build your taste profile.
      </p>
    )
  }

  return (
    <div>
      <p className="text-xs text-zinc-500 mb-3 font-mono">{totalRated} artwork{totalRated !== 1 ? 's' : ''} rated</p>

      <div className="space-y-4">
        {DIMENSIONS.map(dimension => {
          const traits = Object.values(BRAND_PERSONALITY[dimension]).flat() as Trait[]
          const traitScores = traits
            .filter(t => profile[t] !== undefined)
            .map(t => ({ trait: t, score: profile[t]! }))
          const appliesCount = traitScores.filter(t => t.score >= 0.5).length

          return (
            <div key={dimension}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono font-semibold text-zinc-700">{dimension}</span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {appliesCount}/{traits.length} traits
                </span>
              </div>
              <div className="space-y-0.5 ml-2">
                {traitScores.map(({ trait, score }) => {
                  const applies = score >= 0.5
                  return (
                    <div key={trait} className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono ${applies ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        {applies ? '●' : '○'}
                      </span>
                      <span className={`text-xs font-mono ${applies ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        {trait}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-300 ml-auto">
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
