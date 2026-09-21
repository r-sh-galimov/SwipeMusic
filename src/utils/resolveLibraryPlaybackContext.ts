import type { LibraryNode } from '../types/libraryProvider'
import type { PlaybackContext } from '../types/playbackContext'
import type { Track } from '../types/track'

/**
 * Контекст воспроизведения при запуске из Library по выбранному узлу дерева.
 */
export function resolveLibraryPlaybackContext(options: {
  breadcrumb: LibraryNode[]
  selectedNodeId: string | null
  searchQuery?: string
  fromSearch?: boolean
  sampleTrack?: Track | null
}): PlaybackContext {
  const { breadcrumb, selectedNodeId, searchQuery, fromSearch, sampleTrack } =
    options

  if (fromSearch && searchQuery?.trim()) {
    return { type: 'search', query: searchQuery.trim() }
  }

  const node =
    breadcrumb.find((item) => item.id === selectedNodeId) ??
    breadcrumb[breadcrumb.length - 1]

  if (!node) {
    return { type: 'library' }
  }

  if (node.type === 'album') {
    const artist = sampleTrack?.artist?.trim()
    return {
      type: 'album',
      id: node.id,
      title: node.title,
      ...(artist ? { artist } : {}),
    }
  }

  if (node.type === 'playlist') {
    return {
      type: 'playlist',
      id: node.id,
      title: node.title,
    }
  }

  return { type: 'library' }
}
