'use client'

import { useEffect, useState } from 'react'
import { generatePolinePalette, getAnchorColorsFromProfile } from '../_lib/polinePalette'

interface PolinePaletteProps {
  traitScores: { trait: string; score: number }[]
  onColorSelect?: (hex: string) => void
}

export default function PolinePalette({ traitScores, onColorSelect }: PolinePaletteProps) {
  const [palette, setPalette] = useState<string[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const anchors = getAnchorColorsFromProfile(traitScores)
    generatePolinePalette(anchors, 8).then(setPalette)
  }, [traitScores])

  function handleClick(hex: string) {
    navigator.clipboard.writeText(hex).then(() => {
      setCopied(hex)
      setTimeout(() => setCopied(null), 1500)
    })
    onColorSelect?.(hex)
  }

  if (palette.length === 0) return null

  return (
    <div>
      <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">
        Palette
      </p>
      <div className="flex gap-1.5 flex-wrap">
        {palette.map((hex, i) => (
          <button
            key={i}
            onClick={() => handleClick(hex)}
            title={copied === hex ? 'Copied!' : hex}
            className="w-7 h-7 rounded transition-transform hover:scale-110 ring-offset-1 hover:ring-2 hover:ring-zinc-400"
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
      {copied && (
        <p className="text-xs font-mono text-zinc-400 mt-1">{copied} copied</p>
      )}
    </div>
  )
}
