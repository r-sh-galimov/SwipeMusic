import { useCollectionEngineStore } from '../../store/collectionEngineStore'
import { useCollectionStore } from '../../store/collectionStore'
import type { SwipeAction } from '../../types/swipe'
import type { Track } from '../../types/track'

export type ClassifySwipeResult =
  | { kind: 'applied'; action: SwipeAction }
  | { kind: 'needsCategory'; action: 'categorize' }

/**
 * Единый semantic handler классификации свайпа.
 * Не трогает playback / queue / context.
 * Семантика действий — как до разделения Swipe/Playback.
 */
export function classifySwipeTrack(
  track: Track,
  action: SwipeAction,
): ClassifySwipeResult {
  const collection = useCollectionStore.getState()
  const engine = useCollectionEngineStore.getState()

  collection.pushViewedTrack(track.id)

  switch (action) {
    case 'like':
      collection.likeTrack(track.id)
      collection.recordHistory({ track, action: 'like' })
      engine.setLiked(track.id, true, track)
      return { kind: 'applied', action }

    case 'skip':
      // «Дальше» / skip classification — не playback Skip.
      collection.recordHistory({ track, action: 'skip' })
      engine.markSkipped(track.id, track)
      return { kind: 'applied', action }

    case 'categorize':
      return { kind: 'needsCategory', action: 'categorize' }

    case 'previous':
      collection.recordHistory({ track, action: 'previous' })
      return { kind: 'applied', action }

    default: {
      const _exhaustive: never = action
      void _exhaustive
      return { kind: 'applied', action }
    }
  }
}
