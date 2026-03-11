'use client'

import { useState, useTransition } from 'react'
import { BRAND_PERSONALITY, DIMENSIONS, type Dimension, type Trait } from '../_lib/brand'
import { saveArtworkRatings } from '../_actions/saveArtworkRatings'

interface TraitRatingFormProps {
  userId: string
  artworkId: string
  initialRatings: Record<string, { score: number; reason: string }>
}

export default function TraitRatingForm({ userId, artworkId, initialRatings }: TraitRatingFormProps) {
  const [traitRatings, setTraitRatings] = useState<Record<string, { score: number; reason: string }>>(
    () => Object.fromEntries(
      Object.entries(initialRatings).filter(([key]) => !DIMENSIONS.includes(key as Dimension))
    )
  )
  const [dimRatings, setDimRatings] = useState<Record<string, { score: number; reason: string }>>(
    () => Object.fromEntries(
      DIMENSIONS.map(d => [d, initialRatings[d] ?? { score: 0, reason: '' }])
    )
  )
  const [expanded, setExpanded] = useState<Set<Dimension>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleTrait(trait: Trait) {
    setSaved(false)
    setTraitRatings(prev => ({
      ...prev,
      [trait]: { ...prev[trait], score: (prev[trait]?.score ?? 0) >= 0.5 ? 0 : 1 },
    }))
  }

  function setTraitReason(trait: Trait, reason: string) {
    setSaved(false)
    setTraitRatings(prev => ({ ...prev, [trait]: { score: prev[trait]?.score ?? 0, reason } }))
  }

  function setDimensionScore(dimension: Dimension, value: number) {
    setSaved(false)
    setDimRatings(prev => ({ ...prev, [dimension]: { ...prev[dimension], score: value } }))
  }

  function setDimensionReason(dimension: Dimension, reason: string) {
    setSaved(false)
    setDimRatings(prev => ({ ...prev, [dimension]: { ...prev[dimension], reason } }))
  }

  function toggleExpanded(dimension: Dimension) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(dimension)) next.delete(dimension)
      else next.add(dimension)
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const allRatings: Record<string, { score: number; reason: string }> = { ...traitRatings, ...dimRatings }
      const result = await saveArtworkRatings(userId, artworkId, allRatings)
      if (result.success) {
        setSaved(true)
      } else {
        setError(result.error ?? 'Failed to save ratings')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {DIMENSIONS.map(dimension => {
        const dimScore = dimRatings[dimension]?.score ?? 0
        const isOpen = expanded.has(dimension)
        const traits = Object.values(BRAND_PERSONALITY[dimension]).flat() as Trait[]

        return (
          <div key={dimension} className="border border-zinc-200 rounded overflow-hidden">
            {/* Dimension row — keep slider 0-5 */}
            <div className="px-3 py-2 bg-zinc-50">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleExpanded(dimension)}
                  className="text-xs font-mono text-zinc-400 w-4 shrink-0 text-left"
                >
                  {isOpen ? '▾' : '▸'}
                </button>
                <span
                  className="text-sm font-semibold font-mono text-zinc-700 w-32 shrink-0 cursor-pointer"
                  onClick={() => toggleExpanded(dimension)}
                >
                  {dimension}
                </span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={1}
                  value={dimScore}
                  onChange={e => setDimensionScore(dimension, Number(e.target.value))}
                  className="flex-1 accent-zinc-800"
                />
                <span className="text-sm font-mono w-6 text-right text-zinc-500">
                  {dimScore}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="w-4 shrink-0" />
                <span className="w-32 shrink-0" />
                <input
                  type="text"
                  placeholder="Reason…"
                  value={dimRatings[dimension]?.reason ?? ''}
                  onChange={e => setDimensionReason(dimension, e.target.value)}
                  className="flex-1 text-xs font-mono px-2 py-1 border border-zinc-200 rounded text-zinc-600"
                />
                <span className="w-6 shrink-0" />
              </div>
            </div>

            {/* Trait rows (collapsible) — binary toggles */}
            {isOpen && (
              <div className="px-3 py-2 border-t border-zinc-100">
                {traits.map(trait => {
                  const applies = (traitRatings[trait]?.score ?? 0) >= 0.5
                  return (
                    <div key={trait} className="pl-5 py-1 border-b border-zinc-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono w-28 shrink-0 text-zinc-500">{trait}</span>
                        <button
                          type="button"
                          onClick={() => toggleTrait(trait)}
                          className={`w-10 h-5 rounded-full transition-colors relative ${
                            applies ? 'bg-zinc-800' : 'bg-zinc-200'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                              applies ? 'left-5' : 'left-0.5'
                            }`}
                          />
                        </button>
                        <span className="text-xs font-mono w-4 text-zinc-400">
                          {applies ? '✓' : '–'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="w-28 shrink-0" />
                        <input
                          type="text"
                          placeholder="Reason…"
                          value={traitRatings[trait]?.reason ?? ''}
                          onChange={e => setTraitReason(trait, e.target.value)}
                          className="flex-1 text-xs font-mono px-2 py-1 border border-zinc-200 rounded text-zinc-600"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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
