'use client'

import { DIMENSIONS, TRAITS, type Dimension, type Trait } from '../../_lib/brand'
import { aggregateRatings, dimensionScoresFromProfile } from '../../_lib/taste-profile'
import { type InsightRow } from '../../_actions/getSyntheticInsights'

interface WorkTableProps {
  rows: InsightRow[]
  selectedModels: Set<string>      // empty = all
  selectedPersonas: Set<string>    // empty = all
  models: { id: string; label: string }[]
  personas: { id: string; label: string }[]
}

function scoreColor(v: number): string {
  const frac = v / 5
  if (frac >= 0.7) return 'text-zinc-800'
  if (frac >= 0.4) return 'text-zinc-500'
  if (frac > 0) return 'text-zinc-300'
  return 'text-zinc-200'
}

export default function WorkTable({ rows, selectedModels, selectedPersonas }: WorkTableProps) {
  // Filter rows by selected models/personas
  const filtered = rows.filter(r => {
    if (selectedModels.size > 0 && !selectedModels.has(r.model)) return false
    if (selectedPersonas.size > 0 && !selectedPersonas.has(r.persona)) return false
    return true
  })

  // Group by artworkId
  const byArtwork = new Map<string, { title: string; rows: InsightRow[] }>()
  for (const r of filtered) {
    if (!byArtwork.has(r.artworkId)) {
      byArtwork.set(r.artworkId, { title: r.artworkTitle, rows: [] })
    }
    byArtwork.get(r.artworkId)!.rows.push(r)
  }

  // Compute per-artwork aggregates, sorted by total trait count desc
  const artworks = Array.from(byArtwork.entries()).map(([id, { title, rows: aRows }]) => {
    // Only trait rows (no dimension rows — already filtered in parent, but be safe)
    const traitRows = aRows.filter(r => TRAITS.includes(r.trait as Trait))
    const profile = aggregateRatings(traitRows)
    const dimScores = dimensionScoresFromProfile(profile)
    const appliedTraits = (Object.entries(profile) as [Trait, number][])
      .filter(([, s]) => s >= 0.5)
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t)
    // Collect reasons per applied trait
    const reasonMap: Record<string, string[]> = {}
    for (const r of traitRows) {
      if (!r.reason?.trim()) continue
      if (!reasonMap[r.trait]) reasonMap[r.trait] = []
      if (!reasonMap[r.trait].includes(r.reason)) reasonMap[r.trait].push(r.reason)
    }
    return { id, title, dimScores, appliedTraits, reasonMap, count: traitRows.length }
  }).sort((a, b) => b.count - a.count)

  if (artworks.length === 0) {
    return <p className="text-xs text-zinc-400">No artworks match the current filters.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-xs w-full border-collapse">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="sticky left-0 bg-white text-left py-1 pr-4 min-w-[160px]">Artwork</th>
            {DIMENSIONS.map(dim => (
              <th key={dim} className="text-right py-1 px-1.5 w-20 text-zinc-500 font-normal" title={dim}>
                {dim.slice(0, 6)}
              </th>
            ))}
            <th className="text-left py-1 px-2 min-w-[220px] text-zinc-400 font-normal">Traits applied</th>
          </tr>
        </thead>
        <tbody>
          {artworks.map(({ id, title, dimScores, appliedTraits, reasonMap, count }) => (
            <tr key={id} className="border-b border-zinc-100 hover:bg-zinc-50">
              <td className="sticky left-0 bg-inherit py-1.5 pr-4">
                <div className="font-medium text-zinc-700 truncate max-w-[155px]" title={title}>{title}</div>
                <div className="text-[10px] text-zinc-400">{count} scores</div>
              </td>
              {DIMENSIONS.map((dim: Dimension) => (
                <td key={dim} className={`text-right py-1.5 px-1.5 tabular-nums ${scoreColor(dimScores[dim] ?? 0)}`}>
                  {dimScores[dim] ? dimScores[dim].toFixed(1) : '—'}
                </td>
              ))}
              <td className="py-1.5 px-2">
                {appliedTraits.length === 0 ? (
                  <span className="text-zinc-300">—</span>
                ) : (
                  <details>
                    <summary className="cursor-pointer text-zinc-400 hover:text-zinc-600 list-none">
                      <span className="text-zinc-600">{appliedTraits.slice(0, 3).join(', ')}</span>
                      {appliedTraits.length > 3 && (
                        <span className="text-zinc-400"> +{appliedTraits.length - 3} more</span>
                      )}
                    </summary>
                    <ul className="mt-1 space-y-0.5">
                      {appliedTraits.map(trait => (
                        <li key={trait} className="text-[9px] text-zinc-500">
                          <span className="text-zinc-700">{trait}</span>
                          {reasonMap[trait]?.[0] && (
                            <span className="text-zinc-400"> — {reasonMap[trait][0]}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
