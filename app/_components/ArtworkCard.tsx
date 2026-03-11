import Link from 'next/link'
import ArtworkActions from './ArtworkActions'

interface ArtworkCardProps {
  id: string
  title: string
  artist?: string | null
  year?: number | null
  imageUrl: string
  medium?: string | null
  tags?: string[]
  rated: boolean
  userId?: string
  libraries?: { id: string; name: string }[]
  currentLibraryId?: string | null
}

export default function ArtworkCard({ id, title, artist, year, imageUrl, medium, tags, rated, userId, libraries, currentLibraryId }: ArtworkCardProps) {
  return (
    <div>
      <Link href={`/library/${id}`} className="group block">
        <div className="relative aspect-square overflow-hidden rounded bg-zinc-100">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
          />
          <div className={`absolute top-2 right-2 text-xs font-mono px-2 py-0.5 rounded-full ${
            rated
              ? 'bg-green-500 text-white'
              : 'bg-zinc-800/70 text-zinc-300'
          }`}>
            {rated ? 'rated' : 'unrated'}
          </div>
        </div>
        <div className="mt-2">
          <p className="text-sm font-medium truncate">{title}</p>
          {(artist || year) && (
            <p className="text-xs text-zinc-500 truncate">
              {[artist, year].filter(Boolean).join(' · ')}
            </p>
          )}
          {medium && (
            <p className="text-xs text-zinc-400 truncate">{medium}</p>
          )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs font-mono bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
      {userId && libraries && (
        <ArtworkActions
          artworkId={id}
          userId={userId}
          libraries={libraries}
          currentLibraryId={currentLibraryId}
        />
      )}
    </div>
  )
}
