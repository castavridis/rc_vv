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
          const traits = Object.values(BRAND_PERSONALITY[dimension]).flat() as Trait[]
          return (
            <div key={dimension}>
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
                {dimension}
              </h3>
              <div className="space-y-1.5">
                {traits.map(trait => {
                  const score = scoreMap[trait] ?? 0
                  const applies = score >= 0.5
                  return (
                    <div key={trait} className="flex items-center gap-3">
                      <span className={`text-xs font-mono w-32 shrink-0 ${applies ? 'text-zinc-800 font-semibold' : 'text-zinc-400'}`}>
                        {trait}
                      </span>
                      <span className={`text-xs font-mono ${applies ? 'text-zinc-800' : 'text-zinc-300'}`}>
                        {applies ? '●' : '○'}
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
