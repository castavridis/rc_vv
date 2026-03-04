'use client'

import { useState, useCallback, useRef } from 'react'
import {
  getGroupedSubjects,
  type DimensionGroup,
  type Subject,
} from '../../_lib/bflSubjects'
import { generateBflImage } from '../../_actions/generateBflImage'
import { saveBflImage } from '../../_actions/saveBflImage'

// ── Types ──

interface GenerationJob {
  id: string
  subject: string
  level: number
  iteration: number
  status: 'pending' | 'generating' | 'saving' | 'done' | 'error'
  dataUri?: string
  filePath?: string
  error?: string
}

const LEVELS = [0, 1, 2, 3, 4, 5] as const
const CONCURRENCY = 3
const groups: DimensionGroup[] = getGroupedSubjects()

// Collect all subjects from the hierarchy
function allSubjectsFromGroups(groups: DimensionGroup[]): Subject[] {
  const subjects: Subject[] = []
  for (const g of groups) {
    subjects.push(g.dimensionSubject)
    for (const f of g.facets) {
      if (f.facetSubject) subjects.push(f.facetSubject)
      subjects.push(...f.traits)
    }
  }
  return subjects
}

const allSubjects = allSubjectsFromGroups(groups)

// ── Component ──

export default function BflGenerator() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [iterations, setIterations] = useState(1)
  const [jobs, setJobs] = useState<GenerationJob[]>([])
  const [running, setRunning] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const abortRef = useRef(false)

  // ── Selection ──

  const toggle = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(allSubjects.map(s => s.name)))
  const selectNone = () => setSelected(new Set())

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // ── Generation queue ──

  const generate = useCallback(async () => {
    if (selected.size === 0) return
    abortRef.current = false
    setRunning(true)

    // Build job list
    const newJobs: GenerationJob[] = []
    for (const subject of selected) {
      for (const level of LEVELS) {
        for (let iter = 1; iter <= iterations; iter++) {
          newJobs.push({
            id: `${subject}-${level}-${iter}`,
            subject,
            level,
            iteration: iter,
            status: 'pending',
          })
        }
      }
    }

    setJobs(newJobs)

    // Process with concurrency limit
    let cursor = 0
    const jobsCopy = [...newJobs]

    async function processNext(): Promise<void> {
      while (cursor < jobsCopy.length) {
        if (abortRef.current) return
        const idx = cursor++
        const job = jobsCopy[idx]

        // Update status to generating
        setJobs(prev =>
          prev.map(j => (j.id === job.id ? { ...j, status: 'generating' } : j))
        )

        const result = await generateBflImage(job.subject, job.level)

        if (result.success && result.dataUri) {
          // Update with image, set saving
          setJobs(prev =>
            prev.map(j =>
              j.id === job.id
                ? { ...j, status: 'saving', dataUri: result.dataUri }
                : j
            )
          )

          const saveResult = await saveBflImage(
            job.subject,
            job.level,
            job.iteration,
            result.dataUri
          )

          setJobs(prev =>
            prev.map(j =>
              j.id === job.id
                ? {
                    ...j,
                    status: saveResult.success ? 'done' : 'error',
                    filePath: saveResult.filePath,
                    error: saveResult.error,
                  }
                : j
            )
          )
        } else {
          setJobs(prev =>
            prev.map(j =>
              j.id === job.id
                ? { ...j, status: 'error', error: result.error }
                : j
            )
          )
        }
      }
    }

    // Launch concurrent workers
    const workers = Array.from({ length: CONCURRENCY }, () => processNext())
    await Promise.all(workers)
    setRunning(false)
  }, [selected, iterations])

  const stop = () => {
    abortRef.current = true
  }

  // ── Retry single job ──

  const retry = useCallback(async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return

    setJobs(prev =>
      prev.map(j => (j.id === jobId ? { ...j, status: 'generating', error: undefined } : j))
    )

    const result = await generateBflImage(job.subject, job.level)

    if (result.success && result.dataUri) {
      setJobs(prev =>
        prev.map(j =>
          j.id === jobId ? { ...j, status: 'saving', dataUri: result.dataUri } : j
        )
      )

      const saveResult = await saveBflImage(
        job.subject,
        job.level,
        job.iteration,
        result.dataUri
      )

      setJobs(prev =>
        prev.map(j =>
          j.id === jobId
            ? {
                ...j,
                status: saveResult.success ? 'done' : 'error',
                filePath: saveResult.filePath,
                error: saveResult.error,
              }
            : j
        )
      )
    } else {
      setJobs(prev =>
        prev.map(j =>
          j.id === jobId ? { ...j, status: 'error', error: result.error } : j
        )
      )
    }
  }, [jobs])

  // ── Progress ──

  const done = jobs.filter(j => j.status === 'done').length
  const errored = jobs.filter(j => j.status === 'error').length
  const total = jobs.length

  // ── Group jobs by subject for the results grid ──

  const jobsBySubject = new Map<string, GenerationJob[]>()
  for (const job of jobs) {
    if (!jobsBySubject.has(job.subject)) jobsBySubject.set(job.subject, [])
    jobsBySubject.get(job.subject)!.push(job)
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      {/* ── Controls bar ── */}
      <div className="sticky top-0 z-10 bg-neutral-950/95 backdrop-blur border-b border-neutral-800 pb-4 mb-6 -mx-6 px-6 pt-2">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm">
            Iterations:
            <input
              type="range"
              min={1}
              max={5}
              value={iterations}
              onChange={e => setIterations(Number(e.target.value))}
              className="w-24"
            />
            <span className="font-mono w-4">{iterations}</span>
          </label>

          <button
            onClick={selectAll}
            className="px-3 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 rounded"
          >
            Select All
          </button>
          <button
            onClick={selectNone}
            className="px-3 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 rounded"
          >
            Select None
          </button>

          <button
            onClick={running ? stop : generate}
            disabled={!running && selected.size === 0}
            className={`px-4 py-1.5 text-sm font-medium rounded ${
              running
                ? 'bg-red-700 hover:bg-red-600'
                : 'bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {running ? 'Stop' : 'Generate'}
          </button>

          {total > 0 && (
            <span className="text-xs text-neutral-400 ml-auto">
              {done}/{total} done
              {errored > 0 && <span className="text-red-400 ml-2">{errored} errors</span>}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[300px_1fr] gap-6">
        {/* ── Subject selection ── */}
        <div className="space-y-1 max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
          {groups.map(g => {
            const dimKey = g.dimension
            const dimCollapsed = collapsed.has(dimKey)

            return (
              <div key={dimKey}>
                {/* Dimension header */}
                <div className="flex items-center gap-2 py-1">
                  <button
                    onClick={() => toggleCollapse(dimKey)}
                    className="text-xs text-neutral-500 w-4"
                  >
                    {dimCollapsed ? '▸' : '▾'}
                  </button>
                  <Checkbox
                    checked={selected.has(g.dimensionSubject.name)}
                    onChange={() => toggle(g.dimensionSubject.name)}
                  />
                  <span className="text-sm font-semibold text-blue-400">
                    {g.dimension}
                  </span>
                  <span className="text-[10px] text-neutral-600 uppercase">dim</span>
                </div>

                {!dimCollapsed &&
                  g.facets.map(f => {
                    const facetKey = `${dimKey}/${f.facet}`
                    const facetCollapsed = collapsed.has(facetKey)

                    return (
                      <div key={facetKey} className="ml-4">
                        {/* Facet header */}
                        <div className="flex items-center gap-2 py-0.5">
                          <button
                            onClick={() => toggleCollapse(facetKey)}
                            className="text-xs text-neutral-500 w-4"
                          >
                            {facetCollapsed ? '▸' : '▾'}
                          </button>
                          {f.facetSubject && (
                            <Checkbox
                              checked={selected.has(f.facetSubject.name)}
                              onChange={() => toggle(f.facetSubject!.name)}
                            />
                          )}
                          <span className="text-sm text-purple-400">
                            {f.facet}
                          </span>
                          <span className="text-[10px] text-neutral-600 uppercase">
                            facet
                          </span>
                        </div>

                        {/* Traits */}
                        {!facetCollapsed &&
                          f.traits.map(t => (
                            <div
                              key={t.name}
                              className="ml-6 flex items-center gap-2 py-0.5"
                            >
                              <Checkbox
                                checked={selected.has(t.name)}
                                onChange={() => toggle(t.name)}
                              />
                              <span className="text-sm text-neutral-300">
                                {t.name}
                              </span>
                            </div>
                          ))}
                      </div>
                    )
                  })}
              </div>
            )
          })}
        </div>

        {/* ── Results grid ── */}
        <div className="space-y-8 max-h-[calc(100vh-120px)] overflow-y-auto">
          {jobs.length === 0 && (
            <p className="text-neutral-600 text-sm">
              Select subjects and click Generate to start.
            </p>
          )}

          {[...jobsBySubject.entries()].map(([subject, subjectJobs]) => (
            <div key={subject}>
              <h3 className="text-sm font-semibold text-neutral-300 mb-2">
                {subject}
              </h3>
              <div className="grid grid-cols-6 gap-2">
                {LEVELS.map(level => {
                  const levelJobs = subjectJobs.filter(j => j.level === level)
                  return (
                    <div key={level} className="space-y-1">
                      <div className="text-[10px] text-neutral-500 text-center">
                        Level {level}
                      </div>
                      {levelJobs.map(j => (
                        <JobCell key={j.id} job={j} onRetry={() => retry(j.id)} />
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──

function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: () => void
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="accent-blue-500 w-3.5 h-3.5 cursor-pointer"
    />
  )
}

function JobCell({
  job,
  onRetry,
}: {
  job: GenerationJob
  onRetry: () => void
}) {
  if (job.status === 'pending') {
    return (
      <div className="aspect-square bg-neutral-900 rounded border border-neutral-800 flex items-center justify-center">
        <span className="text-[10px] text-neutral-600">queued</span>
      </div>
    )
  }

  if (job.status === 'generating' || job.status === 'saving') {
    return (
      <div className="aspect-square bg-neutral-900 rounded border border-neutral-800 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (job.status === 'error') {
    return (
      <div className="aspect-square bg-red-950/40 rounded border border-red-900 flex flex-col items-center justify-center gap-1 p-1">
        <span className="text-[9px] text-red-400 text-center line-clamp-3">
          {job.error}
        </span>
        <button
          onClick={onRetry}
          className="text-[10px] text-red-300 hover:text-red-100 underline"
        >
          retry
        </button>
      </div>
    )
  }

  // done
  return (
    <div className="aspect-square bg-neutral-900 rounded border border-neutral-800 overflow-hidden">
      {job.dataUri && (
        <img
          src={job.dataUri}
          alt={`${job.subject} level ${job.level}`}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  )
}
