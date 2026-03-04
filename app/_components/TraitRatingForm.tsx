'use client'

import { useState, useTransition } from 'react'
import { BRAND_PERSONALITY, DIMENSIONS, type Trait } from '../_lib/brand'
import { saveArtworkRatings } from '../_actions/saveArtworkRatings'

interface TraitRatingFormProps {
  userId: string
  artworkId: string
  initialRatings: Partial<Record<Trait, number>>
}

export default function TraitRatingForm({ userId, artworkId, initialRatings }: TraitRatingFormProps) {
  const [ratings, setRatings] = useState<Partial<Record<Trait, number>>>(initialRatings)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setTrait(trait: Trait, value: number) {
    setSaved(false)
    setRatings(prev => ({ ...prev, [trait]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await saveArtworkRatings(userId, artworkId, ratings)
      if (result.success) {
        setSaved(true)
      } else {
        setError(result.error ?? 'Failed to save ratings')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {DIMENSIONS.map(dimension => {
        const facets = BRAND_PERSONALITY[dimension]
        return (
          <div key={dimension}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 font-mono">
              {dimension}
            </h3>
            <div className="space-y-3">
              {Object.values(facets).flat().map(trait => {
                const score = ratings[trait] ?? 0
                return (
                  <div key={trait} className="flex items-center gap-4">
                    <span className="text-sm font-mono w-36 shrink-0 text-zinc-700">{trait}</span>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={1}
                      value={score}
                      onChange={e => setTrait(trait, Number(e.target.value))}
                      className="flex-1 accent-zinc-800"
                    />
                    <span className="text-sm font-mono w-4 text-right text-zinc-500">{score}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-zinc-800 text-white text-sm font-mono rounded hover:bg-zinc-700 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save Ratings'}
        </button>
        {saved && <span className="text-sm text-green-600 font-mono">Saved.</span>}
        {error && <span className="text-sm text-red-500 font-mono">{error}</span>}
      </div>
    </form>
  )
}
