'use client'

import { useEffect, useState } from 'react'
import { getSessionAssets, type AssetRow } from '../_actions/getSessionAssets'

type AssetTask = 'summary' | 'hex_color' | 'image' | 'svg' | 'animation'

type Asset = AssetRow & { task: AssetTask }

interface AssetLibraryProps {
  sessionId: string
  refreshKey?: number
  onAddToCanvas?: (storageUrl: string, assetId: string) => void
}

const TASK_ORDER: AssetTask[] = ['summary', 'hex_color', 'image', 'svg', 'animation']
const TASK_LABELS: Record<AssetTask, string> = {
  summary: 'Summaries',
  hex_color: 'Colors',
  image: 'Images',
  svg: 'SVGs',
  animation: 'Animations',
}

export default function AssetLibrary({ sessionId, refreshKey, onAddToCanvas }: AssetLibraryProps) {
  const [assets, setAssets] = useState<Asset[]>([])

  useEffect(() => {
    getSessionAssets(sessionId).then(data => setAssets(data as Asset[]))
  }, [sessionId, refreshKey])

  const byTask = TASK_ORDER.reduce<Record<AssetTask, Asset[]>>((acc, task) => {
    acc[task] = assets.filter(a => a.task === task)
    return acc
  }, {} as Record<AssetTask, Asset[]>)

  if (assets.length === 0) {
    return (
      <p className="text-xs font-mono text-zinc-300">No assets yet.</p>
    )
  }

  return (
    <div className="space-y-6">
      {TASK_ORDER.filter(task => byTask[task].length > 0).map(task => (
        <div key={task}>
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">
            {TASK_LABELS[task]}
          </p>
          <div className={task === 'image' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
            {byTask[task].map(asset => (
              <AssetTile key={asset.id} asset={asset} onAddToCanvas={onAddToCanvas} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function AssetTile({ asset, onAddToCanvas }: { asset: Asset; onAddToCanvas?: (url: string, id: string) => void }) {
  if (asset.task === 'image' && asset.storage_url) {
    function handleDragStart(e: React.DragEvent) {
      e.dataTransfer.setData('asset-url', asset.storage_url!)
      e.dataTransfer.setData('asset-id', asset.id)
      e.dataTransfer.effectAllowed = 'copy'
    }

    return (
      <div
        className="relative aspect-square rounded overflow-hidden bg-zinc-100 cursor-grab group"
        draggable
        onDragStart={handleDragStart}
      >
        <img
          src={asset.storage_url}
          alt={asset.trait ?? 'generated image'}
          className="w-full h-full object-cover pointer-events-none select-none"
          draggable={false}
        />
        {onAddToCanvas && (
          <button
            onClick={() => onAddToCanvas(asset.storage_url!, asset.id)}
            className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-zinc-800/80 text-white text-[10px] font-mono rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            + Canvas
          </button>
        )}
      </div>
    )
  }

  if (asset.task === 'hex_color' && asset.content) {
    let colors: string[] = []
    try { colors = JSON.parse(asset.content) } catch { /* ignore */ }
    return (
      <div className="flex gap-2">
        {colors.map(hex => (
          <div
            key={hex}
            className="w-8 h-8 rounded"
            style={{ backgroundColor: hex }}
            title={hex}
          />
        ))}
        <span className="text-xs font-mono text-zinc-500 self-center">
          {colors.join(', ')}
        </span>
      </div>
    )
  }

  if (asset.task === 'svg' && asset.content) {
    return (
      <div
        className="w-full aspect-square rounded bg-zinc-50 overflow-hidden p-2"
        dangerouslySetInnerHTML={{ __html: asset.content }}
      />
    )
  }

  if (asset.task === 'summary' && asset.content) {
    return (
      <p className="text-xs font-mono text-zinc-600 leading-relaxed">
        {asset.content}
      </p>
    )
  }

  if (asset.task === 'animation' && asset.content) {
    return (
      <div className="p-2 bg-zinc-50 rounded">
        <pre className="text-[10px] font-mono text-zinc-500 overflow-x-auto whitespace-pre-wrap">
          {asset.content.slice(0, 200)}{asset.content.length > 200 ? '…' : ''}
        </pre>
      </div>
    )
  }

  return null
}
