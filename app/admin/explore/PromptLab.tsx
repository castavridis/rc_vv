'use client'

import { useState, useMemo } from 'react'
import { type UserArtwork, type ArtworkRating } from '../../_actions/getUserArtworks'
import { type InsightRow } from '../../_actions/getSyntheticInsights'
import { buildReasonedImagePrompt } from '../../_lib/assessmentPrompt'
import { DIMENSIONS } from '../../_lib/brand'

interface PromptLabProps {
  artworks: UserArtwork[]
  artworkContextStr: string
  userRatings: Record<string, ArtworkRating[]>
  models: { id: string; label: string }[]
  personas: { id: string; label: string; prompt: string }[]
  rows: InsightRow[]
}

const DIM_SET = new Set<string>(DIMENSIONS)

const MAX_DYADS = 5

function dyadKey(modelId: string, personaId: string) {
  return `${modelId}::${personaId}`
}

function formatDyadRatings(
  ratings: InsightRow[],
  modelLabel: string,
  personaLabel: string
): string {
  if (ratings.length === 0) return ''
  const scored = ratings.filter(r => r.score === 1)
  const notScored = ratings.filter(r => r.score === 0)

  const lines = [`\n[${modelLabel} + ${personaLabel}]`]
  if (scored.length > 0) {
    lines.push('Traits present (score=1):')
    for (const r of scored) {
      lines.push(`  ${r.trait}: ${r.reason || '(no reason)'}`)
    }
  }
  if (notScored.length > 0) {
    lines.push('Traits absent (score=0):')
    for (const r of notScored) {
      lines.push(`  ${r.trait}: ${r.reason || '(no reason)'}`)
    }
  }
  return lines.join('\n')
}

function formatUserRatings(ratings: ArtworkRating[]): string {
  if (ratings.length === 0) return ''

  const dims = ratings.filter(r => DIM_SET.has(r.trait)).sort((a, b) => b.score - a.score)
  const traits = ratings.filter(r => !DIM_SET.has(r.trait))
  const present = traits.filter(r => r.score >= 1).sort((a, b) => b.score - a.score)
  const absent = traits.filter(r => r.score === 0)

  const lines: string[] = []
  if (dims.length > 0) {
    lines.push('Dimension scores (0-5):')
    for (const r of dims) {
      lines.push(`  ${r.trait} = ${r.score}${r.reason ? ` — ${r.reason}` : ''}`)
    }
  }
  if (present.length > 0) {
    lines.push('Traits present:')
    for (const r of present) {
      lines.push(`  ${r.trait} = ${r.score}${r.reason ? ` — ${r.reason}` : ''}`)
    }
  }
  if (absent.length > 0) {
    lines.push('Traits absent:')
    for (const r of absent) {
      lines.push(`  ${r.trait} = 0${r.reason ? ` — ${r.reason}` : ''}`)
    }
  }
  return lines.join('\n')
}

