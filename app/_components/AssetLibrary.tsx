'use client'

import { useEffect, useRef, useState } from 'react'
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

function svgToDataUri(svg: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
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
        className={`relative w-full aspect-square rounded bg-zinc-50 overflow-hidden p-2 group${onAddToCanvas ? ' cursor-pointer' : ''}`}
        onClick={onAddToCanvas ? () => onAddToCanvas(svgToDataUri(asset.content!), asset.id) : undefined}
      >
        <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: asset.content }} />
        {onAddToCanvas && (
          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-zinc-800/80 text-white text-[10px] font-mono rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            + Canvas
          </span>
        )}
      </div>
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
    return <AnimationPreview content={asset.content} asset={asset} onAddToCanvas={onAddToCanvas} />
  }

  return null
}

function AnimationPreview({ content, asset, onAddToCanvas }: { content: string; asset: Asset; onAddToCanvas?: (url: string, id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showCode, setShowCode] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Extract SVG content from the animation code
    const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/i)
    if (svgMatch) {
      container.innerHTML = svgMatch[0]
    } else {
      // No SVG — create a simple shape as the animation target
      container.innerHTML = ''
      const placeholder = document.createElement('div')
      placeholder.style.cssText = 'width:48px;height:48px;border-radius:8px;background:#a1a1aa;margin:auto;'
      container.appendChild(placeholder)
    }

    // The first child is the element scripts expect as `el`
    const el = container.firstElementChild as HTMLElement | null
    if (!el) return

    // Extract JS to execute: from <script> tags if present, otherwise treat entire content as JS
    const scriptMatch = content.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/i)
    const jsCode = scriptMatch?.[1] ?? (svgMatch ? null : content)
    if (jsCode) {
      const runScript = () => {
        try {
          const fn = new Function('el', jsCode)
          fn(el)
        } catch (e) {
          console.warn('[AnimationPreview] script error:', e)
        }
      }
      try {
        if (typeof (window as unknown as Record<string, unknown>).gsap === 'undefined') {
          const gsapScript = document.createElement('script')
          gsapScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js'
          gsapScript.onload = runScript
          document.head.appendChild(gsapScript)
        } else {
          runScript()
        }
      } catch (e) {
        console.warn('[AnimationPreview] failed to execute animation:', e)
      }
    }

    return () => {
      container.innerHTML = ''
    }
  }, [content])

  return (
    <div className="rounded bg-zinc-50 overflow-hidden">
      <div
        ref={containerRef}
        className="w-full aspect-square p-2"
      />
      <div className="px-2 pb-2 flex items-center gap-2">
        <button
          onClick={() => setShowCode(!showCode)}
          className="text-[10px] font-mono text-zinc-400 hover:text-zinc-600"
        >
          {showCode ? 'Hide code' : 'Show code'}
        </button>
        {onAddToCanvas && content.match(/<svg[\s\S]*?<\/svg>/i) && (
          <button
            onClick={() => {
              const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/i)
              if (svgMatch) onAddToCanvas(svgToDataUri(svgMatch[0]), asset.id)
            }}
            className="px-1.5 py-0.5 bg-zinc-800/80 text-white text-[10px] font-mono rounded hover:bg-zinc-700/80 transition-colors"
          >
            + Canvas
          </button>
        )}
        {showCode && (
          <pre className="text-[10px] font-mono text-zinc-500 overflow-x-auto whitespace-pre-wrap mt-1">
            {content}
          </pre>
        )}
      </div>
    </div>
  )
}
