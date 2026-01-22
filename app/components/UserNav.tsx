import { getUser } from '@/app/lib/auth/session'
// import LoginButton from './LoginButton'

export default async function UserNav() {
  const user = await getUser()

  if (!user) {
    return 
    // (
      // <LoginButton />
    // )
  }

  return (
    <div className="flex items-center gap-4">
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
