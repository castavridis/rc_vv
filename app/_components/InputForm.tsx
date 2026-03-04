'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { assessTextInput, assessImageInput } from '../_actions/assessInput'

type Tab = 'text' | 'image'

export default function InputForm() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('text')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = tab === 'text'
        ? await assessTextInput(formData)
        : await assessImageInput(formData)

      if (result.success && result.sessionId) {
        router.push(`/session/${result.sessionId}`)
      } else {
        setError(result.error ?? 'Assessment failed')
      }
    })
  }

  return (
    <div className="max-w-xl">
      <div className="flex gap-4 mb-6 border-b border-zinc-200">
        {(['text', 'image'] as Tab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setError(null) }}
            className={`pb-2 text-sm font-mono border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-zinc-800 text-zinc-800'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {tab === 'text' ? (
          <div>
            <label className="block text-sm font-mono text-zinc-600 mb-1">
              Describe a visual aesthetic, mood, or reference
            </label>
            <textarea
              name="text"
              required
              rows={5}
              placeholder="e.g. dark editorial photography, brutalist architecture, raw textures…"
              className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-mono text-zinc-600 mb-1">
              Upload an image reference
            </label>
            <input
              type="file"
              name="image"
              accept="image/*"
              required
              onChange={handleFileChange}
              className="block w-full text-sm text-zinc-600 file:mr-4 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-mono file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
            />
            {preview && (
              <div className="mt-3 aspect-video max-w-xs rounded overflow-hidden bg-zinc-100">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-500 font-mono">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 bg-zinc-800 text-white text-sm font-mono rounded hover:bg-zinc-700 disabled:opacity-50"
        >
          {isPending ? 'Assessing…' : 'Assess →'}
        </button>
      </form>
    </div>
  )
}
