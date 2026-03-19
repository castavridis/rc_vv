'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { VISION_MODELS } from '../_lib/visionModels'
import { ASSESSMENT_PERSONAS } from '../_lib/assessmentPersonas'
import { assessAndSaveSynthetic } from '../_actions/assessAndSaveSynthetic'
import { getExistingSyntheticCombos } from '../_actions/getExistingSyntheticCombos'
import { getRecentModelFailures } from '../_actions/getRecentModelFailures'

interface BulkAssessControlProps {
  artworkIds: string[]
}

export default function BulkAssessControl({ artworkIds }: BulkAssessControlProps) {
  const router = useRouter()
  const [selectedModels, setSelectedModels] = useState<Set<string>>(
    () => new Set([VISION_MODELS[0].id])
  )
  const [selectedPersonas, setSelectedPersonas] = useState<Set<string>>(
    () => new Set(['none'])
  )
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [failedModels, setFailedModels] = useState<Set<string>>(new Set())
  const [skippedCombos, setSkippedCombos] = useState<Set<string>>(new Set())
  const [checkingExisting, setCheckingExisting] = useState(false)
  const [currentCombo, setCurrentCombo] = useState('')
  const [recentFailures, setRecentFailures] = useState<Record<string, number>>({})
  const cancelRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchExistingCombos = useCallback(async () => {
    if (artworkIds.length === 0 || selectedModels.size === 0 || selectedPersonas.size === 0) {
      setSkippedCombos(new Set())
      return
    }
    setCheckingExisting(true)
    const result = await getExistingSyntheticCombos(
      artworkIds,
      Array.from(selectedModels),
      Array.from(selectedPersonas)
    )
    if (result.success) {
      setSkippedCombos(new Set(result.combos))
    }
    setCheckingExisting(false)
  }, [artworkIds, selectedModels, selectedPersonas])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchExistingCombos, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [fetchExistingCombos])

  useEffect(() => {
    getRecentModelFailures().then(r => { if (r.success) setRecentFailures(r.counts) })
  }, [])

  function toggleModel(id: string) {
    setSelectedModels(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function togglePersona(id: string) {
    setSelectedPersonas(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const crossProduct = (() => {
    const combos: { artworkId: string; model: string; persona: string }[] = []
    for (const model of selectedModels) {
      for (const persona of selectedPersonas) {
        for (const artworkId of artworkIds) {
          combos.push({ artworkId, model, persona })
        }
      }
    }
    return combos
  })()

  const toRunCombos = crossProduct.filter(
    ({ artworkId, model, persona }) =>
      !skippedCombos.has(`${artworkId}::${model}::${persona}`)
  )

  async function handleRateAll() {
    if (toRunCombos.length === 0) return
    setRunning(true)
    setProgress(0)
    setTotal(toRunCombos.length)
    setErrors([])
    setFailedModels(new Set())
    setCurrentCombo('')
    cancelRef.current = false

    const errs: string[] = []
    const localFailedModels = new Set<string>()
    for (let i = 0; i < toRunCombos.length; i += 3) {
      if (cancelRef.current) break
      const batch = toRunCombos.slice(i, i + 3).filter(({ model }) => !localFailedModels.has(model))
      if (batch.length === 0) {
        setProgress(p => p + Math.min(3, toRunCombos.length - i))
        continue
      }
      await Promise.all(batch.map(async ({ artworkId, model, persona }) => {
        const modelLabel = VISION_MODELS.find(m => m.id === model)?.label ?? model
        const personaLabel = ASSESSMENT_PERSONAS.find(p => p.id === persona)?.label ?? persona
        setCurrentCombo(`${modelLabel} · ${personaLabel}`)
        const result = await assessAndSaveSynthetic(artworkId, model, persona)
        setProgress(p => p + 1)
        if (!result.success) {
          errs.push(`${result.artworkId.slice(0, 8)}... [${modelLabel}/${personaLabel}]: ${result.error}`)
          localFailedModels.add(model)
          setFailedModels(new Set(localFailedModels))
        }
      }))
    }

    setErrors(errs)
    setRunning(false)
    setCurrentCombo('')
    router.refresh()
  }

  function handleCancel() {
    cancelRef.current = true
  }

  const totalCombos = crossProduct.length
  const alreadyRated = skippedCombos.size
  const toRun = toRunCombos.length

  return (
    <div className="mt-6 pt-6 border-t border-zinc-100">
      <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
        AI Bulk Rate
      </h3>

      <div className="space-y-3">
        {/* Models */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Models</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedModels(new Set(VISION_MODELS.map(m => m.id)))}
                disabled={running}
                className="text-[10px] font-mono text-zinc-400 hover:text-zinc-700 disabled:opacity-50"
              >
                all
              </button>
              <button
                onClick={() => setSelectedModels(new Set())}
                disabled={running}
                className="text-[10px] font-mono text-zinc-400 hover:text-zinc-700 disabled:opacity-50"
              >
                clear
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {VISION_MODELS.map(m => (
              <label
                key={m.id}
                className={`flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded border cursor-pointer select-none ${
                  selectedModels.has(m.id)
                    ? 'border-zinc-400 bg-zinc-100 text-zinc-800'
                    : 'border-zinc-200 bg-white text-zinc-400'
                } ${running ? 'pointer-events-none opacity-50' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedModels.has(m.id)}
                  onChange={() => toggleModel(m.id)}
                  disabled={running}
                  className="sr-only"
                />
                {m.label}
                {(recentFailures[m.id] ?? 0) > 0 && (
                  <span className="ml-auto text-[9px] text-amber-500">{recentFailures[m.id]} err</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Personas */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Personas</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPersonas(new Set(ASSESSMENT_PERSONAS.map(p => p.id)))}
                disabled={running}
                className="text-[10px] font-mono text-zinc-400 hover:text-zinc-700 disabled:opacity-50"
              >
                all
              </button>
              <button
                onClick={() => setSelectedPersonas(new Set())}
                disabled={running}
                className="text-[10px] font-mono text-zinc-400 hover:text-zinc-700 disabled:opacity-50"
              >
                clear
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {ASSESSMENT_PERSONAS.map(p => (
              <label
                key={p.id}
                className={`flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded border cursor-pointer select-none ${
                  selectedPersonas.has(p.id)
                    ? 'border-zinc-400 bg-zinc-100 text-zinc-800'
                    : 'border-zinc-200 bg-white text-zinc-400'
                } ${running ? 'pointer-events-none opacity-50' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedPersonas.has(p.id)}
                  onChange={() => togglePersona(p.id)}
                  disabled={running}
                  className="sr-only"
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        {/* Combo preview */}
        {!running && (
          <p className="text-[10px] font-mono text-zinc-400">
            {artworkIds.length} artworks × {selectedModels.size} models × {selectedPersonas.size} personas
            {' = '}{totalCombos} total
            {checkingExisting ? (
              <span> — checking...</span>
            ) : alreadyRated > 0 ? (
              <span> — {alreadyRated} already rated = <span className="text-zinc-600">{toRun} to run</span></span>
            ) : null}
          </p>
        )}

        {running ? (
          <div className="space-y-2">
            <p className="text-[11px] font-mono text-zinc-500">
              Rating {progress}/{total}{currentCombo ? ` — ${currentCombo}` : ''}
            </p>
            <div className="w-full bg-zinc-100 rounded-full h-1.5">
              <div
                className="bg-zinc-600 h-1.5 rounded-full transition-all"
                style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
              />
            </div>
            <button
              onClick={handleCancel}
              className="w-full text-[11px] font-mono text-red-500 border border-red-200 rounded px-2 py-1.5 hover:bg-red-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleRateAll}
            disabled={toRun === 0 || selectedModels.size === 0 || selectedPersonas.size === 0}
            className="w-full text-[11px] font-mono bg-zinc-800 text-white rounded px-2 py-1.5 hover:bg-zinc-700 disabled:opacity-50"
          >
            Rate {toRun} combo{toRun !== 1 ? 's' : ''} with AI
          </button>
        )}

        {(errors.length > 0 || failedModels.size > 0) && (
          <div className="text-[10px] font-mono text-red-500 space-y-0.5 mt-2">
            {failedModels.size > 0 && (
              <p className="text-zinc-500">
                Skipped all combos for: {Array.from(failedModels).map(id => VISION_MODELS.find(m => m.id === id)?.label ?? id).join(', ')}
              </p>
            )}
            {errors.length > 0 && (
              <>
                <p className="font-semibold">{errors.length} error{errors.length !== 1 ? 's' : ''}:</p>
                {errors.map((e, i) => (
                  <p key={i} className="truncate">{e}</p>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
