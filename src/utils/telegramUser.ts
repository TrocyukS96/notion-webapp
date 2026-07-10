import {
  initDataUser,
  retrieveLaunchParams,
  retrieveRawInitData,
} from '@telegram-apps/sdk'
import {
  isLaunchParamsQuery,
  parseInitDataQuery,
  parseLaunchParamsQuery,
} from '@telegram-apps/transformers'

function getTelegramIdFromUrl(): number | null {
  const urlParams = new URLSearchParams(window.location.search);
  const tgIdFromQuery = urlParams.get('telegram_id');
  if (tgIdFromQuery) {
    const id = Number(tgIdFromQuery);
    if (Number.isFinite(id)) return id;
  }

  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const tgIdFromHash = hashParams.get('telegram_id');
  if (tgIdFromHash) {
    const id = Number(tgIdFromHash);
    if (Number.isFinite(id)) return id;
  }

  return null;
}

export interface TelegramUserData {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

function extractUserId(value: unknown): number | null {
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const rawId = record.id

  if (rawId == null) return null

  const id = typeof rawId === 'string' ? Number(rawId) : rawId
  return typeof id === 'number' && Number.isFinite(id) ? id : null
}

function toTelegramUser(
  id: number,
  raw?: Record<string, unknown>,
): TelegramUserData {
  return {
    id,
    first_name:
      (raw?.first_name as string | undefined) ??
      (raw?.firstName as string | undefined) ??
      'User',
    last_name:
      (raw?.last_name as string | undefined) ??
      (raw?.lastName as string | undefined),
    username: raw?.username as string | undefined,
    language_code:
      (raw?.language_code as string | undefined) ??
      (raw?.languageCode as string | undefined),
  }
}

function userFromInitDataObject(initData: unknown): TelegramUserData | null {
  if (!initData || typeof initData !== 'object') return null

  const data = initData as Record<string, unknown>
  const user = data.user ?? data.receiver
  const id = extractUserId(user)

  if (id == null) return null

  return toTelegramUser(id, user as Record<string, unknown>)
}

function parseUserFromInitDataString(initData: string): TelegramUserData | null {
  if (!initData) return null

  try {
    const parsed = parseInitDataQuery(initData)
    const user = userFromInitDataObject(parsed)
    if (user) return user
  } catch {
    // Fall back to manual parsing below.
  }

  try {
    const params = new URLSearchParams(initData)
    const rawUser = params.get('user') ?? params.get('receiver')
    if (!rawUser) return null

    const parsedUser = JSON.parse(rawUser) as Record<string, unknown>
    const id = extractUserId(parsedUser)
    if (id == null) return null

    return toTelegramUser(id, parsedUser)
  } catch {
    return null
  }
}

function getLaunchParamSources(): string[] {
  const sources = new Set<string>()

  if (window.location.hash.length > 1) {
    sources.add(window.location.hash.slice(1))
  }

  if (window.location.search.length > 1) {
    sources.add(window.location.search.slice(1))
  }

  return [...sources]
}

function getUserFromLaunchParams(): TelegramUserData | null {
  for (const source of getLaunchParamSources()) {
    if (!isLaunchParamsQuery(source)) continue

    try {
      const launchParams = parseLaunchParamsQuery(source)
      const user = userFromInitDataObject(launchParams.tgWebAppData)
      if (user) return user
    } catch {
      // Try the next source.
    }
  }

  return null
}

function getUserFromSdkLaunchParams(): TelegramUserData | null {
  try {
    const launchParams = retrieveLaunchParams(true)
    const user = userFromInitDataObject(launchParams.tgWebAppData)
    if (user) return user
  } catch {
    // Ignore and continue with other sources.
  }

  return null
}

function getUserFromSdkInitData(): TelegramUserData | null {
  try {
    const sdkUser = initDataUser()
    const id = extractUserId(sdkUser)
    if (id != null) {
      return toTelegramUser(id, sdkUser as unknown as Record<string, unknown>)
    }
  } catch {
    // Ignore and continue with other sources.
  }

  return null
}

export function isTelegramWebApp(): boolean {
  return Boolean(window.Telegram?.WebApp)
}

export function resolveTelegramUser(): TelegramUserData | null {
  const webApp = window.Telegram?.WebApp

  const unsafeUser = webApp?.initDataUnsafe?.user
  const unsafeUserId = extractUserId(unsafeUser)

  if (unsafeUserId != null) {
    return toTelegramUser(unsafeUserId, unsafeUser as unknown as Record<string, unknown>)
  }

  const initDataCandidates = [
    webApp?.initData,
    (() => {
      try {
        return retrieveRawInitData()
      } catch {
        return null
      }
    })(),
  ]

  for (const initData of initDataCandidates) {
    if (!initData) continue

    const user = parseUserFromInitDataString(initData)
    if (user) return user
  }

  return (
    getUserFromSdkInitData() ??
    getUserFromSdkLaunchParams() ??
    getUserFromLaunchParams()
  )
}

export function resolveTelegramUserId(): number | null {
  const user = resolveTelegramUser()
  if (user) return user.id

  const urlId = getTelegramIdFromUrl()
  return urlId
}