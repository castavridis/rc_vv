import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '../../_lib/auth/session'
import { getPromptConfigs } from '../../_actions/getPromptConfigs'
import { VISION_MODELS } from '../../_lib/visionModels'
import { ASSESSMENT_PERSONAS } from '../../_lib/assessmentPersonas'
import PromptEditorPanel from './PromptEditorPanel'

export default async function PromptsPage() {
  const user = await getUser()
  if (!user) redirect('/')

  const { configs } = await getPromptConfigs()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 font-mono">
      <div className="flex items-center justify-between mb-6">
        <Link href="/library" className="text-xs text-zinc-400 hover:text-zinc-600">← Library</Link>
        <div className="flex gap-4">
          <Link href="/admin/errors" className="text-xs text-zinc-400 hover:text-zinc-600">Errors</Link>
        </div>
      </div>

      <h1 className="text-sm font-mono uppercase tracking-wider text-zinc-800 mb-6">Prompt Configs</h1>

      <PromptEditorPanel
        configs={configs}
        models={VISION_MODELS as unknown as { id: string; label: string }[]}
        personas={ASSESSMENT_PERSONAS as unknown as { id: string; label: string; prompt: string }[]}
      />
    </div>
  )
}
