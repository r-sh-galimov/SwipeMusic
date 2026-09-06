import { AdapterLibraryProvider } from '../../library/providers/AdapterLibraryProvider'
import { createStubLibraryProvider } from '../../library/providers/createStubLibraryProvider'
import { HierarchicalPathLibraryProvider } from '../../library/providers/HierarchicalPathLibraryProvider'
import type { MusicSourceAdapter } from '../../sources/MusicSourceAdapter'
import { createCustomWebsiteAdapter } from '../../sources/adapters/web'
import { createLocalFolderAdapter } from '../../sources/adapters/local-folder'
import { createMockMusicSourceAdapter } from '../../sources/adapters/mock'
import {
  createSpotifyAdapter,
  createSpotifyLibraryProvider,
  createSpotifySearchProvider,
  getSpotifyAdapter,
} from '../../sources/adapters/spotify'
import { createVKMusicAdapter } from '../../sources/adapters/vk-music'
import {
  createYandexMusicAdapter,
  createYandexLibraryProvider,
  createYandexSearchProvider,
  getYandexMusicAdapter,
} from '../../sources/adapters/yandex-music'
import { createZaycevAdapter } from '../../sources/adapters/zaycev'
import { sourceRegistry } from '../../sources/registry'
import type {
  ProviderCapabilities,
  ProviderPlugin,
  ProviderSupportLevel,
} from '../types'

function caps(
  partial: Partial<ProviderCapabilities>,
): ProviderCapabilities {
  return {
    search: false,
    library: false,
    streaming: false,
    download: false,
    artwork: false,
    authentication: false,
    lyrics: false,
    previewPlayback: false,
    ...partial,
  }
}

function resolveAdapter(
  id: string,
  factory: () => MusicSourceAdapter,
): MusicSourceAdapter {
  if (sourceRegistry.has(id)) {
    return sourceRegistry.get(id)
  }
  return factory()
}

function libraryForAdapter(adapter: MusicSourceAdapter) {
  if (adapter.type === 'filesystem') {
    return new HierarchicalPathLibraryProvider(adapter)
  }
  if (adapter.id === 'mock') {
    return new AdapterLibraryProvider(adapter)
  }
  return createStubLibraryProvider({
    id: adapter.id,
    label: adapter.label,
  })
}

function definePlugin(options: {
  id: string
  name: string
  version?: string
  author?: string
  icon?: string
  defaultPriority: number
  defaultEnabled?: boolean
  capabilities: ProviderCapabilities
  supportLevel?: ProviderSupportLevel
  supportDescription?: string
  factory: () => MusicSourceAdapter
}): ProviderPlugin {
  return {
    manifest: {
      id: options.id,
      name: options.name,
      version: options.version ?? '1.0.0',
      author: options.author,
      icon: options.icon,
      defaultPriority: options.defaultPriority,
      defaultEnabled: options.defaultEnabled ?? false,
      capabilities: options.capabilities,
      supportLevel: options.supportLevel ?? 'official',
      supportDescription: options.supportDescription,
    },
    createMusicSourceAdapter: () =>
      resolveAdapter(options.id, options.factory),
    createLibraryProvider: () => {
      const adapter = resolveAdapter(options.id, options.factory)
      return libraryForAdapter(adapter)
    },
  }
}

/** Встроенные плагины — одна точка расширения списка. */
export const builtinProviderPlugins: ProviderPlugin[] = [
  definePlugin({
    id: 'mock',
    name: 'Demo library',
    defaultPriority: 0,
    defaultEnabled: true,
    icon: 'demo',
    supportLevel: 'official',
    capabilities: caps({
      search: true,
      library: true,
      streaming: true,
      previewPlayback: true,
    }),
    factory: createMockMusicSourceAdapter,
  }),
  {
    manifest: {
      id: 'spotify',
      name: 'Spotify',
      version: '1.0.0',
      icon: 'spotify',
      defaultPriority: 10,
      defaultEnabled: false,
      supportLevel: 'official',
      supportDescription:
        'Официальный Spotify Web API и Web Playback SDK.',
      capabilities: caps({
        search: true,
        library: true,
        streaming: true,
        artwork: true,
        authentication: true,
        previewPlayback: true,
      }),
    },
    createMusicSourceAdapter: () =>
      resolveAdapter('spotify', createSpotifyAdapter),
    createLibraryProvider: () => createSpotifyLibraryProvider(),
    createSearchProvider: () => createSpotifySearchProvider(),
    createAuthenticationProvider: () =>
      getSpotifyAdapter().createAuthenticationProvider(),
  },
  {
    manifest: {
      id: 'yandex-music',
      name: 'Яндекс Музыка',
      version: '1.0.0',
      icon: 'yandex',
      defaultPriority: 20,
      defaultEnabled: false,
      supportLevel: 'experimental',
      supportDescription:
        'Использует внутренний API Яндекс Музыки. Работа не гарантируется после обновлений сервиса.',
      capabilities: caps({
        search: true,
        library: true,
        streaming: true,
        artwork: true,
        authentication: true,
        previewPlayback: true,
      }),
    },
    createMusicSourceAdapter: () =>
      resolveAdapter('yandex-music', createYandexMusicAdapter),
    createLibraryProvider: () => createYandexLibraryProvider(),
    createSearchProvider: () => createYandexSearchProvider(),
    createAuthenticationProvider: () =>
      getYandexMusicAdapter().createAuthenticationProvider(),
  },
  definePlugin({
    id: 'vk-music',
    name: 'VK Музыка',
    defaultPriority: 30,
    supportLevel: 'experimental',
    supportDescription:
      'Заготовка. Полноценный API ещё не подключён.',
    capabilities: caps({
      search: true,
      library: true,
      streaming: true,
      authentication: true,
    }),
    factory: createVKMusicAdapter,
  }),
  definePlugin({
    id: 'zaycev',
    name: 'Zaycev.net',
    defaultPriority: 40,
    supportLevel: 'community',
    capabilities: caps({
      search: true,
      library: true,
      streaming: true,
      download: true,
    }),
    factory: createZaycevAdapter,
  }),
  definePlugin({
    id: 'local-folder',
    name: 'Local Music',
    defaultPriority: 50,
    icon: 'folder',
    supportLevel: 'official',
    capabilities: caps({
      search: true,
      library: true,
      streaming: true,
    }),
    factory: createLocalFolderAdapter,
  }),
  definePlugin({
    id: 'custom-website',
    name: 'Custom website',
    defaultPriority: 60,
    supportLevel: 'community',
    capabilities: caps({
      search: true,
      library: true,
      streaming: true,
    }),
    factory: () => createCustomWebsiteAdapter(),
  }),
]
