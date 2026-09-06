import type {
  PlaybackCandidate,
  PlaybackResolution,
  PlaybackResolverConfig,
} from '../../../services/playbackResolver'

export type CandidateVisualKind =
  | 'selected'
  | 'available'
  | 'fallback'
  | 'rejected'
  | 'skipped'

export type DevTimelineEvent = {
  ms: number
  label: string
}

export type DevProviderTiming = {
  providerId: string
  ms: number
}

export type DevResolveTimings = {
  resolveMs: number
  providers: DevProviderTiming[]
  sortingMs: number
  decisionMs: number
}

export type DevDecisionItem = {
  kind: 'rejected' | 'accepted' | 'skipped'
  candidateId: string
  reason: string
}

export type DevResolveDecision = {
  candidatesFound: number
  items: DevDecisionItem[]
  summary: string
}

export type DevResolveTrace = {
  trackId: string
  timeline: DevTimelineEvent[]
  timings: DevResolveTimings
  resolution: PlaybackResolution | null
  candidates: PlaybackCandidate[]
  config: PlaybackResolverConfig
  decision: DevResolveDecision
  overrideId: string | null
  error: string | null
}

export type RankedCandidate = PlaybackCandidate & {
  effectiveScore: number
  selected: boolean
  visualKind: CandidateVisualKind
}

export type CandidateFilter =
  | 'available'
  | 'rejected'
  | 'selected'
  | 'preview'
  | 'stream'
  | 'local'
  | 'remote'
  | `provider:${string}`

export type DevResolverReport = {
  track: { id: string } | null
  selected: {
    id: string
    providerId: string
    type: string
    url: string
    label: string | null
  } | null
  resolverConfig: PlaybackResolverConfig
  timings: DevResolveTimings | null
  candidates: Array<{
    rank: number
    id: string
    providerId: string
    type: string
    priority: number
    effectiveScore: number
    available: boolean
    selected: boolean
    requiresPremium: boolean
    reason: string | null
    label: string | null
    url: string | null
    visualKind: CandidateVisualKind
  }>
  decision: DevResolveDecision
  timeline: DevTimelineEvent[]
  override: string | null
}
