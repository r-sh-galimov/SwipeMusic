import { pushYandexDevLog } from './devLog'
import type { YandexAuthSession, YandexDeviceCode } from './types'

/**
 * OAuth client_id / secret официального клиента Яндекс Музыки (community Device Flow).
 * Собственное OAuth-приложение для ЯМ создать нельзя.
 */
export const YANDEX_MUSIC_OAUTH_CLIENT_ID =
  '23cabbbdc6cd418abb4b39c32c41195d'
export const YANDEX_MUSIC_OAUTH_CLIENT_SECRET =
  '53bc75238f0c4d08a118e51fe9203300'

const OAUTH_BASE = '/api/yandex-oauth'

function randomDeviceId(): string {
  return `swipe-music-${Math.random().toString(36).slice(2, 12)}`
}

export async function requestYandexDeviceCode(): Promise<YandexDeviceCode> {
  pushYandexDevLog({
    stage: 'auth',
    message: 'request device code',
  })
  const body = new URLSearchParams({
    client_id: YANDEX_MUSIC_OAUTH_CLIENT_ID,
    device_id: randomDeviceId(),
    device_name: 'SwipeMusic',
  })
  const response = await fetch(`${OAUTH_BASE}/device/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const text = await response.text()
  if (!response.ok) {
    pushYandexDevLog({
      stage: 'error',
      message: 'device code failed',
      detail: `HTTP ${response.status}: ${text.slice(0, 200)}`,
    })
    throw new Error(`Yandex OAuth device/code: HTTP ${response.status}`)
  }
  const data = JSON.parse(text) as {
    device_code: string
    user_code: string
    verification_url: string
    interval?: number
    expires_in: number
  }
  return {
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUrl: data.verification_url,
    intervalSec: Math.max(1, data.interval ?? 5),
    expiresIn: data.expires_in,
  }
}

export async function pollYandexDeviceToken(
  deviceCode: string,
  signal?: AbortSignal,
): Promise<YandexAuthSession> {
  const body = new URLSearchParams({
    grant_type: 'device_code',
    code: deviceCode,
    client_id: YANDEX_MUSIC_OAUTH_CLIENT_ID,
    client_secret: YANDEX_MUSIC_OAUTH_CLIENT_SECRET,
  })
  const response = await fetch(`${OAUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal,
  })
  const text = await response.text()
  const data = JSON.parse(text) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    token_type?: string
    error?: string
    error_description?: string
  }

  if (data.error === 'authorization_pending' || data.error === 'slow_down') {
    throw Object.assign(new Error(data.error), { pending: true as const })
  }

  if (!response.ok || !data.access_token) {
    pushYandexDevLog({
      stage: 'error',
      message: 'device token failed',
      detail: data.error_description ?? data.error ?? text.slice(0, 200),
    })
    throw new Error(
      data.error_description ??
        data.error ??
        `Yandex OAuth token: HTTP ${response.status}`,
    )
  }

  pushYandexDevLog({
    stage: 'auth',
    message: 'device token received',
  })

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:
      typeof data.expires_in === 'number'
        ? Date.now() + data.expires_in * 1000
        : undefined,
    tokenType: data.token_type,
  }
}

export async function runYandexDeviceAuth(options?: {
  onCode?: (code: YandexDeviceCode) => void
  signal?: AbortSignal
}): Promise<YandexAuthSession> {
  const code = await requestYandexDeviceCode()
  options?.onCode?.(code)

  const deadline = Date.now() + code.expiresIn * 1000
  let intervalMs = code.intervalSec * 1000

  while (Date.now() < deadline) {
    if (options?.signal?.aborted) {
      throw new Error('Yandex OAuth aborted')
    }
    await new Promise((resolve) => window.setTimeout(resolve, intervalMs))
    try {
      return await pollYandexDeviceToken(code.deviceCode, options?.signal)
    } catch (error) {
      const pending =
        error instanceof Error &&
        'pending' in error &&
        (error as { pending?: boolean }).pending
      if (pending) {
        if (
          error instanceof Error &&
          error.message === 'slow_down'
        ) {
          intervalMs += 1000
        }
        continue
      }
      throw error
    }
  }

  throw new Error('Yandex OAuth: время подтверждения истекло')
}
