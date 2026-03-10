'use client'

import { useState } from 'react'
import Link from 'next/link'
import { scrapeUrl, ScrapeResult } from '../_actions/scrapeUrl'

interface ImageState {
  src: string
  alt?: string
  selected: boolean
  titleOverride: string
  status: 'idle' | 'saving' | 'saved' | 'error'
  errorMsg?: string
}

export default function ScrapeClient() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ScrapeResult | null>(null)
  const [images, setImages] = useState<ImageState[]>([])

  async function handleFetch() {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    setImages([])
    try {
      const data = await scrapeUrl(url.trim())
      setResult(data)
      setImages(
        data.images.map((img) => ({
          src: img.src,
          alt: img.alt,
          selected: false,
          titleOverride: img.alt || data.meta.title,
          status: 'idle',
        })),
      )
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  function toggleSelect(idx: number) {
    setImages((prev) =>
      prev.map((img, i) =>
        i === idx ? { ...img, selected: !img.selected } : img,
      ),
    )
  }

  function selectAll() {
    setImages((prev) => prev.map((img) => ({ ...img, selected: true })))
  }

  function updateTitle(idx: number, value: string) {
    setImages((prev) =>
      prev.map((img, i) =>
        i === idx ? { ...img, titleOverride: value } : img,
      ),
    )
  }

  async function saveSelected() {
    if (!result) return
    const toSave = images.filter((img) => img.selected && img.status === 'idle')
    if (toSave.length === 0) return

    for (let idx = 0; idx < images.length; idx++) {
      const img = images[idx]
      if (!img.selected || img.status !== 'idle') continue

      setImages((prev) =>
        prev.map((im, i) => (i === idx ? { ...im, status: 'saving' } : im)),
      )

      try {
        const res = await fetch('/api/save-image', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: img.src,
            source_url: result.meta.sourceUrl,
            title: img.titleOverride || result.meta.title || undefined,
          }),
        })
        const data = await res.json()
        if (data.artworkId) {
          setImages((prev) =>
            prev.map((im, i) => (i === idx ? { ...im, status: 'saved' } : im)),
          )
        } else {
          setImages((prev) =>
            prev.map((im, i) =>
              i === idx
                ? { ...im, status: 'error', errorMsg: data.error ?? 'Unknown error' }
                : im,
            ),
          )
        }
      } catch (err) {
        setImages((prev) =>
          prev.map((im, i) =>
            i === idx
              ? { ...im, status: 'error', errorMsg: String(err) }
              : im,
          ),
        )
      }
    }
  }

  const selectedCount = images.filter((img) => img.selected).length
  const savedCount = images.filter((img) => img.status === 'saved').length

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link
        href="/library"
        className="text-xs font-mono text-zinc-400 hover:text-zinc-600 mb-8 inline-block"
      >
        ← Library
      </Link>

      <h1 className="text-2xl font-bold font-mono mb-1">Scrape from URL</h1>
      <p className="text-sm text-zinc-500 mb-8">
        Paste an article URL to extract images and save them to your library.
      </p>

      {/* URL Input */}
      <div className="flex gap-3 mb-8">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          placeholder="https://designreviewed.com/…"
          className="flex-1 px-3 py-2 border border-zinc-300 rounded font-mono text-sm focus:outline-none focus:border-zinc-500"
        />
        <button
          onClick={handleFetch}
          disabled={loading || !url.trim()}
          className="px-4 py-2 bg-zinc-800 text-white text-sm font-mono rounded hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? 'Fetching…' : 'Fetch Images'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 font-mono mb-6">{error}</p>
      )}

      {result && images.length === 0 && (
        <p className="text-sm text-zinc-500">No images found on that page.</p>
      )}

      {images.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-mono text-zinc-400">
              {images.length} image{images.length !== 1 ? 's' : ''} found
              {savedCount > 0 && ` · ${savedCount} saved`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={selectAll}
                className="text-xs font-mono text-zinc-500 hover:text-zinc-800 underline"
              >
                Select All
              </button>
              <button
                onClick={saveSelected}
                disabled={selectedCount === 0}
                className="px-3 py-1.5 bg-zinc-800 text-white text-xs font-mono rounded hover:bg-zinc-700 disabled:opacity-50"
              >
                Save Selected ({selectedCount})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, idx) => (
              <div key={idx} className="space-y-2">
                <div
                  className={`relative cursor-pointer rounded overflow-hidden border-2 transition-colors ${
                    img.selected ? 'border-zinc-800' : 'border-transparent'
                  } ${img.status === 'saved' ? 'opacity-60' : ''}`}
                  onClick={() =>
                    img.status === 'idle' || img.status === 'error'
                      ? toggleSelect(idx)
                      : undefined
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={img.alt ?? ''}
                    className="w-full aspect-square object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  {img.status === 'saving' && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-xs font-mono text-zinc-600">
                      Saving…
                    </div>
                  )}
                  {img.status === 'saved' && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-xs font-mono text-green-700">
                      Saved
                    </div>
                  )}
                  {img.status === 'error' && (
                    <div className="absolute inset-0 bg-red-50/80 flex items-center justify-center text-xs font-mono text-red-600 p-1 text-center">
                      {img.errorMsg ?? 'Error'}
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={img.titleOverride}
                  onChange={(e) => updateTitle(idx, e.target.value)}
                  placeholder="Title (optional)"
                  className="w-full px-2 py-1 border border-zinc-200 rounded text-xs font-mono focus:outline-none focus:border-zinc-400"
                  disabled={img.status === 'saved' || img.status === 'saving'}
                />
              </div>
            ))}
          </div>

          {savedCount > 0 && (
            <div className="mt-6">
              <Link
                href="/library"
                className="text-sm font-mono text-zinc-600 underline hover:text-zinc-900"
              >
                View {savedCount} saved image{savedCount !== 1 ? 's' : ''} in Library →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
