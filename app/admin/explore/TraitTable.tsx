'use client'

import { BRAND_PERSONALITY, DIMENSIONS, type Dimension, type Facet } from '../../_lib/brand'
import { type TraitScoreMap } from '../../_lib/taste-profile'

interface TraitTableProps {
  columns: string[]
  traitScores: Record<string, TraitScoreMap>      // column label → TraitScoreMap
  compositeScores: TraitScoreMap
  compositeDimScores: Record<string, number>
  dimScores: Record<string, Record<string, number>> // column label → dim scores
  reasons: Record<string, Record<string, string[]>> // trait → column label → reasons[]
  selectedTraits: Set<string>
  onToggleTrait: (trait: string) => void
}

function pct(v: number | undefined): string {
  if (v === undefined) return '—'
  return `${Math.round(v * 100)}%`
}

function scoreColor(v: number | undefined): string {
  if (v === undefined) return 'text-zinc-300'
  if (v >= 0.7) return 'text-zinc-800'
  if (v >= 0.4) return 'text-zinc-500'
  return 'text-zinc-300'
}

export default function TraitTable({
  columns,
  traitScores,
  compositeScores,
  compositeDimScores,
  dimScores,
  reasons,
  selectedTraits,
  onToggleTrait,
}: TraitTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="text-xs w-full border-collapse">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="sticky left-0 bg-white w-4 py-1 pr-1" />
            <th className="sticky left-6 bg-white text-left py-1 pr-3 min-w-[150px]">Trait</th>
            <th className="text-right py-1 px-1 w-14">Composite</th>
            {columns.map(col => (
              <th key={col} className="text-right py-1 px-1 w-14 text-zinc-500 font-normal" title={col}>
                {col.length > 10 ? col.slice(0, 9) + '…' : col}
              </th>
            ))}
            <th className="text-left py-1 px-2 min-w-[180px] text-zinc-400 font-normal">Reasons</th>
          </tr>
        </thead>
        <tbody>
          {DIMENSIONS.map((dim: Dimension) => {
            const facets = Object.keys(BRAND_PERSONALITY[dim]) as Facet[]
            return [
              // Dimension header
              <tr key={`dim-${dim}`} className="bg-zinc-50">
                <td className="sticky left-0 bg-zinc-50" />
                <td
                  className="sticky left-6 bg-zinc-50 py-1.5 pr-3 font-medium text-zinc-700"
                  colSpan={1}
                >
                  {dim}
                </td>
                <td className={`text-right py-1.5 px-1 w-14 font-medium ${scoreColor((compositeDimScores[dim] ?? 0) / 5)}`}>
                  {compositeDimScores[dim] !== undefined ? `${compositeDimScores[dim].toFixed(1)}` : '—'}
                </td>
                {columns.map(col => (
                  <td key={col} className={`text-right py-1.5 px-1 w-14 ${scoreColor((dimScores[col]?.[dim] ?? 0) / 5)}`}>
                    {dimScores[col]?.[dim] !== undefined ? dimScores[col][dim].toFixed(1) : '—'}
                  </td>
                ))}
                <td />
              </tr>,
              ...facets.map((facet: Facet) => {
                const traits = BRAND_PERSONALITY[dim][facet] ?? []
                return [
                  // Facet sub-header
                  <tr key={`facet-${facet}`}>
                    <td className="sticky left-0 bg-white" />
                    <td
                      className="sticky left-6 bg-white py-0.5 pr-3 text-[10px] text-zinc-400 uppercase tracking-wider"
                      colSpan={3 + columns.length + 1}
                    >
                      {facet}
                    </td>
                  </tr>,
                  ...traits.map(trait => {
                    const traitReasons = reasons[trait] ?? {}
                    const allReasons: { col: string; reason: string }[] = columns.flatMap(col =>
                      (traitReasons[col] ?? []).map(r => ({ col, reason: r }))
                    )
                    const checked = selectedTraits.has(trait)
                    return (
                      <tr key={trait} className={checked ? 'bg-zinc-50' : 'hover:bg-zinc-50'}>
                        <td className="sticky left-0 bg-inherit py-0.5 pr-1">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggleTrait(trait)}
                            className="w-3 h-3 cursor-pointer"
                          />
                        </td>
                        <td className="sticky left-6 bg-inherit py-0.5 pr-3 text-zinc-700">{trait}</td>
                        <td className={`text-right py-0.5 px-1 ${scoreColor(compositeScores[trait as keyof typeof compositeScores])}`}>
                          {pct(compositeScores[trait as keyof typeof compositeScores])}
                        </td>
                        {columns.map(col => (
                          <td key={col} className={`text-right py-0.5 px-1 ${scoreColor(traitScores[col]?.[trait as keyof TraitScoreMap])}`}>
                            {pct(traitScores[col]?.[trait as keyof TraitScoreMap])}
                          </td>
                        ))}
                        <td className="py-0.5 px-2">
                          {allReasons.length > 0 ? (
                            <details>
                              <summary className="cursor-pointer text-zinc-400 hover:text-zinc-600">
                                {allReasons.length} reason{allReasons.length !== 1 ? 's' : ''}
                              </summary>
                              <ul className="mt-0.5 space-y-0.5">
                                {allReasons.map((r, i) => (
                                  <li key={i} className="text-[9px] text-zinc-500">
                                    <span className="text-zinc-400">{r.col}:</span> {r.reason}
                                  </li>
                                ))}
                              </ul>
                            </details>
                          ) : (
                            <span className="text-zinc-200">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  }),
                ]
              }),
            ]
          })}
        </tbody>
      </table>
    </div>
  )
}
