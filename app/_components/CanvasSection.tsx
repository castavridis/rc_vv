'use client'

import { useRef } from 'react'
import AssetLibrary from './AssetLibrary'
import Canvas, { type CanvasHandle } from './Canvas'
import CompositionList from './CompositionList'

interface CanvasSectionProps {
  sessionId: string
}

export default function CanvasSection({ sessionId }: CanvasSectionProps) {
  const canvasRef = useRef<CanvasHandle>(null)

  function handleAddToCanvas(storageUrl: string, assetId: string) {
    canvasRef.current?.addElement(storageUrl, assetId)
  }

  return (
    <>
      <div>
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4">
          Asset Library
        </h2>
        <AssetLibrary sessionId={sessionId} onAddToCanvas={handleAddToCanvas} />
      </div>

      <div>
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4">
          Canvas
        </h2>
        <Canvas ref={canvasRef} sessionId={sessionId} />
      </div>

      <div>
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4">
          Saved Compositions
        </h2>
        <CompositionList sessionId={sessionId} />
      </div>
    </>
  )
}
