import { topTraits, type TraitScoreMap } from '../_lib/taste-profile'

interface TasteProfileSummaryProps {
  profile: TraitScoreMap
  totalRated: number
}

export default function TasteProfileSummary({ profile, totalRated }: TasteProfileSummaryProps) {
  const top = topTraits(profile, 8)

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
      <div className="space-y-2">
        {top.map(({ trait, score }) => (
          <div key={trait} className="flex items-center gap-3">
            <span className="text-xs font-mono w-32 shrink-0 text-zinc-600">{trait}</span>
            <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-800 rounded-full"
                style={{ width: `${(score / 5) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono text-zinc-400 w-6 text-right">
              {score.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
