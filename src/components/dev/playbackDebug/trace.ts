import {
  getPlaybackResolver,
} from '../../../services/playbackResolver'
import { bootstrapMusicSources, sourceRegistry } from '../../../sources'
import type { Track } from '../../../types/track'
import { buildRankedList } from './classify'
import { buildDecision, uniqueProviderIds } from './decision'
import type {
  DevProviderTiming,
  DevResolveTrace,
  DevTimelineEvent,
} from './types'

function roundMs(value: number): number {
  return Math.round(value * 10) / 10
}

async function probeProvider(
  providerId: string,
  track: Track,
): Promise<number> {
  if (!sourceRegistry.has(providerId)) {
    return 0
  }
  const adapter = sourceRegistry.get(providerId)
  if (typeof adapter.getPlaybackCandidates !== 'function') {
    return 0
  }
  const started = performance.now()
  try {
    await adapter.getPlaybackCandidates(track)
  } catch {
    // Dev probe: ошибки провайдера не прерывают трассировку.
  }
  return performance.now() - started
}

/**
 * Dev-only: resolve без Player + timeline/timings через performance.now().
 * Источник истины выбора — PlaybackResolver.resolve(); probe провайдеров
 * только для измерений (не меняет логику Resolver).
 */
export async function runDevResolveTrace(track: Track): Promise<DevResolveTrace> {
  const t0 = performance.now()
  const timeline: DevTimelineEvent[] = []
  const push = (label: string) => {
    timeline.push({ ms: roundMs(performance.now() - t0), label })
  }

  push('Start resolving')

  bootstrapMusicSources()
  const resolver = getPlaybackResolver()
  const overrideId = resolver.getDevOverride()?.candidateId ?? null

  const resolveStarted = performance.now()
  let resolution = null
  let error: string | null = null
  try {
    resolution = await resolver.resolve(track)
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
    resolution = null
  }
  const resolveMs = performance.now() - resolveStarted

  const candidates = resolver.getLastCandidates()
  const config = resolver.getConfig()

  const fromCandidates = uniqueProviderIds(candidates)
  const providerIds = fromCandidates.length > 0 ? fromCandidates : [track.sourceId]

  const providers: DevProviderTiming[] = []
  for (const providerId of providerIds) {
    push(`${providerId}.getPlaybackCandidates()`)
    const ms = await probeProvider(providerId, track)
    providers.push({ providerId, ms: roundMs(ms) })
  }

  push('Candidates collected')

  const sortStarted = performance.now()
  const ranked = buildRankedList(
    candidates,
    resolution?.candidate.id ?? null,
    config,
  )
  const sortingMs = performance.now() - sortStarted
  push('Sorted by effective priority')

  const decisionStarted = performance.now()
  const decision = buildDecision(ranked, resolution, overrideId, config)
  const decisionMs = performance.now() - decisionStarted

  if (resolution) {
    push(`Selected:\n${resolution.candidate.id}`)
  } else {
    push('Selected:\n(none)')
  }

  return {
    trackId: track.id,
    timeline,
    timings: {
      resolveMs: roundMs(resolveMs),
      providers,
      sortingMs: roundMs(sortingMs),
      decisionMs: roundMs(decisionMs),
    },
    resolution,
    candidates,
    config,
    decision,
    overrideId,
    error,
  }
}
