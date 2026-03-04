'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { uploadArtwork } from '../../_actions/uploadArtwork'
import Link from 'next/link'

export default function UploadPage() {
  const router = useRouter()
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
      const result = await uploadArtwork(formData)
      if (result.success) {
        router.push(`/library/${result.artworkId}`)
      } else {
        setError(result.error ?? 'Upload failed')
      }
    })
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-xl">
      <Link
        href="/library"
        className="text-xs font-mono text-zinc-400 hover:text-zinc-600 mb-8 inline-block"
      >
        ← Library
      </Link>

      <h1 className="text-2xl font-bold font-mono mb-8">Upload Artwork</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-mono text-zinc-600 mb-1">Image *</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            required
            onChange={handleFileChange}
            className="block w-full text-sm text-zinc-600 file:mr-4 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-mono file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
          />
          {preview && (
            <div className="mt-3 aspect-square max-w-48 rounded overflow-hidden bg-zinc-100">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-mono text-zinc-600 mb-1">Title *</label>
          <input
            type="text"
            name="title"
            required
            className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div>
          <label className="block text-sm font-mono text-zinc-600 mb-1">Artist</label>
          <input
            type="text"
            name="artist"
            className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div>
          <label className="block text-sm font-mono text-zinc-600 mb-1">Year</label>
          <input
            type="number"
            name="year"
            min={1}
            max={new Date().getFullYear()}
            className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        {error && <p className="text-sm text-red-500 font-mono">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 bg-zinc-800 text-white text-sm font-mono rounded hover:bg-zinc-700 disabled:opacity-50"
        >
          {isPending ? 'Uploading…' : 'Upload'}
        </button>
      </form>
    </div>
  )
}
