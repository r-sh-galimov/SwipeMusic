import type { PlaybackCandidate, PlaybackResolution } from '../../../services/playbackResolver'
import { computeEffectiveScore } from './classify'
import type { DevDecisionItem, DevResolveDecision, RankedCandidate } from './types'
import type { PlaybackResolverConfig } from '../../../services/playbackResolver'

export function buildDecision(
  ranked: RankedCandidate[],
  resolution: PlaybackResolution | null,
  overrideId: string | null,
  config: PlaybackResolverConfig,
): DevResolveDecision {
  const items: DevDecisionItem[] = []

  for (const item of ranked) {
    if (item.selected) {
      items.push({
        kind: 'accepted',
        candidateId: item.id,
        reason: overrideId
          ? 'Dev force override'
          : 'Highest available priority',
      })
      continue
    }

    if (!item.available || !item.url) {
      items.push({
        kind: 'rejected',
        candidateId: item.id,
        reason:
          item.reason ??
          (item.requiresPremium ? 'Premium required' : 'Unavailable'),
      })
      continue
    }

    items.push({
      kind: 'skipped',
      candidateId: item.id,
      reason: `Lower effective priority (${item.effectiveScore})`,
    })
  }

  let summary: string
  if (!resolution) {
    summary =
      ranked.length === 0
        ? 'No resolution yet. Play a track or run Replay.'
        : 'No available candidate was selected.'
  } else if (overrideId && resolution.candidate.id === overrideId) {
    summary = `Selected ${resolution.candidate.id} because of Dev force override.`
  } else {
    summary = `Selected ${resolution.candidate.id} (effective score ${computeEffectiveScore(resolution.candidate, config)}).`
  }

  return {
    candidatesFound: ranked.length,
    items,
    summary,
  }
}

export function describeConfigFlags(config: PlaybackResolverConfig): {
  preferLocal: boolean
  preferPreview: boolean
  previewPriority: number
  streamPriority: number
  localPriority: number
  remotePriority: number
} {
  const local = config.typePriority.local
  const preview = config.typePriority.preview
  const stream = config.typePriority.stream
  const remote = config.typePriority.remote
  return {
    preferLocal: local >= Math.max(stream, remote, preview),
    preferPreview: preview > stream,
    previewPriority: preview,
    streamPriority: stream,
    localPriority: local,
    remotePriority: remote,
  }
}

export function uniqueProviderIds(candidates: PlaybackCandidate[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of candidates) {
    if (seen.has(item.providerId)) {
      continue
    }
    seen.add(item.providerId)
    result.push(item.providerId)
  }
  return result
}
