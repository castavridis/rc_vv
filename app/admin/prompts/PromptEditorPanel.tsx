'use client'

import { useState } from 'react'
import type { PromptConfigRow } from '../../_actions/getPromptConfigs'
import PromptEditor from './PromptEditor'

interface Props {
  configs: PromptConfigRow[]
  models: { id: string; label: string }[]
  personas: { id: string; label: string; prompt: string }[]
}

export default function PromptEditorPanel({ configs, models, personas }: Props) {
  const [selectedModel, setSelectedModel] = useState(models[0]?.id ?? '')

  function hasCustomConfig(modelId: string): boolean {
    return configs.some(c => c.model === modelId && c.isActive)
  }

  return (
    <div className="space-y-6">
      {/* Model picker */}
      <div className="flex flex-wrap gap-2">
        {models.map(m => (
          <button
            key={m.id}
            onClick={() => setSelectedModel(m.id)}
            className={`relative text-[10px] font-mono px-3 py-1.5 rounded border transition-colors ${
              selectedModel === m.id
                ? 'border-zinc-600 bg-zinc-800 text-white'
                : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400'
            }`}
          >
            {m.label}
            {hasCustomConfig(m.id) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        ))}
      </div>

      {/* Persona editors for selected model */}
      <div className="space-y-4">
        {personas.map(persona => {
          const activeConfig = configs.find(
            c => c.model === selectedModel && c.persona === persona.id && c.isActive
          ) ?? null
          const history = configs.filter(
            c => c.model === selectedModel && c.persona === persona.id && !c.isActive
          )
          return (
            <PromptEditor
              key={`${selectedModel}::${persona.id}`}
              model={selectedModel}
              persona={persona}
              activeConfig={activeConfig}
              history={history}
              defaultPrompt={persona.prompt}
            />
          )
        })}
      </div>
    </div>
  )
}
