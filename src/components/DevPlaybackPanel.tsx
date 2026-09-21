import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getPlaybackResolver,
  type PlaybackCandidate,
  type PlaybackResolution,
  type PlaybackResolverConfig,
} from '../services/playbackResolver'
import { usePlayerStore } from '../store/playerStore'
import type { Track } from '../types/track'
import { buildRankedList, VISUAL_STYLES } from './dev/playbackDebug/classify'
import { buildDecision, describeConfigFlags, uniqueProviderIds } from './dev/playbackDebug/decision'
import { buildResolverReport, downloadResolverReport } from './dev/playbackDebug/report'
import { runDevResolveTrace } from './dev/playbackDebug/trace'
import type {
  CandidateFilter,
  DevResolveTrace,
  RankedCandidate,
} from './dev/playbackDebug/types'

const STATUS_FILTERS: Array<{ id: CandidateFilter; label: string }> = [
  { id: 'available', label: 'Available' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'selected', label: 'Selected' },
  { id: 'preview', label: 'Preview' },
  { id: 'stream', label: 'Stream' },
  { id: 'local', label: 'Local' },
  { id: 'remote', label: 'Remote' },
]

function matchesFilter(item: RankedCandidate, filter: CandidateFilter): boolean {
  if (filter.startsWith('provider:')) {
    return item.providerId === filter.slice('provider:'.length)
  }
  switch (filter) {
    case 'available':
      return item.available && Boolean(item.url)
    case 'rejected':
      return !item.available || !item.url
    case 'selected':
      return item.selected
    case 'preview':
    case 'stream':
    case 'local':
    case 'remote':
      return item.type === filter
    default:
      return true
  }
}

function CandidateInspector({ item }: { item: RankedCandidate }) {
  const [open, setOpen] = useState(false)
  const style = VISUAL_STYLES[item.visualKind]

  return (
    <li className={`rounded-lg border px-2 py-1.5 ${style.border}`}>
      <button
        type="button"
        className="flex w-full items-start justify-between gap-2 text-left"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>
          <span className="text-[var(--color-fg)]">
            {item.providerId} · {item.type}
          </span>
          <span className={`ml-2 inline-block rounded px-1.5 py-0.5 text-[10px] ${style.badge}`}>
            {style.label}
          </span>
        </span>
        <span className="shrink-0 text-[var(--color-muted)]">{open ? '▾' : '▸'}</span>
      </button>
      <p className="mt-1 text-[var(--color-muted)]">
        Priority: {item.priority} · effective: {item.effectiveScore}
      </p>
      {open ? (
        <div className="mt-2 space-y-1 border-t border-[var(--color-border)] pt-2 text-[var(--color-muted)]">
          <p>
            <span className="text-[var(--color-fg)]">Provider:</span> {item.providerId}
          </p>
          <p>
            <span className="text-[var(--color-fg)]">Type:</span> {item.type}
          </p>
          <p>
            <span className="text-[var(--color-fg)]">Priority:</span> {item.priority}
          </p>
          <p>
            <span className="text-[var(--color-fg)]">Effective Priority:</span>{' '}
            {item.effectiveScore}
          </p>
          <p>
            <span className="text-[var(--color-fg)]">Available:</span>{' '}
            {String(item.available)}
          </p>
          <p>
            <span className="text-[var(--color-fg)]">Reason:</span>{' '}
            {item.reason ?? '—'}
          </p>
          <p>
            <span className="text-[var(--color-fg)]">TrackId / URL:</span>{' '}
            {item.url ?? '—'}
          </p>
          <p>
            <span className="text-[var(--color-fg)]">Requires Premium:</span>{' '}
            {String(item.requiresPremium ?? false)}
          </p>
          <p>
            <span className="text-[var(--color-fg)]">Label:</span> {item.label ?? '—'}
          </p>
          <p>
            <span className="text-[var(--color-fg)]">Id:</span> {item.id}
          </p>
          <pre className="mt-1 max-h-48 overflow-auto rounded bg-[var(--color-bg)]/70 p-2 text-[10px] text-[var(--color-fg)]">
            {JSON.stringify(
              {
                id: item.id,
                providerId: item.providerId,
                type: item.type,
                priority: item.priority,
                available: item.available,
                reason: item.reason,
                url: item.url,
                label: item.label,
                requiresPremium: item.requiresPremium,
              } satisfies PlaybackCandidate,
              null,
              2,
            )}
          </pre>
        </div>
      ) : null}
    </li>
  )
}

