import type { PlaybackCandidate } from '../services/playbackResolver'
import type { Track } from './track'

/**
 * Состояние плеера для UI / store.
 * React читает только это — без доступа к HTMLAudioElement.
 */
export type PlayerState = {
  /**
   * Трек, который реально загружен в playback backend.
   * Не обновляется до успешного load нового трека.
   */
  currentTrack: Track | null
  /**
   * Трек, который пользователь запросил (switch in flight).
   * null — переключения нет.
   */
  pendingTrack: Track | null
  /** Последний выбранный PlaybackResolver candidate (plugin-first). */
  activeCandidate: PlaybackCandidate | null
  playing: boolean
  paused: boolean
  buffering: boolean
  loading: boolean
  currentTime: number
  duration: number
  /** 0..1 */
  progress: number
  volume: number
  muted: boolean
  /** Скорость воспроизведения (1 = нормальная). */
  playbackRate: number
  queue: Track[]
  queueIndex: number
  error: string | null
}

export const initialPlayerState: PlayerState = {
  currentTrack: null,
  pendingTrack: null,
  activeCandidate: null,
  playing: false,
  paused: false,
  buffering: false,
  loading: false,
  currentTime: 0,
  duration: 0,
  progress: 0,
  volume: 1,
  muted: false,
  playbackRate: 1,
  queue: [],
  queueIndex: -1,
  error: null,
}

export function computeProgress(currentTime: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0
  }
  return Math.min(1, Math.max(0, currentTime / duration))
}
