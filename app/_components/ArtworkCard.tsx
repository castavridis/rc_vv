import Link from 'next/link'

interface ArtworkCardProps {
  id: string
  title: string
  artist?: string | null
  year?: number | null
  imageUrl: string
  rated: boolean
}

export default function ArtworkCard({ id, title, artist, year, imageUrl, rated }: ArtworkCardProps) {
  return (
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
      </div>
    </Link>
  )
}
