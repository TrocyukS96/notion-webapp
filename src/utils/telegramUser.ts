import { retrieveLaunchParams, retrieveRawInitData } from '@telegram-apps/sdk'

export interface TelegramUserData {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

function normalizeUser(raw: {
  id: number | string
  first_name?: string
  firstName?: string
  last_name?: string
  lastName?: string
  username?: string
  language_code?: string
  languageCode?: string
}): TelegramUserData | null {
  const id = typeof raw.id === 'string' ? Number(raw.id) : raw.id
  const firstName = raw.first_name ?? raw.firstName

  if (!Number.isFinite(id) || !firstName) {
    return null
  }

  return {
    id,
    first_name: firstName,
    last_name: raw.last_name ?? raw.lastName,
    username: raw.username,
    language_code: raw.language_code ?? raw.languageCode,
  }
}

function parseUserFromInitData(initData: string): TelegramUserData | null {
  if (!initData) return null

  try {
    const params = new URLSearchParams(initData)
    const rawUser = params.get('user')
    if (!rawUser) return null

    return normalizeUser(JSON.parse(rawUser))
  } catch {
    return null
  }
}

function getInitDataFromUrl(): string | null {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash

  if (!hash) return null

  const params = new URLSearchParams(hash)
  return params.get('tgWebAppData') ?? params.get('initData')
}

function getInitDataFromSdk(): string | null {
  try {
    return retrieveRawInitData() ?? null
  } catch {
    return null
  }
}

export function isTelegramWebApp(): boolean {
  return Boolean(window.Telegram?.WebApp)
}

export function resolveTelegramUser(): TelegramUserData | null {
  const webApp = window.Telegram?.WebApp

  if (webApp?.initDataUnsafe?.user) {
    const user = normalizeUser(webApp.initDataUnsafe.user)
    if (user) return user
  }

  const initDataCandidates = [
    webApp?.initData,
    getInitDataFromUrl(),
    getInitDataFromSdk(),
  ]

  for (const initData of initDataCandidates) {
    if (!initData) continue

    const user = parseUserFromInitData(initData)
    if (user) return user
  }

  try {
    const launchParams = retrieveLaunchParams(true)
    const launchUser = launchParams.tgWebAppData?.user

    if (launchUser) {
      const user = normalizeUser(launchUser)
      if (user) return user
    }
  } catch {
    // Not running inside Telegram Mini App.
  }

  return null
}

export function resolveTelegramUserId(): number | null {
  return resolveTelegramUser()?.id ?? null
}
