import { BRAND_PERSONALITY, DIMENSIONS, type Trait } from '../_lib/brand'

interface TraitRow {
  trait: string
  score: number
  model: string
}

interface AssessmentResultProps {
  traits: TraitRow[]
  contextArtworks?: { title: string; direction: 'same' | 'opposing' }[]
}

export default function AssessmentResult({ traits, contextArtworks }: AssessmentResultProps) {
  const scoreMap = Object.fromEntries(traits.map(r => [r.trait, r.score])) as Record<Trait, number>

  return (
    <div className="space-y-8">
      {contextArtworks && contextArtworks.length > 0 && (
        <div>
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">
            Assessed using
          </p>
          <div className="flex flex-wrap gap-2">
            {contextArtworks.map((a, i) => (
              <span
                key={i}
                className={`text-xs font-mono px-2 py-1 rounded-full ${
                  a.direction === 'same'
                    ? 'bg-zinc-100 text-zinc-600'
                    : 'bg-zinc-800 text-zinc-200'
                }`}
              >
                {a.direction === 'same' ? '↑' : '↓'} {a.title}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {DIMENSIONS.map(dimension => {
          const facets = BRAND_PERSONALITY[dimension]
          const allTraits = Object.values(facets).flat() as Trait[]
          const dimApplies = allTraits.filter(t => (scoreMap[t] ?? 0) >= 0.5).length
          const dimScore = allTraits.length > 0
            ? Math.round((dimApplies / allTraits.length) * 5 * 10) / 10
            : 0

          return (
            <div key={dimension}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  {dimension}
                </h3>
                <span className="text-xs font-mono text-zinc-500 font-semibold">{dimScore}</span>
              </div>

              <div className="space-y-0.5 ml-1">
                {allTraits.map(trait => {
                  const applies = (scoreMap[trait] ?? 0) >= 0.5
                  return (
                    <div key={trait} className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono ${applies ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        {applies ? '●' : '○'}
                      </span>
                      <span className={`text-xs font-mono ${applies ? 'text-zinc-700' : 'text-zinc-400'}`}>
                        {trait}
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
