import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '../../_lib/auth/session'
import { getAssessmentErrors } from '../../_actions/getAssessmentErrors'
import { VISION_MODELS } from '../../_lib/visionModels'
import { ASSESSMENT_PERSONAS } from '../../_lib/assessmentPersonas'
import ErrorCard from './ErrorCard'

export default async function ErrorsPage() {
  const user = await getUser()
  if (!user) redirect('/')

  const { rows } = await getAssessmentErrors()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 font-mono">
      <div className="flex items-center justify-between mb-6">
        <Link href="/library" className="text-xs text-zinc-400 hover:text-zinc-600">← Library</Link>
        <div className="flex gap-4">
          <Link href="/admin/explore" className="text-xs text-zinc-400 hover:text-zinc-600">Explore</Link>
          <Link href="/admin/prompts" className="text-xs text-zinc-400 hover:text-zinc-600">Prompts</Link>
        </div>
      </div>

      <h1 className="text-sm font-mono uppercase tracking-wider text-zinc-800 mb-1">Assessment Errors</h1>
      <p className="text-xs text-zinc-400 mb-6">{rows.length} unresolved</p>

      {rows.length === 0 ? (
        <p className="text-xs text-zinc-400">No unresolved errors.</p>
      ) : (
        <div className="space-y-3">
          {rows.map(row => (
            <ErrorCard
              key={row.id}
              row={row}
              modelLabel={VISION_MODELS.find(m => m.id === row.model)?.label ?? row.model}
              personaLabel={ASSESSMENT_PERSONAS.find(p => p.id === row.persona)?.label ?? row.persona}
            />
          ))}
        </div>
      )}
    </div>
  )
}
