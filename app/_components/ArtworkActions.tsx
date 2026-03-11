'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteArtwork } from '../_actions/deleteArtwork'
import { moveArtwork } from '../_actions/moveArtwork'

interface ArtworkActionsProps {
  artworkId: string
  userId: string
  libraries: { id: string; name: string }[]
  currentLibraryId?: string | null
}

export default function ArtworkActions({ artworkId, userId, libraries, currentLibraryId }: ArtworkActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteArtwork(artworkId, userId)
      if (result.success) {
        router.refresh()
      }
    })
  }

  function handleMove(libraryId: string | null) {
    startTransition(async () => {
      const result = await moveArtwork(artworkId, userId, libraryId)
      if (result.success) {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex items-center gap-2 mt-1" onClick={e => e.preventDefault()}>
      {libraries.length > 0 && (
        <select
          value={currentLibraryId ?? ''}
          onChange={e => handleMove(e.target.value || null)}
          disabled={isPending}
          className="text-[10px] font-mono px-1 py-0.5 border border-zinc-200 rounded bg-white text-zinc-500"
        >
          <option value="">No library</option>
          {libraries.map(lib => (
            <option key={lib.id} value={lib.id}>{lib.name}</option>
          ))}
        </select>
      )}
      {showConfirm ? (
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-[10px] font-mono px-1.5 py-0.5 bg-red-500 text-white rounded disabled:opacity-50"
          >
            {isPending ? '...' : 'Confirm'}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="text-[10px] font-mono px-1.5 py-0.5 border border-zinc-200 rounded text-zinc-500"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="text-[10px] font-mono text-zinc-400 hover:text-red-500"
        >
          Delete
        </button>
      )}
    </div>
  )
}
