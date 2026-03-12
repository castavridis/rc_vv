'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { VISION_MODELS } from '../_lib/visionModels'
import { ASSESSMENT_PERSONAS } from '../_lib/assessmentPersonas'
import { assessAndSaveSynthetic } from '../_actions/assessAndSaveSynthetic'

interface BulkAssessControlProps {
  artworkIds: string[]
}

export default function BulkAssessControl({ artworkIds }: BulkAssessControlProps) {
  const router = useRouter()
  const [model, setModel] = useState<string>(VISION_MODELS[0].id)
  const [persona, setPersona] = useState<string>(ASSESSMENT_PERSONAS[0].id)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const cancelRef = useRef(false)

  async function handleRateAll() {
    if (artworkIds.length === 0) return
    setRunning(true)
    setProgress(0)
    setTotal(artworkIds.length)
    setErrors([])
    cancelRef.current = false

    const errs: string[] = []
    for (let i = 0; i < artworkIds.length; i++) {
      if (cancelRef.current) break
      const result = await assessAndSaveSynthetic(artworkIds[i], model, persona)
      if (!result.success) {
        errs.push(`${result.artworkId.slice(0, 8)}...: ${result.error}`)
      }
      setProgress(i + 1)
    }

    setErrors(errs)
    setRunning(false)
    router.refresh()
  }

  function handleCancel() {
    cancelRef.current = true
  }

  return (
    <div className="mt-6 pt-6 border-t border-zinc-100">
      <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
        AI Bulk Rate
      </h3>

      <div className="space-y-2">
        <select
          value={model}
          onChange={e => setModel(e.target.value)}
          disabled={running}
          className="w-full text-[11px] font-mono border border-zinc-200 rounded px-2 py-1.5 bg-white text-zinc-700"
        >
          {VISION_MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>

        <select
          value={persona}
          onChange={e => setPersona(e.target.value)}
          disabled={running}
          className="w-full text-[11px] font-mono border border-zinc-200 rounded px-2 py-1.5 bg-white text-zinc-700"
        >
          {ASSESSMENT_PERSONAS.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>

        {running ? (
          <div className="space-y-2">
            <p className="text-[11px] font-mono text-zinc-500">
              Rating {progress}/{total}...
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
            disabled={artworkIds.length === 0}
            className="w-full text-[11px] font-mono bg-zinc-800 text-white rounded px-2 py-1.5 hover:bg-zinc-700 disabled:opacity-50"
          >
            Rate All with AI ({artworkIds.length})
          </button>
        )}

        {errors.length > 0 && (
          <div className="text-[10px] font-mono text-red-500 space-y-0.5 mt-2">
            <p className="font-semibold">{errors.length} error{errors.length !== 1 ? 's' : ''}:</p>
            {errors.map((e, i) => (
              <p key={i} className="truncate">{e}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
