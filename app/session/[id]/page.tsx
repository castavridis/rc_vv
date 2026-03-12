import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '../../_lib/auth/session'
import supabase from '../../_actions/supabase'
import { computeDimensionScores } from '../../_lib/dimensionScores'
import { cosineSimilarity } from '../../_lib/artwork-similarity'
import { type Trait } from '../../_lib/brand'
import { findSimilarItems } from '../../_lib/similar-items'
import SimilarItems from '../../_components/SimilarItems'
import SessionTitle from '../../_components/SessionTitle'
import DimensionSliders from '../../_components/DimensionSliders'
import RadarChart from '../../_components/RadarChart'
import AssessmentResult from '../../_components/AssessmentResult'
import GenerationControls from '../../_components/GenerationControls'
import PolinePalette from '../../_components/PolinePalette'
import CanvasSection from '../../_components/CanvasSection'
import D10Die from '../../_components/D10Die'

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
    supabase.from('session_inputs').select('id, type, raw_text, content_url').eq('session_id', id),
    supabase.from('generated_assets').select('content').eq('session_id', id).eq('task', 'summary').eq('status', 'done').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  if (!session) notFound()

  const dimensionScores = computeDimensionScores(traits ?? [])

  // Compute input similarity pairs if multiple inputs with trait profiles
  type InputSimilarity = { inputA: number; inputB: number; similarity: number }
  let inputSimilarities: InputSimilarity[] = []

  if (inputs && inputs.length > 1) {
    // Get trait profiles per input
    const { data: allProfiles } = await supabase
      .from('trait_profiles')
      .select('input_id, trait, score')
      .eq('session_id', id)

    if (allProfiles && allProfiles.length > 0) {
      const byInput: Record<string, Record<string, number>> = {}
      for (const row of allProfiles) {
        if (!row.input_id) continue
        if (!byInput[row.input_id]) byInput[row.input_id] = {}
        byInput[row.input_id][row.trait] = row.score
      }

      const inputIds = Object.keys(byInput)
      for (let i = 0; i < inputIds.length; i++) {
        for (let j = i + 1; j < inputIds.length; j++) {
          const sim = cosineSimilarity(
            byInput[inputIds[i]] as Record<Trait, number>,
            byInput[inputIds[j]] as Record<Trait, number>
          )
          const idxA = inputs.findIndex(inp => inp.id === inputIds[i])
          const idxB = inputs.findIndex(inp => inp.id === inputIds[j])
          if (idxA >= 0 && idxB >= 0) {
            inputSimilarities.push({ inputA: idxA, inputB: idxB, similarity: sim })
          }
        }
      }
      inputSimilarities.sort((a, b) => b.similarity - a.similarity)
    }
  }

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
            <div className="flex justify-center mb-4">
              <D10Die scores={dimensionScores} size={160} autoRotate interactive />
            </div>
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

              {inputSimilarities.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-mono text-zinc-400 uppercase mb-1">Similar inputs</p>
                  <div className="space-y-1">
                    {inputSimilarities.slice(0, 5).map((sim, i) => (
                      <div key={i} className="text-[10px] font-mono text-zinc-500 flex gap-2">
                        <span>#{sim.inputA + 1} ↔ #{sim.inputB + 1}</span>
                        <span className={sim.similarity > 0.7 ? 'text-green-600' : sim.similarity > 0.4 ? 'text-zinc-500' : 'text-zinc-300'}>
                          {(sim.similarity * 100).toFixed(0)}% similar
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              traitScores={traits ?? undefined}
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

      {traits && traits.length > 0 && (
        <SimilarItemsSection sessionId={session.id} userId={user.id} traits={traits} dimensionScores={dimensionScores} />
      )}
    </div>
  )
}

async function SimilarItemsSection({ sessionId, userId, traits, dimensionScores }: {
  sessionId: string
  userId: string
  traits: { trait: string; score: number }[]
  dimensionScores: import('../../_lib/dimensionScores').DimensionScores
}) {
  const traitMap: Record<string, number> = {}
  for (const t of traits) traitMap[t.trait] = t.score

  const similarItems = await findSimilarItems(sessionId, userId, traitMap, dimensionScores)
  return <SimilarItems data={similarItems} />
}