export default function PromptLab({ artworks, artworkContextStr, userRatings, models, personas, rows }: PromptLabProps) {
  const [selectedArtworkId, setSelectedArtworkId] = useState(artworks[0]?.id ?? '')
  const [selectedDyads, setSelectedDyads] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)

  const selectedArtwork = artworks.find(a => a.id === selectedArtworkId)

  function toggleDyad(modelId: string, personaId: string) {
    const key = dyadKey(modelId, personaId)
    setSelectedDyads(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else if (next.size < MAX_DYADS) {
        next.add(key)
      }
      return next
    })
  }

  // Check which dyads have data for the selected artwork
  const dyadsWithData = useMemo(() => {
    const set = new Set<string>()
    for (const r of rows) {
      if (r.artworkId === selectedArtworkId) {
        set.add(dyadKey(r.model, r.persona))
      }
    }
    return set
  }, [rows, selectedArtworkId])

  // Build the single composite prompt
  const prompt = useMemo(() => {
    if (!selectedArtwork || selectedDyads.size === 0) return null

    // Gather example ratings from selected dyads
    const exampleBlocks: string[] = []
    for (const key of selectedDyads) {
      const [modelId, personaId] = key.split('::')
      const model = models.find(m => m.id === modelId)
      const persona = personas.find(p => p.id === personaId)
      const dyadRows = rows.filter(
        r => r.artworkId === selectedArtworkId && r.model === modelId && r.persona === personaId
      )
      if (dyadRows.length > 0) {
        exampleBlocks.push(formatDyadRatings(
          dyadRows,
          model?.label ?? modelId,
          persona?.label ?? personaId
        ))
      }
    }

    // Build base prompt from the assessment system
    const { system, userContent } = buildReasonedImagePrompt(
      selectedArtwork.image_url ?? '',
      artworkContextStr
    )

    // Serialize user content text portions
    const userTextParts = (userContent as { type: string; text?: string; image_url?: { url: string } }[])
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('\n')

    // User's own ratings for this artwork
    const artworkUserRatings = userRatings[selectedArtworkId] ?? []
    const userRatingsSection = artworkUserRatings.length > 0
      ? `\n\nUSER'S OWN RATINGS FOR THIS ARTWORK:\n${formatUserRatings(artworkUserRatings)}`
      : ''

    // Build example context section
    const exampleSection = exampleBlocks.length > 0
      ? `\n\nPRIOR ASSESSMENTS OF THIS IMAGE (from other model/persona combinations — use as calibration examples):\n${exampleBlocks.join('\n')}`
      : '\n\n(No prior ratings available for selected dyads)'

    const imageTag = selectedArtwork.image_url
      ? `<img src="${selectedArtwork.image_url}" />`
      : '[No image URL available]'

    const fullPrompt = [
      '=== SYSTEM PROMPT ===',
      system,
      '',
      '=== USER MESSAGE ===',
      userTextParts,
      userRatingsSection,
      exampleSection,
      '',
      imageTag,
      '',
      'Return only the JSON object with all 42 trait scores and reasons.',
    ].join('\n')

    return fullPrompt
  }, [selectedDyads, selectedArtworkId, selectedArtwork, artworkContextStr, userRatings, models, personas, rows])

  function handleCopy() {
    if (!prompt) return
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      {/* Artwork selector */}
      <div className="flex items-center gap-4 mb-5">
        <select
          value={selectedArtworkId}
          onChange={e => { setSelectedArtworkId(e.target.value); setSelectedDyads(new Set()) }}
          className="text-xs border border-zinc-200 rounded px-2 py-1 text-zinc-700 max-w-xs"
        >
          {artworks.map(a => (
            <option key={a.id} value={a.id}>
              {a.title}{a.artist ? ` — ${a.artist}` : ''}
            </option>
          ))}
        </select>
        {selectedArtwork?.image_url && (
          <img
            src={selectedArtwork.image_url}
            alt={selectedArtwork.title}
            className="w-12 h-12 object-cover rounded border border-zinc-200"
          />
        )}
      </div>

      {/* Dyad grid */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Select example dyads</p>
          <span className="text-[10px] text-zinc-400">{selectedDyads.size}/{MAX_DYADS} selected</span>
        </div>
        <div className="overflow-x-auto">
          <table className="text-[10px]">
            <thead>
              <tr>
                <th className="pr-2 pb-1 text-left text-zinc-400 font-normal" />
                {personas.map(p => (
                  <th key={p.id} className="px-1 pb-1 text-center text-zinc-400 font-normal whitespace-nowrap">
                    {p.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {models.map(m => (
                <tr key={m.id}>
                  <td className="pr-2 py-0.5 text-zinc-500 whitespace-nowrap">{m.label}</td>
                  {personas.map(p => {
                    const key = dyadKey(m.id, p.id)
                    const isSelected = selectedDyads.has(key)
                    const hasData = dyadsWithData.has(key)
                    const atMax = selectedDyads.size >= MAX_DYADS && !isSelected
                    return (
                      <td key={p.id} className="px-1 py-0.5 text-center">
                        <button
                          onClick={() => toggleDyad(m.id, p.id)}
                          disabled={atMax || !hasData}
                          title={!hasData ? 'No ratings for this dyad' : undefined}
                          className={`w-5 h-5 rounded border text-[9px] ${
                            isSelected
                              ? 'border-zinc-700 bg-zinc-800 text-white'
                              : !hasData
                                ? 'border-zinc-100 text-zinc-100 cursor-not-allowed'
                                : atMax
                                  ? 'border-zinc-100 text-zinc-200 cursor-not-allowed'
                                  : 'border-zinc-300 text-zinc-400 hover:border-zinc-400 hover:text-zinc-500'
                          }`}
                        >
                          {isSelected ? '✓' : hasData ? '·' : ''}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Output prompt */}
      {!prompt ? (
        <p className="text-xs text-zinc-400">Select dyads with existing ratings to build a prompt with example assessments.</p>
      ) : (
        <div className="border border-zinc-200 rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Prompt</span>
            <button
              onClick={handleCopy}
              className="text-xs text-zinc-400 hover:text-zinc-600 border border-zinc-200 rounded px-2 py-0.5"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="text-[11px] font-mono text-zinc-600 whitespace-pre-wrap bg-zinc-50 rounded p-3 max-h-[600px] overflow-y-auto">
            {prompt}
          </pre>
        </div>
      )}
    </div>
  )
}
