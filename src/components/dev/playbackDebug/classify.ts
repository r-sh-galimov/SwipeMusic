import type {
  PlaybackCandidate,
  PlaybackResolverConfig,
} from '../../../services/playbackResolver'
import type { CandidateVisualKind, RankedCandidate } from './types'

export function computeEffectiveScore(
  candidate: PlaybackCandidate,
  config: PlaybackResolverConfig,
): number {
  const typeScore = config.typePriority[candidate.type] ?? 0
  const boost = config.providerBoost[candidate.providerId] ?? 0
  return candidate.priority + typeScore + boost
}

/**
 * Визуальный класс только из полей PlaybackCandidate + selected.
 * Без привязки к конкретным providerId.
 */
export function classifyCandidate(
  candidate: PlaybackCandidate,
  selected: boolean,
): CandidateVisualKind {
  if (selected) {
    return 'selected'
  }
  if (candidate.available && candidate.url) {
    if (candidate.type === 'preview') {
      return 'fallback'
    }
    return 'available'
  }
  if (!candidate.available) {
    return 'rejected'
  }
  return 'skipped'
}

export function buildRankedList(
  candidates: PlaybackCandidate[],
  selectedId: string | null,
  config: PlaybackResolverConfig,
): RankedCandidate[] {
  return [...candidates]
    .map((candidate) => {
      const selected = selectedId === candidate.id
      return {
        ...candidate,
        effectiveScore: computeEffectiveScore(candidate, config),
        selected,
        visualKind: classifyCandidate(candidate, selected),
      }
    })
    .sort((a, b) => b.effectiveScore - a.effectiveScore)
}

export const VISUAL_STYLES: Record<
  CandidateVisualKind,
  { border: string; badge: string; label: string }
> = {
  selected: {
    border: 'border-emerald-500/70',
    badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    label: 'Selected',
  },
  available: {
    border: 'border-sky-500/70',
    badge: 'bg-sky-500/20 text-sky-700 dark:text-sky-300',
    label: 'Available',
  },
  fallback: {
    border: 'border-amber-500/70',
    badge: 'bg-amber-500/20 text-amber-800 dark:text-amber-200',
    label: 'Fallback',
  },
  rejected: {
    border: 'border-rose-500/70',
    badge: 'bg-rose-500/20 text-rose-700 dark:text-rose-300',
    label: 'Rejected',
  },
  skipped: {
    border: 'border-zinc-400/60',
    badge: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300',
    label: 'Skipped',
  },
}
