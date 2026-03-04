'use client'

import { useEffect, useState } from 'react'
import { getCompositions } from '../_actions/saveComposition'

interface Composition {
  id: string
  thumbnail_url: string | null
  created_at: string
}

interface CompositionListProps {
  sessionId: string
  refreshKey?: number
}

export default function CompositionList({ sessionId, refreshKey }: CompositionListProps) {
  const [compositions, setCompositions] = useState<Composition[]>([])

  useEffect(() => {
    getCompositions(sessionId).then(data => setCompositions(data as Composition[]))
  }, [sessionId, refreshKey])

  if (compositions.length === 0) {
    return <p className="text-xs font-mono text-zinc-300">No compositions saved yet.</p>
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {compositions.map(c => (
        <div key={c.id} className="aspect-video rounded overflow-hidden bg-zinc-100 relative group">
          {c.thumbnail_url ? (
            <img
              src={c.thumbnail_url}
              alt="Composition thumbnail"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs font-mono">
              No preview
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-[10px] font-mono text-white truncate">
              {new Date(c.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
