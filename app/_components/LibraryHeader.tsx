'use client'

import { useState } from 'react'
import Link from 'next/link'
import UploadModal from './UploadModal'

interface LibraryHeaderProps {
  userId: string
}

export default function LibraryHeader({ userId }: LibraryHeaderProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold font-mono mb-1">Image Library</h1>
          <p className="text-sm text-zinc-500">
            Save images and rate them against Aaker's brand personality.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/library/scrape"
            className="text-xs font-mono px-3 py-1.5 border border-zinc-300 rounded hover:bg-zinc-50"
          >
            Scrape from URL
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-mono px-3 py-1.5 border border-zinc-300 rounded hover:bg-zinc-50"
          >
            + Save Image
          </button>
        </div>
      </div>

      {showModal && (
        <UploadModal userId={userId} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
