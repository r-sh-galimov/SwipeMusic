import { useEffect, useState } from 'react'
import {
  clearYandexDevLog,
  getYandexDevLog,
  subscribeYandexDevLog,
  type YandexDevLogEntry,
  type YandexDevLogStage,
} from '../sources/adapters/yandex-music'

const STAGE_COLOR: Record<YandexDevLogStage, string> = {
  register: 'text-sky-700 dark:text-sky-300',
  auth: 'text-[var(--color-fg)]',
  search: 'text-violet-700 dark:text-violet-300',
  library: 'text-emerald-700 dark:text-emerald-300',
  candidate: 'text-amber-800 dark:text-amber-200',
  request: 'text-violet-700 dark:text-violet-300',
  http: 'text-emerald-700 dark:text-emerald-300',
  error: 'text-rose-700 dark:text-rose-300',
}

/** Dev-only журнал experimental-провайдера Яндекс Музыки. */
export function DevYandexLogPanel() {
  const [entries, setEntries] = useState<YandexDevLogEntry[]>(() =>
    getYandexDevLog(),
  )

  useEffect(() => subscribeYandexDevLog(setEntries), [])

  if (!import.meta.env.DEV) {
    return null
  }

  return (
    <section className="space-y-2 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-[var(--color-fg)]">
          Dev · Yandex Music Log
        </p>
        <button
          type="button"
          className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-[var(--color-muted)]"
          onClick={() => clearYandexDevLog()}
        >
          Clear
        </button>
      </div>
      <p className="text-[var(--color-muted)]">
        Experimental · internal API (auth / search / library / candidates)
      </p>
      {entries.length === 0 ? (
        <p className="text-[var(--color-muted)]">
          Connect / Search / Sync, чтобы увидеть шаги.
        </p>
      ) : (
        <ol className="space-y-1 font-mono">
          {entries.map((entry) => (
            <li key={entry.id} className={STAGE_COLOR[entry.stage]}>
              [{entry.stage}] {entry.message}
              {entry.detail ? (
                <span className="text-[var(--color-muted)]">
                  {' '}
                  · {entry.detail}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
