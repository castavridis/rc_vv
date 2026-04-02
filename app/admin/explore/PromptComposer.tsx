'use client'

import { useState } from 'react'
import { BRAND_PERSONALITY, DIMENSIONS, type Dimension, type Trait } from '../../_lib/brand'

interface PromptComposerProps {
  selectedTraits: Set<string>
  reasons: Record<string, Record<string, string[]>> // trait → column → reasons[]
}

function getDimensionForTrait(trait: string): Dimension | null {
  for (const dim of DIMENSIONS) {
    const facets = Object.values(BRAND_PERSONALITY[dim])
    for (const traits of facets) {
      if (traits.includes(trait as Trait)) return dim
    }
  }
  return null
}

export default function PromptComposer({ selectedTraits, reasons }: PromptComposerProps) {
  const [copied, setCopied] = useState(false)

  if (selectedTraits.size === 0) {
    return (
      <p className="text-xs text-zinc-400 mt-6">
        Select traits above to compose a brand brief.
      </p>
    )
  }

  const traits = Array.from(selectedTraits)

  const keyAssociations = traits
    .map(trait => {
      const allReasons = Object.values(reasons[trait] ?? {}).flat()
      return allReasons.find(r => r.trim()) ?? null
    })
    .filter(Boolean) as string[]

  const dimCounts: Record<string, number> = {}
  for (const trait of traits) {
    const dim = getDimensionForTrait(trait)
    if (dim) dimCounts[dim] = (dimCounts[dim] ?? 0) + 1
  }
  const primaryDims = DIMENSIONS.filter(d => (dimCounts[d] ?? 0) >= 2)

  const prompt = [
    `Brand personality: ${traits.join(', ')}`,
    keyAssociations.length > 0
      ? `\nKey associations: ${keyAssociations.join('; ')}`
      : '',
    primaryDims.length > 0
      ? `\nPrimary dimensions: ${primaryDims.join(', ')}`
      : '',
  ]
    .filter(Boolean)
    .join('')

  function handleCopy() {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="border border-zinc-200 rounded p-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Brand Brief</span>
        <button
          onClick={handleCopy}
          className="text-xs text-zinc-400 hover:text-zinc-600 border border-zinc-200 rounded px-2 py-0.5"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="text-xs font-mono text-zinc-700 whitespace-pre-wrap">{prompt}</pre>
    </div>
  )
}
