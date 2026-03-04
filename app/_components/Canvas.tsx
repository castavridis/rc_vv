'use client'

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import html2canvas from 'html2canvas'
import { saveComposition, type CanvasElement } from '../_actions/saveComposition'

gsap.registerPlugin(Draggable)

const CANVAS_W = 900
const CANVAS_H = 600
const DEFAULT_SIZE = 200

export interface CanvasHandle {
  addElement: (storageUrl: string, assetId: string) => void
}

interface CanvasProps {
  sessionId: string
  initialState?: CanvasElement[]
  onSaved?: (thumbnailUrl: string) => void
}

const Canvas = forwardRef<CanvasHandle, CanvasProps>(function Canvas(
  { sessionId, initialState, onSaved }: CanvasProps,
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [elements, setElements] = useState<CanvasElement[]>(initialState ?? [])
  const [bgColor, setBgColor] = useState('#ffffff')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const draggableRefs = useRef<Map<string, Draggable>>(new Map())

  useImperativeHandle(ref, () => ({
    addElement(storageUrl: string, assetId: string) {
      const x = CANVAS_W / 2 - DEFAULT_SIZE / 2
      const y = CANVAS_H / 2 - DEFAULT_SIZE / 2
      setElements(prev => [...prev, { id: assetId, storageUrl, x, y, width: DEFAULT_SIZE, height: DEFAULT_SIZE }])
    },
  }))

  // Initialize Draggable for new elements
  useEffect(() => {
    elements.forEach(el => {
      if (draggableRefs.current.has(el.id)) return
      const node = document.getElementById(`canvas-el-${el.id}`)
      if (!node) return

      const [d] = Draggable.create(node, {
        type: 'x,y',
        bounds: containerRef.current ?? undefined,
        onDragEnd() {
          const x = gsap.getProperty(node, 'x') as number
          const y = gsap.getProperty(node, 'y') as number
          setElements(prev =>
            prev.map(e => e.id === el.id ? { ...e, x, y } : e)
          )
        },
      })
      draggableRefs.current.set(el.id, d)
    })
  }, [elements])

  // Handle drop from asset library
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const storageUrl = e.dataTransfer.getData('asset-url')
    const assetId = e.dataTransfer.getData('asset-id')
    if (!storageUrl || !assetId) return

    const rect = containerRef.current!.getBoundingClientRect()
    const x = e.clientX - rect.left - DEFAULT_SIZE / 2
    const y = e.clientY - rect.top - DEFAULT_SIZE / 2

    setElements(prev => [
      ...prev,
      { id: assetId, storageUrl, x, y, width: DEFAULT_SIZE, height: DEFAULT_SIZE },
    ])
  }, [])

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  function removeElement(id: string) {
    draggableRefs.current.get(id)?.kill()
    draggableRefs.current.delete(id)
    setElements(prev => prev.filter(e => e.id !== id))
  }

  async function handleSave() {
    if (!containerRef.current) return
    setSaving(true)
    setSaveError(null)

    try {
      const captureCanvas = await html2canvas(containerRef.current, {
        backgroundColor: bgColor,
        useCORS: true,
        scale: 1,
      })

      const base64 = captureCanvas.toDataURL('image/png').split(',')[1]
      const result = await saveComposition(sessionId, elements, base64)

      if (result.success && result.thumbnailUrl) {
        onSaved?.(result.thumbnailUrl)
      } else {
        setSaveError(result.error ?? 'Failed to save')
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3" data-canvas>
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          Background
          <input
            type="color"
            value={bgColor}
            onChange={e => setBgColor(e.target.value)}
            className="w-6 h-6 rounded cursor-pointer border-0"
          />
        </label>
        <button
          onClick={() => setElements([])}
          className="text-xs font-mono text-zinc-400 hover:text-zinc-600"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={saving || elements.length === 0}
          className="ml-auto px-3 py-1.5 bg-zinc-800 text-white text-xs font-mono rounded hover:bg-zinc-700 disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save Composition'}
        </button>
      </div>

      {saveError && <p className="text-xs font-mono text-red-500">{saveError}</p>}

      {/* Canvas */}
      <div
        ref={containerRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="relative rounded overflow-hidden border border-zinc-200"
        style={{ width: CANVAS_W, height: CANVAS_H, backgroundColor: bgColor }}
      >
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-xs font-mono text-zinc-300">
              Drag assets here to compose
            </p>
          </div>
        )}

        {elements.map(el => (
          <div
            key={el.id}
            id={`canvas-el-${el.id}`}
            className="absolute cursor-grab active:cursor-grabbing group"
            style={{ left: el.x, top: el.y, width: el.width, height: el.height }}
          >
            <img
              src={el.storageUrl}
              alt=""
              className="w-full h-full object-contain pointer-events-none select-none"
              draggable={false}
            />
            <button
              onClick={() => removeElement(el.id)}
              className="absolute top-0 right-0 w-5 h-5 bg-zinc-800/70 text-white text-xs rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
})

export default Canvas
