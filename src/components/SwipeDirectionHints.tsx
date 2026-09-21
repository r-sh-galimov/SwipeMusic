import { gestureActionLabels } from '../config/gestureConfig'
import type { GestureConfig, SwipeDirection } from '../types/gesture'
import type { SwipeAction } from '../types/swipe'

type SwipeDirectionHintsProps = {
  gestureConfig: GestureConfig
  /** Dominant direction во время drag (null = нет активного жеста). */
  activeDirection: SwipeDirection | null
  /** 0–1 visual progress к commit threshold. */
  progress: number
}

const DIRECTION_ORDER: SwipeDirection[] = ['up', 'left', 'right', 'down']

/** Боковые hints строго в gutter (не заходят под карточку). */
const positionClass: Record<SwipeDirection, string> = {
  up: 'left-1/2 top-0 -translate-x-1/2 text-center',
  down: 'bottom-0 left-1/2 -translate-x-1/2 text-center',
  left: 'left-0 top-1/2 w-[4.5rem] -translate-y-1/2 text-center',
  right: 'right-0 top-1/2 w-[4.5rem] -translate-y-1/2 text-center',
}

const arrowPrefix: Record<SwipeDirection, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
}

const accentByAction: Record<SwipeAction, string> = {
  categorize: 'text-teal-600 dark:text-teal-400',
  like: 'text-rose-600 dark:text-rose-400',
  skip: 'text-sky-600 dark:text-sky-400',
  previous: 'text-amber-600 dark:text-amber-400',
}

/**
 * Постоянные подсказки направлений вокруг колоды.
 * Не кнопки — только direction hints.
 */
export function SwipeDirectionHints({
  gestureConfig,
  activeDirection,
  progress,
}: SwipeDirectionHintsProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0"
      aria-hidden={false}
      aria-label="Значения направлений свайпа"
    >
      {DIRECTION_ORDER.map((direction) => {
        const action = gestureConfig[direction]
        const label = gestureActionLabels[action]
        const isActive = activeDirection === direction
        const ready = isActive && progress >= 1
        const opacity = isActive
          ? 0.4 + Math.min(progress, 1) * 0.6
          : 0.45

        return (
          <div
            key={direction}
            className={`absolute px-0.5 ${positionClass[direction]}`}
            style={{ opacity }}
          >
            <p
              className={[
                'text-[10px] font-medium leading-tight tracking-wide sm:text-[11px]',
                isActive
                  ? accentByAction[action]
                  : 'text-[var(--color-muted)]',
                ready ? 'scale-105 font-semibold' : '',
              ].join(' ')}
            >
              <span className="block text-[12px] leading-none opacity-80 sm:text-[13px]">
                {arrowPrefix[direction]}
              </span>
              <span className="mt-0.5 block break-words hyphens-auto">
                {label}
              </span>
            </p>
          </div>
        )
      })}
    </div>
  )
}
