'use client'

import { useState, useEffect, useTransition } from 'react'
import { BRAND_PERSONALITY, DIMENSIONS, type Trait } from '../_lib/brand'
import { type DimensionScores } from '../_lib/dimensionScores'
import { generateSummary } from '../_actions/generateSummary'
import { generateHexColor } from '../_actions/generateHexColor'
import { generateImage } from '../_actions/generateImage'
import { generateSVG } from '../_actions/generateSVG'
import { generateAnimation } from '../_actions/generateAnimation'
import { generatePolinePalette, getAnchorColorsFromProfile } from '../_lib/polinePalette'

type Task = 'summary' | 'hex_color' | 'image' | 'svg' | 'animation'

interface GenerationControlsProps {
  sessionId: string
  dimensionWeights: DimensionScores
  brandSummary?: string
  onAssetGenerated?: () => void
  traitScores?: { trait: string; score: number }[]
}

const TRAIT_TASKS: Task[] = ['image', 'svg', 'animation']
const SESSION_TASKS: Task[] = ['summary', 'hex_color']

const TASK_LABELS: Record<Task, string> = {
  summary: 'Brand Summary',
  hex_color: 'Hex Colors',
  image: 'Image',
  svg: 'SVG',
  animation: 'Animation',
}

export default function GenerationControls({
  sessionId,
  dimensionWeights,
  brandSummary,
  onAssetGenerated,
  traitScores,
}: GenerationControlsProps) {
  const [selectedTask, setSelectedTask] = useState<Task>('image')
  const [selectedTrait, setSelectedTrait] = useState<Trait | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [lastStatus, setLastStatus] = useState<string | null>(null)
  const [palette, setPalette] = useState<string[]>([])

  // Compute Poline palette from trait scores
  useEffect(() => {
    if (traitScores && traitScores.length > 0) {
      const anchors = getAnchorColorsFromProfile(traitScores)
      generatePolinePalette(anchors, 8).then(setPalette)
    }
  }, [traitScores])

  const needsTrait = TRAIT_TASKS.includes(selectedTask)

  function handleGenerate() {
    if (needsTrait && !selectedTrait) return
    setError(null)
    setLastStatus('Generating…')

    startTransition(async () => {
      let result: { success: boolean; error?: string }

      if (selectedTask === 'summary') {
        result = await generateSummary(sessionId, dimensionWeights)
      } else if (selectedTask === 'hex_color') {
        result = await generateHexColor(sessionId, dimensionWeights, brandSummary ?? '')
      } else if (selectedTask === 'image') {
        result = await generateImage(sessionId, selectedTrait!, dimensionWeights, brandSummary, palette.length > 0 ? palette : undefined)
      } else if (selectedTask === 'svg') {
        result = await generateSVG(sessionId, selectedTrait!, dimensionWeights, brandSummary, palette.length > 0 ? palette : undefined)
      } else {
        result = await generateAnimation(sessionId, selectedTrait!, dimensionWeights, brandSummary)
      }

      if (result.success) {
        setLastStatus('Done.')
        onAssetGenerated?.()
      } else {
        setError(result.error ?? 'Generation failed')
        setLastStatus(null)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Task selector */}
      <div>
        <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Task</p>
        <div className="flex flex-wrap gap-2">
          {([...SESSION_TASKS, ...TRAIT_TASKS] as Task[]).map(task => (
            <button
              key={task}
              onClick={() => { setSelectedTask(task); setError(null); setLastStatus(null) }}
              className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                selectedTask === task
                  ? 'bg-zinc-800 text-white border-zinc-800'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
              }`}
            >
              {TASK_LABELS[task]}
            </button>
          ))}
        </div>
      </div>

      {/* Trait selector (for image/svg/animation) */}
      {needsTrait && (
        <div>
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Trait</p>
          <select
            value={selectedTrait ?? ''}
            onChange={e => setSelectedTrait(e.target.value as Trait)}
            className="w-full text-sm font-mono px-2 py-1.5 border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <option value="">Select a trait…</option>
            {DIMENSIONS.map(dim => (
              <optgroup key={dim} label={dim}>
                {(Object.values(BRAND_PERSONALITY[dim]).flat() as Trait[]).map(trait => (
                  <option key={trait} value={trait}>{trait}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      )}

      {/* Palette preview */}
      {palette.length > 0 && (selectedTask === 'image' || selectedTask === 'svg') && (
        <div>
          <p className="text-[10px] font-mono text-zinc-400 mb-1">Palette will be passed to generation</p>
          <div className="flex gap-1">
            {palette.slice(0, 6).map((hex, i) => (
              <div key={i} className="w-4 h-4 rounded" style={{ backgroundColor: hex }} title={hex} />
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-xs font-mono text-red-500">{error}</p>}
      {lastStatus && !error && <p className="text-xs font-mono text-zinc-400">{lastStatus}</p>}

      <button
        onClick={handleGenerate}
        disabled={isPending || (needsTrait && !selectedTrait)}
        className="w-full py-2 bg-zinc-800 text-white text-sm font-mono rounded hover:bg-zinc-700 disabled:opacity-40"
      >
        {isPending ? 'Generating…' : `Generate ${TASK_LABELS[selectedTask]}`}
      </button>
    </div>
  )
}
