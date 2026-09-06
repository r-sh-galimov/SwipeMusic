import type { Track } from '../types/track'
import type { LibraryNode, LibraryProvider } from '../types/libraryProvider'
import { libraryProviderRegistry } from './LibraryProviderRegistry'

const ALL_ID = 'all'
const SEP = '::'

export function encodeLibraryNodeId(providerId: string, localId: string): string {
  return `${providerId}${SEP}${localId}`
}

export function decodeLibraryNodeId(nodeId: string): {
  providerId: string
  localId: string
} {
  const index = nodeId.indexOf(SEP)
  if (index <= 0) {
    return { providerId: ALL_ID, localId: nodeId }
  }
  return {
    providerId: nodeId.slice(0, index),
    localId: nodeId.slice(index + SEP.length),
  }
}

function mapNodes(
  providerId: string,
  nodes: LibraryNode[],
): LibraryNode[] {
  return nodes.map((node) => ({
    ...node,
    id: encodeLibraryNodeId(providerId, node.id),
    parentId: node.parentId
      ? encodeLibraryNodeId(providerId, node.parentId)
      : undefined,
    sourceId: node.sourceId || providerId,
  }))
}

function dedupeTracks(tracks: Track[]): Track[] {
  const seen = new Set<string>()
  const result: Track[] = []
  for (const track of tracks) {
    if (seen.has(track.id)) {
      continue
    }
    seen.add(track.id)
    result.push(track)
  }
  return result
}

/**
 * Оркестратор всех LibraryProvider.
 * UI работает только через этот сервис.
 */
export class LibraryService {
  private activeProviderId: string = ALL_ID
  private breadcrumbCache = new Map<string, LibraryNode[]>()

  listProviders(): Array<{ id: string; label: string }> {
    return [
      { id: ALL_ID, label: 'All Sources' },
      ...libraryProviderRegistry.list().map((provider) => ({
        id: provider.id,
        label: provider.label,
      })),
    ]
  }

  getActiveProviderId(): string {
    return this.activeProviderId
  }

  setActiveProviderId(providerId: string): void {
    this.activeProviderId = providerId
    this.breadcrumbCache.clear()
  }

  private providersForScope(): LibraryProvider[] {
    if (this.activeProviderId === ALL_ID) {
      return libraryProviderRegistry.list()
    }
    return [libraryProviderRegistry.get(this.activeProviderId)]
  }

  async getRoot(): Promise<LibraryNode[]> {
    const providers = this.providersForScope()
    const roots: LibraryNode[] = []

    for (const provider of providers) {
      try {
        const localRoots = await provider.getRoot()
        roots.push(...mapNodes(provider.id, localRoots))
      } catch {
        // Один провайдер не должен ронять дерево Library.
      }
    }

    return roots
  }

  async getChildren(nodeId: string): Promise<LibraryNode[]> {
    const { providerId, localId } = decodeLibraryNodeId(nodeId)
    if (providerId === ALL_ID) {
      return []
    }
    try {
      const provider = libraryProviderRegistry.get(providerId)
      const children = await provider.getChildren(localId)
      return mapNodes(provider.id, children)
    } catch {
      return []
    }
  }

  async getTracks(nodeId: string): Promise<Track[]> {
    const { providerId, localId } = decodeLibraryNodeId(nodeId)
    if (providerId === ALL_ID) {
      return []
    }
    try {
      const provider = libraryProviderRegistry.get(providerId)
      return await provider.getTracks(localId)
    } catch {
      return []
    }
  }

  async search(query: string): Promise<Track[]> {
    const normalized = query.trim()
    if (!normalized) {
      return []
    }

    const providers = this.providersForScope()
    const settled = await Promise.allSettled(
      providers.map((provider) => provider.search(normalized)),
    )
    const tracks = settled.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : [],
    )
    return dedupeTracks(tracks)
  }

  /**
   * Обновление всех провайдеров в scope.
   * Возвращает мягкие ошибки отдельных источников (частичный успех OK).
   */
  async refresh(): Promise<string[]> {
    this.breadcrumbCache.clear()
    const providers = this.providersForScope()
    const settled = await Promise.allSettled(
      providers.map((provider) => provider.refresh()),
    )

    const failures = settled.flatMap((result, index) => {
      if (result.status !== 'rejected') {
        return []
      }
      const provider = providers[index]
      const detail =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason)
      return [`${provider.label}: ${detail}`]
    })

    if (failures.length > 0 && failures.length === providers.length) {
      throw new Error(failures.join(' · '))
    }

    return failures
  }

  async getBreadcrumb(nodeId: string | null): Promise<LibraryNode[]> {
    if (!nodeId) {
      return []
    }

    const cached = this.breadcrumbCache.get(nodeId)
    if (cached) {
      return cached
    }

    const chain: LibraryNode[] = []
    let currentId: string | undefined = nodeId

    while (currentId) {
      const { providerId, localId } = decodeLibraryNodeId(currentId)
      if (providerId === ALL_ID) {
        break
      }

      const provider = libraryProviderRegistry.get(providerId)
      const siblings =
        chain.length === 0
          ? await this.findNodeAcross(provider, localId)
          : null

      const node =
        siblings ??
        (await this.findNodeInProvider(provider, localId))

      if (!node) {
        break
      }

      chain.unshift({
        ...node,
        id: encodeLibraryNodeId(provider.id, node.id),
        parentId: node.parentId
          ? encodeLibraryNodeId(provider.id, node.parentId)
          : undefined,
      })
      currentId = node.parentId
        ? encodeLibraryNodeId(provider.id, node.parentId)
        : undefined
    }

    this.breadcrumbCache.set(nodeId, chain)
    return chain
  }

  private async findNodeAcross(
    provider: LibraryProvider,
    localId: string,
  ): Promise<LibraryNode | null> {
    return this.findNodeInProvider(provider, localId)
  }

  private async findNodeInProvider(
    provider: LibraryProvider,
    localId: string,
  ): Promise<LibraryNode | null> {
    const queue = await provider.getRoot()
    const seen = new Set<string>()

    while (queue.length > 0) {
      const node = queue.shift()
      if (!node || seen.has(node.id)) {
        continue
      }
      seen.add(node.id)
      if (node.id === localId) {
        return node
      }
      const children = await provider.getChildren(node.id)
      queue.push(...children)
    }

    return null
  }
}

export const libraryService = new LibraryService()
