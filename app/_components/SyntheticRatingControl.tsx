'use client'

import { useState, useTransition } from 'react'
import { VISION_MODELS } from '../_lib/visionModels'
import { ASSESSMENT_PERSONAS } from '../_lib/assessmentPersonas'
import { assessArtwork } from '../_actions/assessArtwork'

interface SyntheticRatingControlProps {
  artworkId: string
  onRatingsGenerated: (scores: Record<string, { score: number; reason: string }>, model: string, persona?: string) => void
}

export default function SyntheticRatingControl({ artworkId, onRatingsGenerated }: SyntheticRatingControlProps) {
  const [selectedModel, setSelectedModel] = useState<string>(VISION_MODELS[0].id)
  const [selectedPersona, setSelectedPersona] = useState<string>(ASSESSMENT_PERSONAS[0].id)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleAutoRate() {
    setError(null)
    startTransition(async () => {
      const result = await assessArtwork(artworkId, selectedModel, selectedPersona)
      if (result.success && result.scores) {
        onRatingsGenerated(result.scores, result.model!, result.persona)
      } else {
        setError(result.error ?? 'Failed to generate ratings')
      }
    })
  }

  return (
    <div className="space-y-2 mb-4 p-3 bg-zinc-50 border border-zinc-200 rounded">
      <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
        Auto-rate
      </div>
      <div className="flex flex-col gap-2">
        <select
          value={selectedModel}
          onChange={e => setSelectedModel(e.target.value)}
          disabled={isPending}
          className="text-xs font-mono px-2 py-1.5 border border-zinc-200 rounded bg-white text-zinc-700"
        >
          {VISION_MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <select
          value={selectedPersona}
          onChange={e => setSelectedPersona(e.target.value)}
          disabled={isPending}
          className="text-xs font-mono px-2 py-1.5 border border-zinc-200 rounded bg-white text-zinc-700"
        >
          {ASSESSMENT_PERSONAS.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAutoRate}
          disabled={isPending}
          className="px-3 py-1.5 bg-zinc-800 text-white text-xs font-mono rounded hover:bg-zinc-700 disabled:opacity-50"
        >
          {isPending ? 'Rating...' : 'Auto-rate'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 font-mono">{error}</p>}
    </div>
  )
}
