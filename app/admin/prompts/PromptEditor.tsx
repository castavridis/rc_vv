'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PromptConfigRow } from '../../_actions/getPromptConfigs'
import { savePromptConfig } from '../../_actions/savePromptConfig'
import { resetPromptConfig } from '../../_actions/resetPromptConfig'

interface Props {
  model: string
  persona: { id: string; label: string; prompt: string }
  activeConfig: PromptConfigRow | null
  history: PromptConfigRow[]
  defaultPrompt: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

export default function PromptEditor({ model, persona, activeConfig, history, defaultPrompt }: Props) {
  const router = useRouter()
  const [text, setText] = useState(activeConfig?.promptText ?? '')
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const isChanged = text !== (activeConfig?.promptText ?? '')

  async function handleSave() {
    if (!text.trim() || !isChanged) return
    setSaving(true)
    setStatusMsg(null)
    const result = await savePromptConfig(model, persona.id, text)
    setSaving(false)
    if (result.success) {
      setStatusMsg('Saved')
      router.refresh()
    } else {
      setStatusMsg(result.error ?? 'Save failed')
    }
  }

  async function handleReset() {
    setResetting(true)
    setStatusMsg(null)
    const result = await resetPromptConfig(model, persona.id)
    setResetting(false)
    if (result.success) {
      setText('')
      setStatusMsg('Reset to default')
      router.refresh()
    } else {
      setStatusMsg(result.error ?? 'Reset failed')
    }
  }

  return (
    <div className="border border-zinc-200 rounded p-3 space-y-2 text-xs font-mono">
      <div className="flex items-center justify-between">
        <span className="text-zinc-600">{persona.label}</span>
        {activeConfig && (
          <span className="text-[10px] text-amber-500 border border-amber-200 rounded px-1.5 py-0.5">Custom</span>
        )}
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={defaultPrompt || '(no default prompt)'}
        rows={3}
        className="w-full text-[11px] font-mono border border-zinc-200 rounded p-2 resize-y focus:outline-none focus:border-zinc-400 placeholder:text-zinc-300"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !isChanged || !text.trim()}
          className="text-[10px] border border-zinc-300 rounded px-2 py-1 hover:bg-zinc-50 disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {activeConfig && (
          <button
            onClick={handleReset}
            disabled={resetting}
            className="text-[10px] border border-red-200 text-red-500 rounded px-2 py-1 hover:bg-red-50 disabled:opacity-40"
          >
            {resetting ? 'Resetting…' : 'Reset to default'}
          </button>
        )}
        {statusMsg && <span className="text-[10px] text-zinc-400">{statusMsg}</span>}
      </div>

      {history.length > 0 && (
        <details>
          <summary className="text-[10px] text-zinc-400 cursor-pointer hover:text-zinc-600">
            History ({history.length})
          </summary>
          <div className="mt-1 space-y-1">
            {history.slice(0, 10).map(h => (
              <div key={h.id} className="text-[10px] text-zinc-400 border-l-2 border-zinc-100 pl-2">
                <span className="text-zinc-300">{formatDate(h.createdAt)}</span>
                <p className="text-zinc-500 truncate">{h.promptText}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
