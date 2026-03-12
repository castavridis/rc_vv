import Link from 'next/link'
import { type SimilarItemsResult } from '../_lib/similar-items'

function simBadge(similarity: number) {
  const pct = (similarity * 100).toFixed(0)
  const color = similarity > 0.7 ? 'text-green-600' : similarity > 0.4 ? 'text-zinc-500' : 'text-zinc-300'
  return <span className={`text-[10px] font-mono ${color}`}>{pct}%</span>
}

function ScrollRow({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div>
      <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">{label}</h3>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {children}
      </div>
    </div>
  )
}

export default function SimilarItems({ data }: { data: SimilarItemsResult }) {
  const { sessions, brands, artworks } = data
  if (sessions.length === 0 && brands.length === 0 && artworks.length === 0) return null

  return (
    <div className="mt-12 space-y-8">
      <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Similar</h2>

      {sessions.length > 0 && (
        <ScrollRow label="Sessions">
          {sessions.map(s => (
            <Link key={s.id} href={`/session/${s.id}`} className="group flex-shrink-0 w-48">
              <div className="aspect-video rounded overflow-hidden bg-zinc-100 mb-2">
                {s.thumbnailUrl ? (
                  <img src={s.thumbnailUrl} alt={s.title} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs font-mono">
                    no composition
                  </div>
                )}
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <p className="text-xs font-mono font-semibold truncate group-hover:opacity-70 transition-opacity">{s.title}</p>
                {simBadge(s.similarity)}
              </div>
              <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-[10px] font-mono text-zinc-400 mt-0.5 leading-tight">{s.reason}</p>
            </Link>
          ))}
        </ScrollRow>
      )}

      {brands.length > 0 && (
        <ScrollRow label="Brands">
          {brands.map(b => (
            <div key={b.brand} className="flex-shrink-0 w-36">
              <div className="aspect-square rounded overflow-hidden bg-zinc-100 mb-2">
                {b.imageFile ? (
                  <img src={`/api/brand-image/${encodeURIComponent(b.imageFile)}`} alt={b.brand} className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs font-mono text-center px-2">
                    {b.brand}
                  </div>
                )}
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <p className="text-xs font-mono font-semibold truncate">{b.brand}</p>
                {simBadge(b.similarity)}
              </div>
              <p className="text-[10px] font-mono text-zinc-400">{b.industry}</p>
              <p className="text-[10px] font-mono text-zinc-400 mt-0.5 leading-tight">{b.reason}</p>
            </div>
          ))}
        </ScrollRow>
      )}

      {artworks.length > 0 && (
        <ScrollRow label="Library Artworks">
          {artworks.map(a => (
            <div key={a.artworkId} className="flex-shrink-0 w-36">
              <div className="aspect-square rounded overflow-hidden bg-zinc-100 mb-2">
                {a.imageUrl ? (
                  <img src={a.imageUrl} alt={a.title ?? 'Artwork'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs font-mono">
                    no image
                  </div>
                )}
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <p className="text-xs font-mono truncate">{a.title ?? 'Untitled'}</p>
                {simBadge(a.similarity)}
              </div>
              <p className="text-[10px] font-mono text-zinc-400 mt-0.5 leading-tight">{a.reason}</p>
            </div>
          ))}
        </ScrollRow>
      )}
    </div>
  )
}