/**
 * Dev-only Debug Center для PlaybackResolver.
 * Только UI + измерения; логику Resolver / Player / Queue не меняет.
 */
export function DevPlaybackPanel() {
  const [candidates, setCandidates] = useState<PlaybackCandidate[]>([])
  const [resolution, setResolution] = useState<PlaybackResolution | null>(null)
  const [overrideId, setOverrideId] = useState('')
  const [config, setConfig] = useState<PlaybackResolverConfig>(() =>
    getPlaybackResolver().getConfig(),
  )
  const [trace, setTrace] = useState<DevResolveTrace | null>(null)
  const [filters, setFilters] = useState<CandidateFilter[]>([])
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'error'>('idle')
  const [busy, setBusy] = useState(false)
  const [traceError, setTraceError] = useState<string | null>(null)
  const [lastResolvedTrack, setLastResolvedTrack] = useState<Track | null>(null)
  const currentTrack = usePlayerStore((state) => state.currentTrack)

  const refresh = useCallback(() => {
    const resolver = getPlaybackResolver()
    setCandidates(resolver.getLastCandidates())
    setResolution(resolver.getLastResolution())
    setOverrideId(resolver.getDevOverride()?.candidateId ?? '')
    setConfig(resolver.getConfig())
  }, [])

  useEffect(() => {
    return getPlaybackResolver().subscribe(() => {
      refresh()
    })
  }, [refresh])

  const ranked = useMemo(
    () => buildRankedList(candidates, resolution?.candidate.id ?? null, config),
    [candidates, resolution, config],
  )

  const decision = useMemo(
    () => buildDecision(ranked, resolution, overrideId || null, config),
    [ranked, resolution, overrideId, config],
  )

  const configFlags = useMemo(() => describeConfigFlags(config), [config])

  const providerFilters = useMemo(
    () =>
      uniqueProviderIds(candidates).map((id) => ({
        id: `provider:${id}` as CandidateFilter,
        label: id,
      })),
    [candidates],
  )

  const filtered = useMemo(() => {
    if (filters.length === 0) {
      return ranked
    }
    return ranked.filter((item) => filters.every((filter) => matchesFilter(item, filter)))
  }, [ranked, filters])

  const replayTrack = lastResolvedTrack ?? currentTrack

  const report = useMemo(
    () =>
      buildResolverReport({
        resolution,
        ranked,
        config,
        decision,
        timings: trace?.timings ?? null,
        timeline: trace?.timeline ?? [],
        overrideId,
        trackId: resolution?.trackId ?? currentTrack?.id ?? null,
      }),
    [resolution, ranked, config, decision, trace, overrideId, currentTrack?.id],
  )

  const reportJson = useMemo(() => JSON.stringify(report, null, 2), [report])

  const runTrace = useCallback(async (track: Track) => {
    setBusy(true)
    setTraceError(null)
    try {
      const next = await runDevResolveTrace(track)
      setTrace(next)
      setLastResolvedTrack(track)
      if (next.error) {
        setTraceError(next.error)
      }
      refresh()
    } catch (err) {
      setTraceError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }, [refresh])

  const toggleFilter = (id: CandidateFilter) => {
    setFilters((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  if (!import.meta.env.DEV) {
    return null
  }

  return (
    <section className="space-y-3 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 p-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-[var(--color-fg)]">
          Dev · PlaybackResolver Debug Center
        </p>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(VISUAL_STYLES) as Array<keyof typeof VISUAL_STYLES>).map(
            (key) => (
              <span
                key={key}
                className={`rounded px-1.5 py-0.5 text-[10px] ${VISUAL_STYLES[key].badge}`}
              >
                {VISUAL_STYLES[key].label}
              </span>
            ),
          )}
        </div>
      </div>

      <label className="flex flex-col gap-1 text-[var(--color-muted)]">
        Force candidate
        <select
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-[var(--color-fg)]"
          value={overrideId}
          onChange={(event) => {
            const value = event.target.value
            setOverrideId(value)
            getPlaybackResolver().setDevOverride(
              value ? { candidateId: value } : null,
            )
          }}
        >
          <option value="">Auto (best available)</option>
          {ranked.map((item) => (
            <option key={item.id} value={item.id} disabled={!item.available}>
              {item.id}
              {item.available ? '' : ' (unavailable)'}
              {item.label ? ` · ${item.label}` : ''}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-[var(--color-fg)] disabled:opacity-40"
          disabled={!replayTrack || busy}
          title="Повторить Resolve без Player (последний resolved track)"
          onClick={() => {
            if (!replayTrack) {
              return
            }
            void runTrace(replayTrack)
          }}
        >
          Replay Resolve
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-[var(--color-fg)] disabled:opacity-40"
          disabled={!currentTrack || busy}
          title="Resolve для текущего Track из плеера (без Player)"
          onClick={() => {
            if (!currentTrack) {
              return
            }
            void runTrace(currentTrack)
          }}
        >
          Replay Current
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-[var(--color-fg)] disabled:opacity-40"
          disabled={ranked.length === 0}
          onClick={() => {
            void navigator.clipboard
              .writeText(reportJson)
              .then(() => {
                setCopyState('done')
                window.setTimeout(() => setCopyState('idle'), 1500)
              })
              .catch(() => {
                setCopyState('error')
                window.setTimeout(() => setCopyState('idle'), 1500)
              })
          }}
        >
          Copy Resolver Report
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-[var(--color-fg)] disabled:opacity-40"
          disabled={ranked.length === 0 && !trace?.timings}
          onClick={() => downloadResolverReport(report)}
        >
          Download Report
        </button>
        {busy ? (
          <span className="self-center text-[var(--color-muted)]">Resolving…</span>
        ) : null}
        {copyState === 'done' ? (
          <span className="self-center text-[var(--color-accent)]">Copied</span>
        ) : null}
        {copyState === 'error' ? (
          <span className="self-center text-rose-600">Copy failed</span>
        ) : null}
      </div>

      {traceError ? (
        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-1.5 text-rose-700 dark:text-rose-300">
          {traceError}
        </p>
      ) : null}

      <div className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-2">
        <p className="font-medium text-[var(--color-fg)]">Resolver Config</p>
        <ul className="space-y-0.5 text-[var(--color-muted)]">
          <li>preferLocal = {String(configFlags.preferLocal)}</li>
          <li>preferPreview = {String(configFlags.preferPreview)}</li>
          <li>previewPriority = {configFlags.previewPriority}</li>
          <li>streamPriority = {configFlags.streamPriority}</li>
          <li>localPriority = {configFlags.localPriority}</li>
          <li>remotePriority = {configFlags.remotePriority}</li>
        </ul>
        <p className="pt-1 text-[var(--color-fg)]">providerBoost</p>
        <ul className="space-y-0.5 text-[var(--color-muted)]">
          {Object.entries(config.providerBoost).map(([id, value]) => (
            <li key={id}>
              {id} = {value}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-2">
        <p className="font-medium text-[var(--color-fg)]">PlaybackResolver Timeline</p>
        {trace && trace.timeline.length > 0 ? (
          <ol className="space-y-1.5 font-mono text-[var(--color-muted)]">
            {trace.timeline.map((event, index) => (
              <li key={`${event.ms}-${index}`} className="whitespace-pre-wrap">
                <span className="text-[var(--color-fg)]">
                  {String(event.ms).padStart(5, ' ')} ms
                </span>
                {'  '}
                {event.label}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-[var(--color-muted)]">
            Run Replay Resolve to capture timeline timings.
          </p>
        )}
      </div>

      <div className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-2">
        <p className="font-medium text-[var(--color-fg)]">Performance</p>
        {trace?.timings ? (
          <div className="space-y-1 text-[var(--color-muted)]">
            <p>
              Resolve time{' '}
              <span className="text-[var(--color-fg)]">{trace.timings.resolveMs} ms</span>
            </p>
            <p className="pt-1 text-[var(--color-fg)]">Provider timings</p>
            <ul className="space-y-0.5">
              {trace.timings.providers.map((item) => (
                <li key={item.providerId}>
                  {item.providerId}{' '}
                  <span className="text-[var(--color-fg)]">{item.ms} ms</span>
                </li>
              ))}
            </ul>
            <p>
              Sorting{' '}
              <span className="text-[var(--color-fg)]">{trace.timings.sortingMs} ms</span>
            </p>
            <p>
              Decision{' '}
              <span className="text-[var(--color-fg)]">{trace.timings.decisionMs} ms</span>
            </p>
          </div>
        ) : (
          <p className="text-[var(--color-muted)]">
            No timings yet. Use Replay Resolve.
          </p>
        )}
      </div>

      <div className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-2">
        <p className="font-medium text-[var(--color-fg)]">Resolver Decision</p>
        <p className="text-[var(--color-muted)]">
          Track: {resolution?.trackId ?? currentTrack?.id ?? '—'}
        </p>
        <p className="text-[var(--color-muted)]">
          Candidates found: {decision.candidatesFound}
        </p>
        <ul className="space-y-2">
          {decision.items.map((item) => {
            const kindStyle =
              item.kind === 'accepted'
                ? VISUAL_STYLES.selected
                : item.kind === 'rejected'
                  ? VISUAL_STYLES.rejected
                  : VISUAL_STYLES.skipped
            return (
              <li
                key={`${item.kind}-${item.candidateId}`}
                className={`rounded border px-2 py-1.5 ${kindStyle.border}`}
              >
                <p className={`inline-block rounded px-1.5 py-0.5 text-[10px] ${kindStyle.badge}`}>
                  {item.kind === 'accepted'
                    ? 'Accepted'
                    : item.kind === 'rejected'
                      ? 'Rejected'
                      : 'Skipped'}
                </p>
                <p className="mt-1 text-[var(--color-fg)]">{item.candidateId}</p>
                <p className="text-[var(--color-muted)]">Reason: {item.reason}</p>
              </li>
            )
          })}
        </ul>
        <p className="pt-1 text-[var(--color-fg)]">{decision.summary}</p>
      </div>

      <div className="space-y-2">
        <p className="font-medium text-[var(--color-fg)]">Filters</p>
        <div className="flex flex-wrap gap-1.5">
          {[...STATUS_FILTERS, ...providerFilters].map((filter) => {
            const active = filters.includes(filter.id)
            return (
              <button
                key={filter.id}
                type="button"
                className={`rounded-lg border px-2 py-1 ${
                  active
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-fg)]'
                    : 'border-[var(--color-border)] text-[var(--color-muted)]'
                }`}
                onClick={() => toggleFilter(filter.id)}
              >
                {filter.label}
              </button>
            )
          })}
          {filters.length > 0 ? (
            <button
              type="button"
              className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-[var(--color-muted)]"
              onClick={() => setFilters([])}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-2">
          <p className="font-medium text-[var(--color-fg)]">
            Candidate Inspector ({filtered.length})
          </p>
          <ul className="space-y-2 text-[var(--color-muted)]">
            {filtered.map((item) => (
              <CandidateInspector key={item.id} item={item} />
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-[var(--color-muted)]">
          {ranked.length === 0
            ? 'Play a track or run Replay to see resolver candidates.'
            : 'No candidates match the current filters.'}
        </p>
      )}
    </section>
  )
}
