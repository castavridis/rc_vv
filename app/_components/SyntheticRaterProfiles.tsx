import { type SyntheticRaterProfile } from '../_actions/getSyntheticProfiles'
import TasteProfileSummary from './TasteProfileSummary'

interface SyntheticRaterProfilesProps {
  profiles: SyntheticRaterProfile[]
}

export default function SyntheticRaterProfiles({ profiles }: SyntheticRaterProfilesProps) {
  if (profiles.length === 0) return null

  return (
    <div className="mt-6 pt-6 border-t border-zinc-100">
      <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4">
        Synthetic Raters
      </h3>
      <div className="space-y-6">
        {profiles.map(rater => (
          <details
            key={`${rater.model}::${rater.persona}`}
            className="group"
          >
            <summary className="cursor-pointer text-[11px] font-mono text-zinc-600 hover:text-zinc-800 list-none flex items-center gap-1">
              <span className="text-zinc-400 group-open:rotate-90 transition-transform">&#9654;</span>
              <span className="font-semibold">{rater.modelLabel}</span>
              <span className="text-zinc-400">·</span>
              <span>{rater.personaLabel}</span>
              <span className="text-zinc-400 ml-auto">{rater.artworksRated} rated</span>
            </summary>
            <div className="mt-3 ml-3">
              <TasteProfileSummary profile={rater.profile} totalRated={rater.artworksRated} />
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
