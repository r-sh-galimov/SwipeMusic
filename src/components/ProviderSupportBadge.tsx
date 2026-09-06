import type { ProviderSupportLevel } from '../sdk/types'

const LABELS: Record<ProviderSupportLevel, string> = {
  official: 'Official',
  experimental: 'Experimental',
  community: 'Community',
}

const BADGE_CLASS: Record<ProviderSupportLevel, string> = {
  official:
    'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
  experimental:
    'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30',
  community:
    'bg-sky-500/15 text-sky-900 dark:text-sky-200 border-sky-500/30',
}

type ProviderSupportBadgeProps = {
  level: ProviderSupportLevel
  description?: string
  className?: string
}

/**
 * Badge уровня поддержки — только из supportLevel манифеста.
 * Без привязки к имени провайдера.
 */
export function ProviderSupportBadge({
  level,
  description,
  className = '',
}: ProviderSupportBadgeProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <span
        className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${BADGE_CLASS[level]}`}
      >
        {LABELS[level]}
      </span>
      {description ? (
        <p className="text-xs text-[var(--color-muted)]">{description}</p>
      ) : null}
    </div>
  )
}
