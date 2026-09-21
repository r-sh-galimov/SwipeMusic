import type {
  PlaybackResolution,
  PlaybackResolverConfig,
} from '../../../services/playbackResolver'
import type {
  DevResolveDecision,
  DevResolveTimings,
  DevResolverReport,
  DevTimelineEvent,
  RankedCandidate,
} from './types'

export function buildResolverReport(input: {
  resolution: PlaybackResolution | null
  ranked: RankedCandidate[]
  config: PlaybackResolverConfig
  decision: DevResolveDecision
  timings: DevResolveTimings | null
  timeline: DevTimelineEvent[]
  overrideId: string
  trackId: string | null
}): DevResolverReport {
  const { resolution, ranked, config, decision, timings, timeline, overrideId, trackId } =
    input

  return {
    track: trackId ? { id: trackId } : null,
    selected: resolution
      ? {
          id: resolution.candidate.id,
          providerId: resolution.candidate.providerId,
          type: resolution.candidate.type,
          url: resolution.url,
          label: resolution.candidate.label ?? null,
        }
      : null,
    resolverConfig: config,
    timings,
    candidates: ranked.map((item, index) => ({
      rank: index + 1,
      id: item.id,
      providerId: item.providerId,
      type: item.type,
      priority: item.priority,
      effectiveScore: item.effectiveScore,
      available: item.available,
      selected: item.selected,
      requiresPremium: item.requiresPremium ?? false,
      reason: item.reason ?? null,
      label: item.label ?? null,
      url: item.url ?? null,
      visualKind: item.visualKind,
    })),
    decision,
    timeline,
    override: overrideId || null,
  }
}

export function downloadResolverReport(report: DevResolverReport): void {
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'resolver-report.json'
  anchor.click()
  URL.revokeObjectURL(url)
}
