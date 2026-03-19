'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { AssessmentErrorRow } from '../../_actions/getAssessmentErrors'
import { assessAndSaveSynthetic } from '../../_actions/assessAndSaveSynthetic'
import { resolveAssessmentError } from '../../_actions/resolveAssessmentError'

interface Props {
  row: AssessmentErrorRow
  modelLabel: string
  personaLabel: string
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function ErrorCard({ row, modelLabel, personaLabel }: Props) {
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [rerunError, setRerunError] = useState<string | null>(null)

  if (state === 'done') return null

  async function handleRerun() {
    setState('running')
    setRerunError(null)
    const result = await assessAndSaveSynthetic(row.artworkId, row.model, row.persona)
    if (!result.success) {
      setState('error')
      setRerunError(result.error ?? 'Unknown error')
      return
    }
    await resolveAssessmentError(row.id)
    setState('done')
  }

  return (
    <div className="border border-zinc-200 rounded p-3 text-xs font-mono space-y-2">
      <div className="flex items-start gap-3">
        {row.artworkImageUrl && (
          <Image
            src={row.artworkImageUrl}
            alt={row.artworkTitle ?? ''}
            width={48}
            height={48}
            className="rounded object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-zinc-800 truncate">{row.artworkTitle ?? row.artworkId.slice(0, 8) + '...'}</p>
          <p className="text-zinc-400">{modelLabel} · {personaLabel}</p>
          <p className="text-red-500 mt-1">{row.error}</p>
          <p className="text-zinc-300 text-[10px]">{relativeTime(row.createdAt)}</p>
        </div>
        <button
          onClick={handleRerun}
          disabled={state === 'running'}
          className="flex-shrink-0 text-[10px] border border-zinc-300 rounded px-2 py-1 hover:bg-zinc-50 disabled:opacity-50"
        >
          {state === 'running' ? 'Running…' : 'Re-run'}
        </button>
      </div>

      {rerunError && (
        <p className="text-red-500 text-[10px]">{rerunError}</p>
      )}

      <details>
        <summary className="text-zinc-400 cursor-pointer text-[10px] hover:text-zinc-600">Raw response</summary>
        <pre className="text-[10px] overflow-auto max-h-48 mt-1 bg-zinc-50 p-2 rounded whitespace-pre-wrap break-all">
          {row.rawResponse}
        </pre>
      </details>
    </div>
  )
}
