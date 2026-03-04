'use client'

import { useState, useRef } from 'react'
import { updateSessionTitle } from '../_actions/updateSessionTitle'

interface SessionTitleProps {
  sessionId: string
  title: string
  autoTitle: string
}

export default function SessionTitle({ sessionId, title, autoTitle }: SessionTitleProps) {
  const [value, setValue] = useState(title)
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  async function commit() {
    setEditing(false)
    const trimmed = value.trim() || autoTitle
    setValue(trimmed)
    await updateSessionTitle(sessionId, trimmed)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') { setValue(title); setEditing(false) }
  }

  return (
    <div>
      {editing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          autoFocus
          className="text-2xl font-bold font-mono bg-transparent border-b border-zinc-400 outline-none w-full"
        />
      ) : (
        <h1
          className="text-2xl font-bold font-mono cursor-text hover:opacity-70 transition-opacity"
          onClick={startEdit}
          title="Click to rename"
        >
          {value}
        </h1>
      )}
      {value !== autoTitle && (
        <p className="text-xs font-mono text-zinc-400 mt-0.5">{autoTitle}</p>
      )}
    </div>
  )
}
