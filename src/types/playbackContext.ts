/**
 * Источник текущей очереди / воспроизведения.
 * Не дублирует currentTrack — только provenance queue.
 */
export type PlaybackContext =
  | {
      type: 'album'
      id: string
      title: string
      artist?: string
    }
  | {
      type: 'playlist'
      id: string
      title: string
    }
  | {
      type: 'search'
      query: string
    }
  | {
      type: 'swipe'
    }
  | {
      type: 'library'
    }
  | {
      type: 'none'
    }

export const NONE_PLAYBACK_CONTEXT: PlaybackContext = { type: 'none' }

/** Album/Playlist: Home/Swipe не должен молча перезаписывать очередь. */
export function isQueueLockedContext(context: PlaybackContext): boolean {
  return context.type === 'album' || context.type === 'playlist'
}

export function parsePlaybackContext(value: unknown): PlaybackContext {
  if (!value || typeof value !== 'object') {
    return NONE_PLAYBACK_CONTEXT
  }
  const record = value as Record<string, unknown>
  const type = record.type
  switch (type) {
    case 'album': {
      if (typeof record.id !== 'string' || typeof record.title !== 'string') {
        return NONE_PLAYBACK_CONTEXT
      }
      return {
        type: 'album',
        id: record.id,
        title: record.title,
        ...(typeof record.artist === 'string' ? { artist: record.artist } : {}),
      }
    }
    case 'playlist': {
      if (typeof record.id !== 'string' || typeof record.title !== 'string') {
        return NONE_PLAYBACK_CONTEXT
      }
      return { type: 'playlist', id: record.id, title: record.title }
    }
    case 'search': {
      if (typeof record.query !== 'string') {
        return NONE_PLAYBACK_CONTEXT
      }
      return { type: 'search', query: record.query }
    }
    case 'swipe':
      return { type: 'swipe' }
    case 'library':
      return { type: 'library' }
    case 'none':
      return NONE_PLAYBACK_CONTEXT
    default:
      return NONE_PLAYBACK_CONTEXT
  }
}
