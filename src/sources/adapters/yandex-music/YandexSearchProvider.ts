import type { SearchProvider } from '../../../sdk/types'
import { getYandexMusicAdapter } from './YandexMusicAdapter'

export function createYandexSearchProvider(): SearchProvider {
  return {
    async search(query, signal) {
      const result = await getYandexMusicAdapter().search(query, { signal })
      return result.tracks
    },
  }
}
