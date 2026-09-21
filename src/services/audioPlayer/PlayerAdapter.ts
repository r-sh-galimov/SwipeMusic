export type PlayerAdapterEventType =
  | 'play'
  | 'pause'
  | 'stop'
  | 'ended'
  | 'timeupdate'
  | 'loadedmetadata'
  | 'error'
  | 'volumechange'
  | 'waiting'
  | 'canplay'
  | 'loadstart'
  | 'ratechange'

export type PlayerAdapterEvent = {
  type: PlayerAdapterEventType
  currentTime: number
  duration: number
  volume: number
  muted?: boolean
  playbackRate?: number
  error?: string
}

/**
 * Низкоуровневый адаптер воспроизведения.
 * HTMLAudioElement, Spotify Web Playback SDK и др. — взаимозаменяемы.
 */
export interface PlayerAdapter {
  load(url: string): Promise<void>
  play(): Promise<void>
  /** Может быть async (например Spotify Web Playback SDK). */
  pause(): void | Promise<void>
  stop(): void
  seek(timeSeconds: number): void
  setVolume(volume: number): void
  setMuted(muted: boolean): void
  setPlaybackRate(rate: number): void
  getCurrentTime(): number
  getDuration(): number
  getVolume(): number
  getMuted(): boolean
  getPlaybackRate(): number
  isPlaying(): boolean
  subscribe(listener: (event: PlayerAdapterEvent) => void): () => void
  dispose(): void
}
