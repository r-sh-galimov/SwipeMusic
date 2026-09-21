type AlbumModeBannerProps = {
  title: string
  artist?: string
  onExit: () => void
}

/**
 * Компактный индикатор Album Mode на Home/Swipe.
 */
export function AlbumModeBanner({
  title,
  artist,
  onExit,
}: AlbumModeBannerProps) {
  const subtitle = artist ? `${artist} — ${title}` : title

  return (
    <div
      className="mx-1 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 sm:px-4"
      role="status"
      aria-live="polite"
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Режим: Альбом
        </p>
        <p className="truncate text-sm font-semibold text-[var(--color-fg)]">
          {subtitle}
        </p>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-fg)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        onClick={onExit}
      >
        Выйти из режима
      </button>
    </div>
  )
}
