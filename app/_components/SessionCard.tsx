import Link from 'next/link'

interface SessionCardProps {
  id: string
  title: string
  autoTitle: string
  createdAt: string
  thumbnailUrl?: string | null
}

export default function SessionCard({ id, title, autoTitle, createdAt, thumbnailUrl }: SessionCardProps) {
  const date = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  return (
    <Link href={`/session/${id}`} className="group block">
      <div className="aspect-video rounded overflow-hidden bg-zinc-100 mb-3">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs font-mono">
            no composition yet
          </div>
        )}
      </div>
      <p className="text-sm font-semibold font-mono group-hover:opacity-70 transition-opacity">{title}</p>
      {title !== autoTitle && (
        <p className="text-xs text-zinc-400 font-mono">{autoTitle}</p>
      )}
      <p className="text-xs text-zinc-400 font-mono mt-0.5">{date}</p>
    </Link>
  )
}
