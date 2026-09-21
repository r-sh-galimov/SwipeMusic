import { useEffect, useState } from 'react'
import {
  clearDevSearchLog,
  getDevSearchLog,
  subscribeDevSearchLog,
  type DevSearchLogEntry,
  type DevSearchLogStage,
} from '../services/searchEngine/devSearchLog'

const STAGE_COLOR: Record<DevSearchLogStage, string> = {
  started: 'text-sky-700 dark:text-sky-300',
  provider: 'text-[var(--color-fg)]',
  request: 'text-violet-700 dark:text-violet-300',
  http: 'text-emerald-700 dark:text-emerald-300',
  tracks: 'text-emerald-700 dark:text-emerald-300',
  mapped: 'text-emerald-700 dark:text-emerald-300',
  merged: 'text-[var(--color-fg)]',
  ui: 'text-[var(--color-fg)]',
  skip: 'text-amber-800 dark:text-amber-200',
  error: 'text-rose-700 dark:text-rose-300',
}

function formatEntry(entry: DevSearchLogEntry): string {
  const prefix = entry.providerId ? `[${entry.providerId}] ` : ''
  const detail = entry.detail ? ` · ${entry.detail}` : ''
  return `${prefix}${entry.message}${detail}`
}

/** Dev-only журнал шагов поиска. */
export function DevSearchLogPanel() {
  const [entries, setEntries] = useState<DevSearchLogEntry[]>(() =>
    getDevSearchLog(),
  )

  useEffect(() => subscribeDevSearchLog(setEntries), [])

  if (!import.meta.env.DEV) {
    return null
  }

  return (
    <section className="space-y-2 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-[var(--color-fg)]">Dev · Search Log</p>
        <button
          type="button"
          className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-[var(--color-muted)]"
          onClick={() => clearDevSearchLog()}
        >
          Clear
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="text-[var(--color-muted)]">
          Выполните поиск, чтобы увидеть шаги пайплайна.
        </p>
      ) : (
        <ol className="space-y-1.5 font-mono">
          {entries.map((entry, index) => (
            <li key={entry.id} className={STAGE_COLOR[entry.stage]}>
              {index > 0 ? <span className="text-[var(--color-muted)]">↓ </span> : null}
              {formatEntry(entry)}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
