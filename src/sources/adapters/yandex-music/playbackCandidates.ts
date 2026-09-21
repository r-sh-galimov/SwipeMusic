import type { PlaybackCandidate } from '../../../services/playbackResolver'
import type { Track } from '../../../types/track'
import type { YandexMusicApiClient } from './api'
import { pushYandexDevLog } from './devLog'

export async function buildYandexPlaybackCandidates(
  track: Track,
  options: {
    api: YandexMusicApiClient | null
    authenticated: boolean
    hasPlus: boolean
  },
): Promise<PlaybackCandidate[]> {
  const candidates: PlaybackCandidate[] = []

  if (!options.authenticated || !options.api) {
    candidates.push({
      id: 'yandex-music:stream',
      providerId: 'yandex-music',
      type: 'stream',
      priority: 0,
      available: false,
      reason: 'Требуется вход в Яндекс Музыку',
      url: null,
    })
    pushYandexDevLog({
      stage: 'candidate',
      message: 'candidates without auth',
      detail: track.id,
    })
    return candidates
  }

  let streamUrl: string | null = null
  let streamError: string | null = null
  try {
    streamUrl = await options.api.resolveDirectStreamUrl(track.externalId)
  } catch (error) {
    streamError = error instanceof Error ? error.message : String(error)
  }

  const streamAvailable = Boolean(streamUrl)
  candidates.push({
    id: 'yandex-music:stream',
    providerId: 'yandex-music',
    type: 'stream',
    priority: 80,
    available: streamAvailable,
    requiresPremium: !options.hasPlus && !streamAvailable,
    reason: streamAvailable
      ? 'Yandex Music stream'
      : streamError ??
        (options.hasPlus
          ? 'Stream URL недоступен'
          : 'Полный трек может требовать подписку Яндекс Плюс'),
    url: streamUrl,
    label: 'Full track',
  })

  if (track.previewUrl) {
    candidates.push({
      id: 'yandex-music:preview',
      providerId: 'yandex-music',
      type: 'preview',
      priority: 20,
      available: true,
      url: track.previewUrl,
      label: 'Preview',
      reason: 'preview available',
    })
  } else {
    candidates.push({
      id: 'yandex-music:preview',
      providerId: 'yandex-music',
      type: 'preview',
      priority: 20,
      available: false,
      url: null,
      reason: 'Preview URL отсутствует',
    })
  }

  pushYandexDevLog({
    stage: 'candidate',
    message: 'PlaybackCandidate built',
    detail: `track=${track.id}; stream=${streamAvailable}; preview=${Boolean(track.previewUrl)}`,
  })

  return candidates
}
