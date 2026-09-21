import { ScraperMusicAdapter } from '../ScraperMusicAdapter'
import type { MusicSourceAdapter } from '../../MusicSourceAdapter'
import type { Track } from '../../../types/track'
import type { HtmlFetcher } from '../../scraping'

/**
 * Заготовка адаптера Zaycev.net.
 * Без реального парсинга / cheerio / сетевых запросов к сайту.
 */
export class ZaycevAdapter extends ScraperMusicAdapter {
  readonly id = 'zaycev'
  readonly label = 'Zaycev.net'

  constructor(fetcher?: HtmlFetcher) {
    super(fetcher)
  }

  protected buildSearchUrl(query: string): string {
    return `https://zaycev.example/search?q=${encodeURIComponent(query)}`
  }

  protected buildTrackUrl(trackId: string): string {
    return `https://zaycev.example/track/${encodeURIComponent(trackId)}`
  }

  protected parseSearch(_html: string, _query: string): Track[] {
    return []
  }

  protected parseTrack(_html: string, _trackId: string): Track | null {
    return null
  }

  protected parseStream(_html: string, _track: Track): string {
    throw new Error('[zaycev] parseStream is not implemented')
  }

  protected parseCover(_html: string, _track: Track): string | undefined {
    return undefined
  }
}

export function createZaycevAdapter(): MusicSourceAdapter {
  return new ZaycevAdapter()
}
