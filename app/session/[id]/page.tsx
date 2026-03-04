import { redirect, notFound } from 'next/navigation'
import { getUser } from '../../_lib/auth/session'
import supabase from '../../_actions/supabase'
import AssessmentResult from '../../_components/AssessmentResult'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SessionPage({ params }: Props) {
  const { id } = await params
  const user = await getUser()
  if (!user) redirect('/')

  const [{ data: session }, { data: traits }, { data: inputs }] = await Promise.all([
    supabase.from('sessions').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('trait_profiles').select('trait, score, model').eq('session_id', id),
    supabase.from('session_inputs').select('type, raw_text, content_url').eq('session_id', id),
  ])

  if (!session) notFound()

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link
        href="/"
        className="text-xs font-mono text-zinc-400 hover:text-zinc-600 mb-8 inline-block"
      >
        ← Sessions
      </Link>

      <div className="mb-10">
        <h1 className="text-2xl font-bold font-mono">{session.title}</h1>
        <p className="text-xs font-mono text-zinc-400 mt-1">
          {new Date(session.created_at).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
          })}
        </p>
      </div>

      {inputs && inputs.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4">Inputs</h2>
          <div className="space-y-3">
            {inputs.map((input, i) => (
              <div key={i} className="p-3 bg-zinc-50 rounded text-sm">
                {input.type === 'text' && (
                  <p className="font-mono text-zinc-700">&ldquo;{input.raw_text}&rdquo;</p>
                )}
                {input.type === 'image' && input.content_url && (
                  <img
                    src={input.content_url}
                    alt="Input reference"
                    className="max-h-48 rounded object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-6">
          Brand Personality Assessment
        </h2>
        {traits && traits.length > 0 ? (
          <AssessmentResult traits={traits} />
        ) : (
          <p className="text-sm text-zinc-500">No assessment data yet.</p>
        )}
      </div>
    </div>
  )
}
