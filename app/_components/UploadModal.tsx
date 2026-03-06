'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { uploadArtwork } from '../_actions/uploadArtwork'

interface UploadModalProps {
  userId: string
  onClose: () => void
}

export default function UploadModal({ userId, onClose }: UploadModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('user_id', userId)
    startTransition(async () => {
      const result = await uploadArtwork(formData)
      if (result.success) {
        router.push(`/library/${result.artworkId}`)
      } else {
        setError(result.error ?? 'Upload failed')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold font-mono">Save Image</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 text-lg leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-600 mb-1">Image *</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              required
              onChange={handleFileChange}
              className="block w-full text-sm text-zinc-600 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-mono file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
            />
            {preview && (
              <div className="mt-2 aspect-square max-w-32 rounded overflow-hidden bg-zinc-100">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-600 mb-1">Title *</label>
            <input
              type="text"
              name="title"
              required
              className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-zinc-600 mb-1">Artist</label>
              <input
                type="text"
                name="artist"
                className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-600 mb-1">Year</label>
              <input
                type="number"
                name="year"
                min={1}
                max={new Date().getFullYear()}
                className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-600 mb-1">Medium / Category</label>
            <input
              type="text"
              name="medium"
              placeholder="e.g. photography, illustration, painting"
              className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-600 mb-1">Tags</label>
            <input
              type="text"
              name="tags"
              placeholder="comma-separated, e.g. dark, minimal, editorial"
              className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-600 mb-1">Source URL</label>
            <input
              type="url"
              name="source_url"
              placeholder="https://..."
              className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-600 mb-1">Notes</label>
            <textarea
              name="description"
              rows={2}
              className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500 font-mono">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 bg-zinc-800 text-white text-sm font-mono rounded hover:bg-zinc-700 disabled:opacity-50"
            >
              {isPending ? 'Saving…' : 'Save Image'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-zinc-300 text-sm font-mono rounded hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
