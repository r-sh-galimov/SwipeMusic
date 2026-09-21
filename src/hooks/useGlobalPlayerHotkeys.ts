import { useEffect } from 'react'
import { useGlobalPlayerStore } from '../store/playerStore'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

/**
 * Горячие клавиши глобального плеера.
 * Space — play/pause; Ctrl+←/→ — prev/next; ↑/↓ — volume.
 */
export function useGlobalPlayerHotkeys(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return
      }

      const store = useGlobalPlayerStore.getState()

      if (event.code === 'Space') {
        event.preventDefault()
        if (!store.currentTrack) {
          return
        }
        if (store.playing) {
          store.pause()
        } else {
          void store.resume()
        }
        return
      }

      if (event.ctrlKey && event.key === 'ArrowRight') {
        event.preventDefault()
        void store.next()
        return
      }

      if (event.ctrlKey && event.key === 'ArrowLeft') {
        event.preventDefault()
        void store.previous()
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        store.setVolume(Math.min(1, store.volume + 0.05))
        if (store.muted) {
          store.setMuted(false)
        }
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        store.setVolume(Math.max(0, store.volume - 0.05))
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
