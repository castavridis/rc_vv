'use client'

import { useState, useCallback, useRef } from 'react'
import { DIMENSIONS, type Dimension } from '../_lib/brand'
import { logSliderChange } from '../_actions/logSliderChange'
import { type DimensionScores } from '../_lib/dimensionScores'

interface DimensionSlidersProps {
  sessionId: string
  userId: string
  initialScores: DimensionScores
  onChange?: (scores: DimensionScores) => void
}

export default function DimensionSliders({ sessionId, userId, initialScores, onChange }: DimensionSlidersProps) {
  const [scores, setScores] = useState<DimensionScores>(initialScores)
  const debounceTimers = useRef<Partial<Record<Dimension, ReturnType<typeof setTimeout>>>>({})

  const handleChange = useCallback((dimension: Dimension, value: number) => {
    const next = { ...scores, [dimension]: value }
    setScores(next)
    onChange?.(next)

    // Debounce writes to Supabase
    clearTimeout(debounceTimers.current[dimension])
    debounceTimers.current[dimension] = setTimeout(() => {
      logSliderChange(sessionId, userId, dimension, value)
    }, 600)
  }, [scores, sessionId, userId, onChange])

  return (
    <div className="space-y-4">
      {DIMENSIONS.map(dimension => (
        <div key={dimension}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-mono text-zinc-600">{dimension}</span>
            <span className="text-xs font-mono text-zinc-400">{Math.round(scores[dimension])}</span>
          </div>
          <input
            type="range"
            min={0}
            max={5}
            step={1}
            value={scores[dimension]}
            onChange={e => handleChange(dimension, parseInt(e.target.value, 10))}
            className="w-full accent-zinc-800"
          />
        </div>
      ))}
    </div>
  )
}
