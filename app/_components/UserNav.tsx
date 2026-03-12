import { getUser } from '@/app/_lib/auth/session'
import { getUserDimensionScores } from '@/app/_lib/userTasteScores'
import D10Die from './D10Die'

export default async function UserNav() {
  const user = await getUser()

  if (!user) {
    return
  }

  const scores = await getUserDimensionScores(String(user.id))

  return (
    <div className="flex items-center gap-4">
      <D10Die scores={scores} size={36} autoRotate />
      <span className="text-zinc-700">
        {user.name}
      </span>
      <a
        href="/api/auth/logout"
        className="rounded-md border-2 border-zinc-200 py-1.5 px-3 font-medium hover:bg-zinc-100 transition-colors"
      >
        Logout
      </a>
    </div>
  )
}
