import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '../../_lib/auth/session'
import supabase from '../../_actions/supabase'
import { computeDimensionScores } from '../../_lib/dimensionScores'
import SessionTitle from '../../_components/SessionTitle'
import DimensionSliders from '../../_components/DimensionSliders'
import RadarChart from '../../_components/RadarChart'
import AssessmentResult from '../../_components/AssessmentResult'
import GenerationControls from '../../_components/GenerationControls'
import PolinePalette from '../../_components/PolinePalette'
import CanvasSection from '../../_components/CanvasSection'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SessionPage({ params }: Props) {
  const { id } = await params
  const user = await getUser()
  if (!user) redirect('/')

  const [{ data: session }, { data: traits }, { data: inputs }, { data: summaryAsset }] = await Promise.all([
    supabase.from('sessions').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('trait_profiles').select('trait, score, model').eq('session_id', id),
    supabase.from('session_inputs').select('type, raw_text, content_url').eq('session_id', id),
    supabase.from('generated_assets').select('content').eq('session_id', id).eq('task', 'summary').eq('status', 'done').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  if (!session) notFound()

  const dimensionScores = computeDimensionScores(traits ?? [])

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <Link
        href="/"
        className="text-xs font-mono text-zinc-400 hover:text-zinc-600 mb-8 inline-block"
      >
        ← Sessions
      </Link>

      <div className="mb-10">
        <SessionTitle
          sessionId={session.id}
          title={session.title}
          autoTitle={session.auto_title}
        />
        <p className="text-xs font-mono text-zinc-400 mt-1">
          {new Date(session.created_at).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric',
          })}
        </p>
      </div>

      {/* Top: 3-column profile / traits / generate+assets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
        {/* Left: profile */}
        <div className="lg:col-span-1 space-y-8">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4">
              Brand Profile
            </h2>
            <RadarChart
              data={dimensionScores}
              width={280}
              height={280}
              maxValue={5}
              fillColor="#18181b"
              strokeColor="#18181b"
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
          </div>

          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4">
              Dimensions
            </h2>
            <DimensionSliders sessionId={session.id} userId={user.id} initialScores={dimensionScores} />
          </div>

          {inputs && inputs.length > 0 && (
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
                Inputs
              </h2>
              <div className="space-y-2">
                {inputs.map((input, i) => (
                  <div key={i} className="p-3 bg-zinc-50 rounded text-sm">
                    {input.type === 'text' && (
                      <p className="font-mono text-zinc-700 text-xs leading-relaxed">
                        &ldquo;{input.raw_text}&rdquo;
                      </p>
                    )}
                    {input.type === 'image' && input.content_url && (
                      <img
                        src={input.content_url}
                        alt="Input reference"
                        className="max-h-32 rounded object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center: trait scores */}
        <div className="lg:col-span-1">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-6">
            Trait Assessment
          </h2>
          {traits && traits.length > 0 ? (
            <AssessmentResult traits={traits} />
          ) : (
            <p className="text-sm text-zinc-400">No assessment data.</p>
          )}
        </div>

        {/* Right: generation + palette */}
        <div className="lg:col-span-1 space-y-8">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4">
              Generate
            </h2>
            <GenerationControls
              sessionId={session.id}
              dimensionWeights={dimensionScores}
              brandSummary={summaryAsset?.content ?? undefined}
            />
          </div>

          {(traits ?? []).length > 0 && (
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4">
                Palette
              </h2>
              <PolinePalette traitScores={traits!} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom: asset library + canvas + compositions */}
      <div className="mt-12 space-y-8">
        <CanvasSection sessionId={session.id} />
      </div>
    </div>
  )
}
