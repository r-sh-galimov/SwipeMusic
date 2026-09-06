/**
 * Dev-only журнал Яндекс Музыки (experimental / internal API).
 */

export type YandexDevLogStage =
  | 'register'
  | 'auth'
  | 'search'
  | 'library'
  | 'candidate'
  | 'request'
  | 'http'
  | 'error'

export type YandexDevLogEntry = {
  id: string
  at: number
  stage: YandexDevLogStage
  message: string
  detail?: string
}

type Listener = (entries: YandexDevLogEntry[]) => void

const MAX_ENTRIES = 200
let entries: YandexDevLogEntry[] = []
const listeners = new Set<Listener>()
let seq = 0

function notify(): void {
  const snapshot = [...entries]
  for (const listener of listeners) {
    listener(snapshot)
  }
}

export function pushYandexDevLog(
  input: Omit<YandexDevLogEntry, 'id' | 'at'> & { at?: number },
): void {
  if (!import.meta.env.DEV) {
    return
  }
  seq += 1
  entries = [
    ...entries,
    {
      id: `yandex-log-${seq}`,
      at: input.at ?? performance.now(),
      stage: input.stage,
      message: input.message,
      detail: input.detail,
    },
  ].slice(-MAX_ENTRIES)
  notify()
}

export function getYandexDevLog(): YandexDevLogEntry[] {
  return [...entries]
}

export function clearYandexDevLog(): void {
  if (!import.meta.env.DEV) {
    return
  }
  entries = []
  notify()
}

export function subscribeYandexDevLog(listener: Listener): () => void {
  listeners.add(listener)
  listener(getYandexDevLog())
  return () => {
    listeners.delete(listener)
  }
}
