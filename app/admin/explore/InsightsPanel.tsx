'use client'

import { useState, useMemo } from 'react'
import { DIMENSIONS, type Dimension } from '../../_lib/brand'
import { aggregateRatings, dimensionScoresFromProfile, type TraitScoreMap } from '../../_lib/taste-profile'
import { type InsightRow } from '../../_actions/getSyntheticInsights'
import { type UserArtwork, type ArtworkRating } from '../../_actions/getUserArtworks'
import TraitTable from './TraitTable'
import PromptComposer from './PromptComposer'
import WorkTable from './WorkTable'
import PromptLab from './PromptLab'

interface InsightsPanelProps {
  rows: InsightRow[]
  models: { id: string; label: string }[]
  personas: { id: string; label: string; prompt: string }[]
  artworks: UserArtwork[]
  artworkContextStr: string
  userRatings: Record<string, ArtworkRating[]>
}

function isDimension(trait: string): boolean {
  return DIMENSIONS.includes(trait as Dimension)
}

export default function InsightsPanel({ rows, models, personas, artworks, artworkContextStr, userRatings }: InsightsPanelProps) {
  const [tab, setTab] = useState<'by-model' | 'by-persona' | 'by-work' | 'prompt-lab'>('by-model')
  // Trait pivot selectors
  const [viewMode, setViewMode] = useState<'by-model' | 'by-persona'>('by-model')
  const [selectedModel, setSelectedModel] = useState(models[0]?.id ?? '')
  const [selectedPersona, setSelectedPersona] = useState(personas[0]?.id ?? '')
  const [selectedTraits, setSelectedTraits] = useState<Set<string>>(new Set())
  // Work view filters (empty = all)
  const [workModels, setWorkModels] = useState<Set<string>>(new Set())
  const [workPersonas, setWorkPersonas] = useState<Set<string>>(new Set())

  function toggleWorkModel(id: string) {
    setWorkModels(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleWorkPersona(id: string) {
    setWorkPersonas(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function toggleTrait(trait: string) {
    setSelectedTraits(prev => {
      const next = new Set(prev)
      if (next.has(trait)) next.delete(trait)
      else next.add(trait)
      return next
    })
  }

  const computed = useMemo(() => {
    // Filter out dimension rows
    const traitRows = rows.filter(r => !isDimension(r.trait))

    // Determine pivot: filter to selected model/persona, columns = the other axis
    let filteredRows: InsightRow[]
    let columns: string[]

    if (viewMode === 'by-model') {
      filteredRows = traitRows.filter(r => r.model === selectedModel)
      const personaIds = Array.from(new Set(filteredRows.map(r => r.persona)))
      columns = personaIds
    } else {
      filteredRows = traitRows.filter(r => r.persona === selectedPersona)
      const modelIds = Array.from(new Set(filteredRows.map(r => r.model)))
      columns = modelIds
    }

    // Per-column: trait scores and dimension scores
    const traitScores: Record<string, TraitScoreMap> = {}
    const dimScores: Record<string, Record<string, number>> = {}
    for (const col of columns) {
      const colRows = viewMode === 'by-model'
        ? filteredRows.filter(r => r.persona === col)
        : filteredRows.filter(r => r.model === col)
      const profile = aggregateRatings(colRows)
      traitScores[col] = profile
      dimScores[col] = dimensionScoresFromProfile(profile)
    }

    // Composite: majority-vote dedup across columns per (artworkId, trait)
    // Group by artworkId+trait → count column votes where score=1; if ≥ half of columns → 1
    const voteMap: Record<string, { count: number; total: number }> = {}
    for (const col of columns) {
      const colRows = viewMode === 'by-model'
        ? filteredRows.filter(r => r.persona === col)
        : filteredRows.filter(r => r.model === col)
      for (const r of colRows) {
        const key = `${r.artworkId}::${r.trait}`
        if (!voteMap[key]) voteMap[key] = { count: 0, total: 0 }
        voteMap[key].total += 1
        if (r.score >= 0.5) voteMap[key].count += 1
      }
    }
    const dedupedRows = Object.entries(voteMap).map(([key, { count, total }]) => {
      const [, trait] = key.split('::')
      return { trait, score: count >= total / 2 ? 1 : 0 }
    })
    const compositeScores = aggregateRatings(dedupedRows)
    const compositeDimScores = dimensionScoresFromProfile(compositeScores)

    // Reasons: trait → column label → deduplicated reason strings
    const reasons: Record<string, Record<string, string[]>> = {}
    for (const col of columns) {
      const colRows = viewMode === 'by-model'
        ? filteredRows.filter(r => r.persona === col)
        : filteredRows.filter(r => r.model === col)
      for (const r of colRows) {
        if (!r.reason?.trim()) continue
        if (!reasons[r.trait]) reasons[r.trait] = {}
        if (!reasons[r.trait][col]) reasons[r.trait][col] = []
        if (!reasons[r.trait][col].includes(r.reason)) {
          reasons[r.trait][col].push(r.reason)
        }
      }
    }

    return { columns, traitScores, compositeScores, compositeDimScores, dimScores, reasons }
  }, [rows, viewMode, selectedModel, selectedPersona])

  const { columns, traitScores, compositeScores, compositeDimScores, dimScores, reasons } = computed

  // Column display labels
  function colLabel(id: string): string {
    if (viewMode === 'by-model') {
      return personas.find(p => p.id === id)?.label ?? id
    } else {
      return models.find(m => m.id === id)?.label ?? id
    }
  }
  const labeledColumns = columns.map(colLabel)

  // Remap traitScores/dimScores/reasons to use labels as keys
  const labeledTraitScores: Record<string, TraitScoreMap> = {}
  const labeledDimScores: Record<string, Record<string, number>> = {}
  const labeledReasons: Record<string, Record<string, string[]>> = {}

  for (let i = 0; i < columns.length; i++) {
    const id = columns[i]
    const label = labeledColumns[i]
    labeledTraitScores[label] = traitScores[id] ?? {}
    labeledDimScores[label] = dimScores[id] ?? {}
  }
  for (const [trait, colMap] of Object.entries(reasons)) {
    labeledReasons[trait] = {}
    for (let i = 0; i < columns.length; i++) {
      const id = columns[i]
      const label = labeledColumns[i]
      if (colMap[id]) labeledReasons[trait][label] = colMap[id]
    }
  }

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-2 mb-5 border-b border-zinc-100 pb-3">
        {([
          { id: 'by-model', label: 'By Model' },
          { id: 'by-persona', label: 'By Persona' },
          { id: 'by-work', label: 'By Work' },
          { id: 'prompt-lab', label: 'Prompt Lab' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); if (t.id === 'by-model' || t.id === 'by-persona') setViewMode(t.id) }}
            className={`text-xs px-3 py-1 border rounded ${tab === t.id ? 'border-zinc-800 text-zinc-800' : 'border-zinc-200 text-zinc-400 hover:text-zinc-600'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'prompt-lab' ? (
        <PromptLab
          artworks={artworks}
          artworkContextStr={artworkContextStr}
          userRatings={userRatings}
          models={models}
          personas={personas}
          rows={rows}
        />
      ) : tab === 'by-work' ? (
        <div>
          {/* Work view: independent model + persona filters */}
          <div className="flex flex-wrap gap-6 mb-5">
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5">Model</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setWorkModels(new Set())}
                  className={`text-[10px] px-2 py-0.5 border rounded ${workModels.size === 0 ? 'border-zinc-700 text-zinc-700' : 'border-zinc-200 text-zinc-400 hover:text-zinc-600'}`}
                >
                  All
                </button>
                {models.map(m => (
                  <button
                    key={m.id}
                    onClick={() => toggleWorkModel(m.id)}
                    className={`text-[10px] px-2 py-0.5 border rounded ${workModels.has(m.id) ? 'border-zinc-700 text-zinc-700' : 'border-zinc-200 text-zinc-400 hover:text-zinc-600'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5">Persona</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setWorkPersonas(new Set())}
                  className={`text-[10px] px-2 py-0.5 border rounded ${workPersonas.size === 0 ? 'border-zinc-700 text-zinc-700' : 'border-zinc-200 text-zinc-400 hover:text-zinc-600'}`}
                >
                  All
                </button>
                {personas.map(p => (
                  <button
                    key={p.id}
                    onClick={() => toggleWorkPersona(p.id)}
                    className={`text-[10px] px-2 py-0.5 border rounded ${workPersonas.has(p.id) ? 'border-zinc-700 text-zinc-700' : 'border-zinc-200 text-zinc-400 hover:text-zinc-600'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <WorkTable
            rows={rows.filter(r => !isDimension(r.trait))}
            selectedModels={workModels}
            selectedPersonas={workPersonas}
            models={models}
            personas={personas}
          />
        </div>
      ) : (
        <div>
          {/* Model or persona selector */}
          <div className="mb-4">
            {viewMode === 'by-model' ? (
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="text-xs border border-zinc-200 rounded px-2 py-1 text-zinc-700"
              >
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            ) : (
              <select
                value={selectedPersona}
                onChange={e => setSelectedPersona(e.target.value)}
                className="text-xs border border-zinc-200 rounded px-2 py-1 text-zinc-700"
              >
                {personas.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            )}
          </div>

          {labeledColumns.length === 0 ? (
            <p className="text-xs text-zinc-400">No data for this selection.</p>
          ) : (
            <TraitTable
              columns={labeledColumns}
              traitScores={labeledTraitScores}
              compositeScores={compositeScores}
              compositeDimScores={compositeDimScores}
              dimScores={labeledDimScores}
              reasons={labeledReasons}
              selectedTraits={selectedTraits}
              onToggleTrait={toggleTrait}
            />
          )}

          <PromptComposer selectedTraits={selectedTraits} reasons={labeledReasons} />
        </div>
      )}
    </div>
  )
}
