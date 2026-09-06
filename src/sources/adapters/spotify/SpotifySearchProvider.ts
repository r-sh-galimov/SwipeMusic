import type { SearchProvider } from '../../../sdk/types'
import { getSpotifyAdapter } from './SpotifyAdapter'

/** SDK SearchProvider для Spotify — делегирует в MusicSourceAdapter.search(). */
export function createSpotifySearchProvider(): SearchProvider {
  return {
    async search(query, signal) {
      const result = await getSpotifyAdapter().search(query, { signal })
      return result.tracks
    },
  }
}
