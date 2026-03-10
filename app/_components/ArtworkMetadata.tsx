'use client'

import { useState, useTransition } from 'react'
import { updateArtwork, type UpdateArtworkFields } from '../_actions/updateArtwork'

interface ArtworkMetadataProps {
  artworkId: string
  userId: string
  title: string
  artist?: string | null
  year?: number | null
  medium?: string | null
  sourceUrl?: string | null
  description?: string | null
  context?: string | null
  tags?: string[]
}

export default function ArtworkMetadata({
  artworkId,
  userId,
  title,
  artist,
  year,
  medium,
  sourceUrl,
  description,
  context,
  tags = [],
}: ArtworkMetadataProps) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Local state for edit form
  const [fields, setFields] = useState<UpdateArtworkFields & { tags_raw: string }>({
    title,
    artist: artist ?? '',
    year: year ?? undefined,
    medium: medium ?? '',
    source_url: sourceUrl ?? '',
    description: description ?? '',
    context: context ?? '',
    tags,
    tags_raw: tags.join(', '),
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFields(prev => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const parsedTags = fields.tags_raw
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    const update: UpdateArtworkFields = {
      title: fields.title,
      artist: fields.artist || null,
      year: fields.year ? Number(fields.year) : null,
      medium: fields.medium || null,
      source_url: fields.source_url || null,
      description: fields.description || null,
      context: fields.context || null,
      tags: parsedTags,
    }

    startTransition(async () => {
      const result = await updateArtwork(artworkId, userId, update)
      if (result.success) {
        setSaved(true)
        setEditing(false)
        setFields(prev => ({ ...prev, tags: parsedTags }))
      } else {
        setError(result.error ?? 'Failed to save')
      }
    })
  }

  if (!editing) {
    return (
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold">{fields.title}</h1>
            {(fields.artist || fields.year) && (
              <p className="text-sm text-zinc-500">
                {[fields.artist, fields.year].filter(Boolean).join(' · ')}
              </p>
            )}
            {fields.medium && (
              <p className="text-xs text-zinc-400 mt-0.5">{fields.medium}</p>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-mono text-zinc-400 hover:text-zinc-600 shrink-0"
          >
            Edit
          </button>
        </div>

        {fields.description && (
          <p className="text-sm text-zinc-600 mt-3">{fields.description}</p>
        )}

        {fields.context && (
          <div className="mt-3">
            <p className="text-xs font-mono text-zinc-400 mb-0.5">Additional Context</p>
            <p className="text-sm text-zinc-600">{fields.context}</p>
          </div>
        )}

        {fields.tags && fields.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {fields.tags.map(tag => (
              <span key={tag} className="text-xs font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        {fields.source_url && (
          <a
            href={fields.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs font-mono text-zinc-400 hover:text-zinc-600 mt-3 truncate"
          >
            {fields.source_url}
          </a>
        )}

        {saved && <p className="text-xs text-green-600 font-mono mt-2">Saved.</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-mono text-zinc-500 mb-1">Title *</label>
        <input
          name="title"
          value={fields.title}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-1">Artist</label>
          <input
            name="artist"
            value={fields.artist ?? ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>
        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-1">Year</label>
          <input
            name="year"
            type="number"
            value={fields.year ?? ''}
            onChange={handleChange}
            min={1}
            max={new Date().getFullYear()}
            className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono text-zinc-500 mb-1">Medium / Category</label>
        <input
          name="medium"
          value={fields.medium ?? ''}
          onChange={handleChange}
          placeholder="e.g. photography, illustration"
          className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
      </div>

      <div>
        <label className="block text-xs font-mono text-zinc-500 mb-1">Tags</label>
        <input
          name="tags_raw"
          value={fields.tags_raw}
          onChange={handleChange}
          placeholder="comma-separated"
          className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
      </div>

      <div>
        <label className="block text-xs font-mono text-zinc-500 mb-1">Source URL</label>
        <input
          name="source_url"
          type="url"
          value={fields.source_url ?? ''}
          onChange={handleChange}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
      </div>

      <div>
        <label className="block text-xs font-mono text-zinc-500 mb-1">Notes</label>
        <textarea
          name="description"
          value={fields.description ?? ''}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-mono text-zinc-500 mb-1">Additional Context</label>
        <textarea
          name="context"
          value={fields.context ?? ''}
          onChange={handleChange}
          rows={3}
          placeholder="Historical background, cultural context, personal associations…"
          className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-500 font-mono">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-zinc-800 text-white text-sm font-mono rounded hover:bg-zinc-700 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="px-4 py-2 border border-zinc-300 text-sm font-mono rounded hover:bg-zinc-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
