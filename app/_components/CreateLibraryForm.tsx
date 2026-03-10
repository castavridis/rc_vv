'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createLibrary } from '../_actions/createLibrary'

export default function CreateLibraryForm({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setPending(true)
    await createLibrary(userId, name.trim())
    setName('')
    setOpen(false)
    setPending(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-mono px-3 py-1.5 border border-zinc-300 rounded hover:border-zinc-500 text-zinc-700"
      >
        + New Library
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        autoFocus
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Library name"
        className="text-sm font-mono px-2 py-1 border border-zinc-300 rounded w-40"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-mono px-3 py-1 bg-zinc-800 text-white rounded disabled:opacity-50"
      >
        {pending ? '...' : 'Create'}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setName(''); }}
        className="text-sm font-mono px-2 py-1 text-zinc-500"
      >
        Cancel
      </button>
    </form>
  )
}
