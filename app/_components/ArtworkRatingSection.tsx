'use client'

import { useState } from 'react'
import SyntheticRatingControl from './SyntheticRatingControl'
import TraitRatingForm from './TraitRatingForm'

interface ArtworkRatingSectionProps {
  userId: string
  artworkId: string
  initialRatings: Record<string, { score: number; reason: string }>
}

export default function ArtworkRatingSection({ userId, artworkId, initialRatings }: ArtworkRatingSectionProps) {
  const [syntheticScores, setSyntheticScores] = useState<{
    scores: Record<string, { score: number; reason: string }>
    model: string
    persona?: string
  } | null>(null)

  return (
    <>
      <SyntheticRatingControl
        artworkId={artworkId}
        onRatingsGenerated={(scores, model, persona) => {
          setSyntheticScores({ scores, model, persona })
        }}
      />
      <TraitRatingForm
        userId={userId}
        artworkId={artworkId}
        initialRatings={initialRatings}
        syntheticScores={syntheticScores}
      />
    </>
  )
}
